import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

interface CustomError extends Error {
    statusCode?: number;
    code?: number | string;
    keyValue?: any;
    errors?: any;
}

/**
 * Global error handling middleware
 */
export const errorHandler = (
    err: CustomError,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    let error = { ...err };
    error.message = err.message;

    // Log error
    logger.error('Error Handler:', {
        error: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Invalid ID format';
        error = {
            ...error,
            message,
            statusCode: 400
        };
    }

    if ((err as any).code === 11000) {
        const field = Object.keys((err as any).keyValue || {})[0];
        const message = field === 'email'
            ? 'Email address is already registered'
            : 'Duplicate field value entered';
        error = {
            ...error,
            message,
            statusCode: 409
        };
    }
    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors || {})
            .map((val: any) => val.message)
            .join(', ');
        error = {
            ...error,
            message,
            statusCode: 400
        };
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        const message = 'Invalid token';
        error = {
            ...error,
            message,
            statusCode: 401
        };
    }

    if (err.name === 'TokenExpiredError') {
        const message = 'Token expired';
        error = {
            ...error,
            message,
            statusCode: 401
        };
    }

    // Default to 500 server error
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal server error';

    res.status(statusCode).json({
        success: false,
        error: message,
        ...(process.env.NODE_ENV === 'development' && {
            stack: err.stack
        })
    });
};

/**
 * Handle async errors
 */
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

/**
 * 404 Not Found handler
 */
export const notFound = (req: Request, res: Response, next: NextFunction): void => {
    const error = new Error(`Not found - ${req.originalUrl}`) as CustomError;
    error.statusCode = 404;
    next(error);
};