import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 3003;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Payment types matching your purchase system
export enum PaymentMethod {
    COD = 'cod',
    CREDIT_CARD = 'credit_card',
    DEBIT_CARD = 'debit_card',
    PAYPAL = 'paypal',
    APPLE_PAY = 'apple_pay',
    GOOGLE_PAY = 'google_pay'
}

export interface PaymentDetails {
    transactionId?: string;
    cardLast4?: string;
    cardBrand?: string;
    paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
    paidAt?: Date;
    failureReason?: string;
}

export interface ShippingAddress {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    fullName: string;
    phoneNumber: string;
}

export interface PaymentRecord {
    id: string;
    purchaseId: string;
    userId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    paymentDetails: PaymentDetails;
    billingAddress?: ShippingAddress;
    paymentToken?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface RefundRecord {
    id: string;
    paymentId: string;
    purchaseId: string;
    amount: number;
    reason: string;
    status: 'pending' | 'completed' | 'failed';
    refundTransactionId?: string;
    createdAt: Date;
    processedAt?: Date;
}

// Mock payment and refund storage
const payments: PaymentRecord[] = [];
const refunds: RefundRecord[] = [];

// Simulate payment processing delays
const simulateProcessingDelay = () => {
    return new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));
};

// Generate mock card details for successful payments
const generateMockCardDetails = (paymentMethod: PaymentMethod) => {
    if (paymentMethod === PaymentMethod.CREDIT_CARD || paymentMethod === PaymentMethod.DEBIT_CARD) {
        const cardBrands = ['Visa', 'Mastercard', 'American Express'];
        const cardBrand = cardBrands[Math.floor(Math.random() * cardBrands.length)];
        const cardLast4 = Math.floor(1000 + Math.random() * 9000).toString();

        return { cardBrand, cardLast4 };
    }
    return {};
};

// Process payment
app.post('/payments/process', async (req, res) => {
    const {
        purchaseId,
        amount,
        paymentMethod,
        userId,
        paymentToken,
        billingAddress
    } = req.body;

    // Validate required fields
    if (!purchaseId || !amount || !paymentMethod || !userId) {
        return res.status(400).json({
            error: 'Missing required fields',
            required: ['purchaseId', 'amount', 'paymentMethod', 'userId']
        });
    }

    // Validate payment method
    if (!Object.values(PaymentMethod).includes(paymentMethod)) {
        return res.status(400).json({
            error: 'Invalid payment method',
            validMethods: Object.values(PaymentMethod)
        });
    }

    // COD payments don't need processing
    if (paymentMethod === PaymentMethod.COD) {
        const codPayment: PaymentRecord = {
            id: uuidv4(),
            purchaseId,
            amount,
            paymentMethod,
            userId,
            paymentDetails: {
                paymentStatus: 'pending' // Will be completed on delivery
            },
            billingAddress,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        payments.push(codPayment);
        return res.json({
            success: true,
            data: codPayment,
            message: 'COD payment registered successfully'
        });
    }

    // Validate payment token for card payments
    if ([PaymentMethod.CREDIT_CARD, PaymentMethod.DEBIT_CARD].includes(paymentMethod) && !paymentToken) {
        return res.status(400).json({
            error: 'Payment token required for card payments'
        });
    }

    // Simulate processing delay
    await simulateProcessingDelay();

    // Simulate payment failures (10% failure rate)
    const shouldFail = Math.random() < 0.1;

    if (shouldFail) {
        const failureReasons = [
            'Payment declined by bank',
            'Insufficient funds',
            'Card expired',
            'Invalid payment token',
            'Payment method not supported'
        ];

        const failureReason = failureReasons[Math.floor(Math.random() * failureReasons.length)];

        const failedPayment: PaymentRecord = {
            id: uuidv4(),
            purchaseId,
            amount,
            paymentMethod,
            userId,
            paymentDetails: {
                paymentStatus: 'failed',
                failureReason
            },
            billingAddress,
            paymentToken,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        payments.push(failedPayment);
        return res.status(400).json({
            error: 'Payment failed',
            data: failedPayment
        });
    }

    // Successful payment
    const mockCardDetails = generateMockCardDetails(paymentMethod);
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const successfulPayment: PaymentRecord = {
        id: uuidv4(),
        purchaseId,
        amount,
        paymentMethod,
        userId,
        paymentDetails: {
            paymentStatus: 'completed',
            transactionId,
            paidAt: new Date(),
            ...mockCardDetails
        },
        billingAddress,
        paymentToken,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    payments.push(successfulPayment);
    res.json({
        success: true,
        data: successfulPayment,
        message: 'Payment processed successfully'
    });
});

// Get payment by ID
app.get('/payments/:id', (req, res) => {
    const { id } = req.params;
    const payment = payments.find(p => p.id === id);

    if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
    }

    res.json({ success: true, data: payment });
});

// Get payments by purchase ID
app.get('/payments/purchase/:purchaseId', (req, res) => {
    const { purchaseId } = req.params;
    const purchasePayments = payments.filter(p => p.purchaseId === purchaseId);

    res.json({
        success: true,
        data: purchasePayments,
        count: purchasePayments.length
    });
});

// Get all payments with filtering
app.get('/payments', (req, res) => {
    const {
        status,
        userId,
        paymentMethod,
        page = '1',
        limit = '10',
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = req.query;

    let filteredPayments = [...payments];

    // Apply filters
    if (status) {
        filteredPayments = filteredPayments.filter(p => p.paymentDetails.paymentStatus === status);
    }

    if (userId) {
        filteredPayments = filteredPayments.filter(p => p.userId === userId);
    }

    if (paymentMethod) {
        filteredPayments = filteredPayments.filter(p => p.paymentMethod === paymentMethod);
    }

    // Apply sorting
    filteredPayments.sort((a, b) => {
        const aValue = sortBy === 'amount' ? a.amount : new Date(a.createdAt).getTime();
        const bValue = sortBy === 'amount' ? b.amount : new Date(b.createdAt).getTime();

        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    // Apply pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedPayments = filteredPayments.slice(startIndex, endIndex);

    res.json({
        success: true,
        data: paginatedPayments,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total: filteredPayments.length,
            totalPages: Math.ceil(filteredPayments.length / limitNum)
        }
    });
});

// Complete COD payment (called when order is delivered)
app.post('/payments/:id/complete', async (req, res) => {
    const { id } = req.params;
    const payment = payments.find(p => p.id === id);

    if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.paymentMethod !== PaymentMethod.COD) {
        return res.status(400).json({ error: 'Only COD payments can be completed manually' });
    }

    if (payment.paymentDetails.paymentStatus !== 'pending') {
        return res.status(400).json({ error: 'Payment is not pending' });
    }

    // Update payment status
    payment.paymentDetails.paymentStatus = 'completed';
    payment.paymentDetails.paidAt = new Date();
    payment.updatedAt = new Date();

    res.json({
        success: true,
        data: payment,
        message: 'COD payment completed successfully'
    });
});

// Refund payment
app.post('/payments/:id/refund', async (req, res) => {
    const { id } = req.params;
    const { amount, reason } = req.body;

    const payment = payments.find(p => p.id === id);
    if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.paymentDetails.paymentStatus !== 'completed') {
        return res.status(400).json({ error: 'Can only refund completed payments' });
    }

    // Check if already refunded
    const existingRefunds = refunds.filter(r => r.paymentId === id);
    const totalRefunded = existingRefunds
        .filter(r => r.status === 'completed')
        .reduce((sum, r) => sum + r.amount, 0);

    const refundAmount = amount || (payment.amount - totalRefunded);

    if (refundAmount <= 0) {
        return res.status(400).json({ error: 'Invalid refund amount' });
    }

    if (refundAmount > (payment.amount - totalRefunded)) {
        return res.status(400).json({
            error: 'Refund amount exceeds available refund balance',
            availableAmount: payment.amount - totalRefunded
        });
    }

    // Simulate refund processing
    await simulateProcessingDelay();

    const refund: RefundRecord = {
        id: uuidv4(),
        paymentId: payment.id,
        purchaseId: payment.purchaseId,
        amount: refundAmount,
        reason: reason || 'Customer request',
        status: 'completed',
        refundTransactionId: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        processedAt: new Date()
    };

    refunds.push(refund);

    // Update payment status if fully refunded
    const newTotalRefunded = totalRefunded + refundAmount;
    if (newTotalRefunded >= payment.amount) {
        payment.paymentDetails.paymentStatus = 'refunded';
        payment.updatedAt = new Date();
    }

    res.json({
        success: true,
        data: refund,
        message: 'Refund processed successfully'
    });
});

// Get refunds for a payment
app.get('/payments/:id/refunds', (req, res) => {
    const { id } = req.params;
    const paymentRefunds = refunds.filter(r => r.paymentId === id);

    res.json({
        success: true,
        data: paymentRefunds,
        total: paymentRefunds.reduce((sum, r) => sum + (r.status === 'completed' ? r.amount : 0), 0)
    });
});

// Validate payment method
app.post('/payments/validate-method', (req, res) => {
    const { paymentMethod, cardNumber, expiryDate, cvv } = req.body;

    if (!Object.values(PaymentMethod).includes(paymentMethod)) {
        return res.status(400).json({
            error: 'Invalid payment method',
            validMethods: Object.values(PaymentMethod)
        });
    }

    // Basic card validation for credit/debit cards
    if ([PaymentMethod.CREDIT_CARD, PaymentMethod.DEBIT_CARD].includes(paymentMethod)) {
        if (!cardNumber || !expiryDate || !cvv) {
            return res.status(400).json({
                error: 'Missing card details',
                required: ['cardNumber', 'expiryDate', 'cvv']
            });
        }

        // Simple validation (in real service, use proper validation)
        if (cardNumber.length < 13 || cardNumber.length > 19) {
            return res.status(400).json({ error: 'Invalid card number length' });
        }

        // Basic expiry date format validation (MM/YY)
        if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
            return res.status(400).json({ error: 'Invalid expiry date format (MM/YY)' });
        }

        // Basic CVV validation
        if (!/^\d{3,4}$/.test(cvv)) {
            return res.status(400).json({ error: 'Invalid CVV' });
        }
    }

    res.json({
        success: true,
        message: 'Payment method validated successfully',
        data: {
            paymentMethod,
            valid: true,
            requiresToken: [PaymentMethod.CREDIT_CARD, PaymentMethod.DEBIT_CARD].includes(paymentMethod)
        }
    });
});

// Generate mock payment token (for testing)
app.post('/payments/generate-token', (req, res) => {
    const { paymentMethod, cardNumber, expiryDate, cvv } = req.body;

    if (![PaymentMethod.CREDIT_CARD, PaymentMethod.DEBIT_CARD].includes(paymentMethod)) {
        return res.status(400).json({ error: 'Token generation only available for card payments' });
    }

    // Mock token generation
    const token = `tok_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;

    res.json({
        success: true,
        data: {
            token,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
            cardLast4: cardNumber ? cardNumber.slice(-4) : '****'
        },
        message: 'Payment token generated successfully'
    });
});

// Payment statistics
app.get('/payments/stats', (req, res) => {
    const { userId, startDate, endDate } = req.query;

    let filteredPayments = [...payments];

    if (userId) {
        filteredPayments = filteredPayments.filter(p => p.userId === userId);
    }

    if (startDate) {
        filteredPayments = filteredPayments.filter(p =>
            new Date(p.createdAt) >= new Date(startDate as string)
        );
    }

    if (endDate) {
        filteredPayments = filteredPayments.filter(p =>
            new Date(p.createdAt) <= new Date(endDate as string)
        );
    }

    const stats = {
        total: filteredPayments.length,
        totalAmount: filteredPayments.reduce((sum, p) => sum + p.amount, 0),
        byStatus: {
            pending: filteredPayments.filter(p => p.paymentDetails.paymentStatus === 'pending').length,
            completed: filteredPayments.filter(p => p.paymentDetails.paymentStatus === 'completed').length,
            failed: filteredPayments.filter(p => p.paymentDetails.paymentStatus === 'failed').length,
            refunded: filteredPayments.filter(p => p.paymentDetails.paymentStatus === 'refunded').length,
        },
        byMethod: {
            cod: filteredPayments.filter(p => p.paymentMethod === PaymentMethod.COD).length,
            credit_card: filteredPayments.filter(p => p.paymentMethod === PaymentMethod.CREDIT_CARD).length,
            debit_card: filteredPayments.filter(p => p.paymentMethod === PaymentMethod.DEBIT_CARD).length,
            paypal: filteredPayments.filter(p => p.paymentMethod === PaymentMethod.PAYPAL).length,
            apple_pay: filteredPayments.filter(p => p.paymentMethod === PaymentMethod.APPLE_PAY).length,
            google_pay: filteredPayments.filter(p => p.paymentMethod === PaymentMethod.GOOGLE_PAY).length,
        },
        totalRefunds: refunds.filter(r => r.status === 'completed').length,
        totalRefundAmount: refunds
            .filter(r => r.status === 'completed')
            .reduce((sum, r) => sum + r.amount, 0)
    };

    res.json({ success: true, data: stats });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'Payment Service',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        port: PORT,
        features: {
            paymentMethods: Object.values(PaymentMethod),
            mockMode: true,
            refundsSupported: true,
            tokenGeneration: true
        }
    });
});

app.listen(PORT, () => {
    console.log(`💳 Payment Service v2.0 running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔧 Mock mode enabled - simulating payment processing`);
});