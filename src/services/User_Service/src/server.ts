import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';

import logger from './config/logger';
import userRoutes from './routes/user';
import authRoutes from './routes/auth';
import internalRoutes from './routes/internal';
import adminRoutes from './routes/admin';
import redisConnection from './config/redis';

import { errorHandler } from './middlewares/errorHandler';
import { requestLogger } from './middlewares/requestLogger';
import { connectDatabase } from './config/database'

// Load environment variables
import { config } from './config/environments';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: config.NODE_ENV === 'production' ? 100 : 1000,
    message: {
        success: false,
        error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: config.NODE_ENV === 'production' ? 5 : 1000,
    message: {
        success: false,
        error: 'Too many authentication attempts, please try again later.'
    },
    skipSuccessfulRequests: true,
});

app.use('/api/auth', authLimiter);
app.use(limiter);

// Compression middleware
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        data: {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            environment: config.NODE_ENV
        }
    });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/internal', internalRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});

// Global error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
    try {
        await connectDatabase();
        await redisConnection.connect();
        const server = app.listen(config.PORT, () => {
            logger.info(`Server running on port ${config.PORT} in ${config.NODE_ENV} mode`);
        });

        server.on('error', (error: any) => {
            if (error.syscall !== 'listen') throw error;
            switch (error.code) {
                case 'EACCES':
                    logger.error(`Port ${config.PORT} requires elevated privileges`);
                    process.exit(1);
                    break;
                case 'EADDRINUSE':
                    logger.error(`Port ${config.PORT} is already in use`);
                    process.exit(1);
                    break;
                default:
                    throw error;
            }
        });

        // Graceful shutdown
        process.on('SIGTERM', async () => {
            console.log('SIGTERM received, shutting down gracefully');
            await redisConnection.disconnect();
            process.exit(0);
        });

        process.on('SIGINT', async () => {
            console.log('SIGINT received, shutting down gracefully');
            await redisConnection.disconnect();
            process.exit(0);
        });

        return server;

    } catch (error) {
        logger.error('Failed to start server:', error);
        await redisConnection.disconnect();
        process.exit(1);
    }
};

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', async (error) => {
    logger.error('Uncaught Exception:', error);
    await redisConnection.disconnect();
    process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    await redisConnection.disconnect();
    process.exit(1);
});

startServer();
