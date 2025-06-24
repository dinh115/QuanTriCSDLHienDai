import { Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { AuthenticatedRequest, JWTPayload } from '../types';
import logger from '../config/logger';
import { tokenVerifySchema } from './validation';
import { config } from '../config/environments';

export const authenticateService = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const serviceToken = req.headers['x-service-token'];

    if (!serviceToken || serviceToken !== config.SERVICE_TOKEN) {
        return res.status(401).json({
            success: false,
            error: 'Unauthorized - Invalid service token'
        });
    }

    return next();
};

export const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'No token provided'
            });
        }

        const token = authHeader.split(' ')[1];

        // Validate token format
        const { error } = tokenVerifySchema.validate({ token });
        if (error) {
            return res.status(400).json({
                success: false,
                error: error.details[0].message
            });
        }

        // Verify token and session
        const payload = await authService.verifySession(token);
        if (!payload) {
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired token'
            });
        }

        // Attach user payload to request
        req.user = payload;
        return next();
    } catch (error) {
        logger.error('Authentication middleware error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

// Middleware for admin access
export const requireAdmin = (req: any, res: Response, next: NextFunction) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Admin access required'
        });
    }
    return next();
};
