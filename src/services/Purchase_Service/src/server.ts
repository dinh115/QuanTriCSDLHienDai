import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDatabase } from './config/mongo';
import purchaseRoutes from './routes/purchase';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3006;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'Purchase Service',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        features: [
            'Cart Integration',
            'Shipping Calculation',
            'COD & Card Payments',
            'Voucher System',
            'UUIDv4 Support'
        ]
    });
});

// API Info endpoint
app.get('/api/info', (req, res) => {
    res.json({
        service: 'Purchase Service',
        version: '1.0.0',
        endpoints: {
            'POST /api/purchases': 'Create a new purchase',
            'GET /api/purchases': 'Get all purchases with filtering',
            'GET /api/purchases/:id': 'Get purchase by ID',
            'PATCH /api/purchases/:id/status': 'Update purchase status',
            'GET /api/purchases/user/:userId': 'Get user purchases',
            'POST /api/purchases/shipping/calculate': 'Calculate shipping options'
        },
        paymentMethods: ['cod', 'credit_card', 'debit_card', 'paypal'],
        shippingMethods: ['standard', 'express', 'overnight'],
        features: [
            'Cart service integration',
            'Dynamic shipping calculation',
            'Voucher code support',
            'Multiple payment methods',
            'Product validation',
            'Stock management integration'
        ]
    });
});

// Routes
app.use('/api/purchases', purchaseRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const startServer = async (): Promise<void> => {
    try {
        await connectDatabase();

        app.listen(PORT, () => {
            console.log(`🚀 Purchase Service running on port ${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/health`);
            console.log(`ℹ️  API info: http://localhost:${PORT}/api/info`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});
