import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v1 as uuidv1 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 3003;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Mock payment data
const payments: any[] = [];

// Simulate payment processing delays
const simulateProcessingDelay = () => {
    return new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));
};

// Process payment
app.post('/payments/process', async (req, res) => {
    const { purchaseId, amount, paymentMethod, userId } = req.body;

    if (!purchaseId || !amount || !paymentMethod || !userId) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Simulate processing delay
    await simulateProcessingDelay();

    // Simulate payment failures for testing (10% failure rate)
    const shouldFail = Math.random() < 0.1;

    if (shouldFail) {
        const failedPayment = {
            id: uuidv1(),
            purchaseId,
            amount,
            paymentMethod,
            userId,
            status: 'failed',
            errorMessage: 'Payment declined by bank',
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
    const payment = {
        id: uuidv1(),
        purchaseId,
        amount,
        paymentMethod,
        userId,
        status: 'completed',
        transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    payments.push(payment);
    res.json({ success: true, data: payment });
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

    res.json({ success: true, data: purchasePayments });
});

// Get all payments
app.get('/payments', (req, res) => {
    const { status, userId } = req.query;
    let filteredPayments = payments;

    if (status) {
        filteredPayments = filteredPayments.filter(p => p.status === status);
    }

    if (userId) {
        filteredPayments = filteredPayments.filter(p => p.userId === userId);
    }

    res.json({ success: true, data: filteredPayments });
});

// Refund payment
app.post('/payments/:id/refund', async (req, res) => {
    const { id } = req.params;
    const { amount, reason } = req.body;

    const payment = payments.find(p => p.id === id);
    if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.status !== 'completed') {
        return res.status(400).json({ error: 'Can only refund completed payments' });
    }

    // Simulate refund processing
    await simulateProcessingDelay();

    const refundAmount = amount || payment.amount;
    if (refundAmount > payment.amount) {
        return res.status(400).json({ error: 'Refund amount cannot exceed payment amount' });
    }

    const refund = {
        id: uuidv1(),
        paymentId: payment.id,
        purchaseId: payment.purchaseId,
        amount: refundAmount,
        reason: reason || 'Customer request',
        status: 'completed',
        createdAt: new Date()
    };

    // Update payment status if full refund
    if (refundAmount === payment.amount) {
        payment.status = 'refunded';
        payment.updatedAt = new Date();
    }

    res.json({ success: true, data: refund });
});

// Validate payment method
app.post('/payments/validate-method', (req, res) => {
    const { paymentMethod, cardNumber, expiryDate, cvv } = req.body;

    const validMethods = ['credit_card', 'debit_card', 'paypal', 'apple_pay', 'google_pay'];

    if (!validMethods.includes(paymentMethod)) {
        return res.status(400).json({ error: 'Invalid payment method' });
    }

    // Basic card validation for credit/debit cards
    if (['credit_card', 'debit_card'].includes(paymentMethod)) {
        if (!cardNumber || !expiryDate || !cvv) {
            return res.status(400).json({ error: 'Missing card details' });
        }

        // Simple validation (in real service, use proper validation)
        if (cardNumber.length < 13 || cardNumber.length > 19) {
            return res.status(400).json({ error: 'Invalid card number' });
        }
    }

    res.json({
        success: true,
        message: 'Payment method validated successfully',
        data: { paymentMethod, valid: true }
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'Payment Service',
        timestamp: new Date().toISOString(),
        port: PORT
    });
});

app.listen(PORT, () => {
    console.log(`💳 Payment Service running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
});