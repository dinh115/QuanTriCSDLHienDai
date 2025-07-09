import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    console.error('Error:', error);

    if (error.name === 'ValidationError') {
        res.status(400).json({
            success: false,
            error: error.message
        });
        return;
    }

    if (error.name === 'CastError') {
        res.status(400).json({
            success: false,
            error: 'Invalid ID format'
        });
        return;
    }

    if (error.message.includes('User not found')) {
        res.status(404).json({
            success: false,
            error: 'User not found'
        });
        return;
    }

    if (error.message.includes('Product') && error.message.includes('not found')) {
        res.status(400).json({
            success: false,
            error: error.message
        });
        return;
    }

    if (error.message.includes('Insufficient stock')) {
        res.status(400).json({
            success: false,
            error: error.message
        });
        return;
    }

    if (error.message.includes('Voucher')) {
        res.status(400).json({
            success: false,
            error: error.message
        });
        return;
    }

    if (error.message.includes('Payment')) {
        res.status(402).json({
            success: false,
            error: error.message
        });
        return;
    }

    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
};
