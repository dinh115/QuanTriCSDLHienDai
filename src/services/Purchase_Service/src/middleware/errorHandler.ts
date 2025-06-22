import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    console.error('Error:', error);

    if (error.name === 'ValidationError') {
        res.status(400).json({ error: error.message });
        return;
    }

    if (error.name === 'CastError') {
        res.status(400).json({ error: 'Invalid ID format' });
        return;
    }

    res.status(500).json({ error: 'Internal server error' });
};
