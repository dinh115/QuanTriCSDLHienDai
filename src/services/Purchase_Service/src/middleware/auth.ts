import { Request, Response, NextFunction } from 'express';
import axios from 'axios';

export interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role: string;
        status: string;
    };
}

export const authenticate = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

        if (!token) {
            res.status(401).json({
                success: false,
                error: 'Authentication token required'
            });
            return;
        }

        const authServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001/api';
        const response = await axios.post(`${authServiceUrl}/auth/verify-token`, { token });

        if (response.data.success) {
            req.user = {
                userId: response.data.data.userId,
                email: response.data.data.email,
                role: response.data.data.role,
                status: response.data.data.status
            };
            next();
        } else {
            res.status(401).json({
                success: false,
                error: 'Invalid token'
            });
        }
    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response?.status === 401) {
                res.status(401).json({
                    success: false,
                    error: 'Invalid or expired token'
                });
            } else if (error.response?.status === 400) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid request format'
                });
            } else {
                console.error('Auth service error:', error.response?.data ? JSON.stringify(error.response.data) : error.message);
                res.status(503).json({
                    success: false,
                    error: 'Authentication service unavailable'
                });
            }
        } else {
            console.error('Authentication error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal authentication error'
            });
        }
    }
};

export const authorize = (roles: string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
            return;
        }

        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                error: 'Insufficient permissions'
            });
            return;
        }

        next();
    };
};

export const authorizeOwnerOrAdmin = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): void => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
        return;
    }

    const { userId } = req.params;
    const requestingUserId = req.user.userId;
    const userRole = req.user.role;

    if (userRole === 'admin' || requestingUserId === userId) {
        next();
    } else {
        res.status(403).json({
            success: false,
            error: 'Access denied - you can only access your own data'
        });
    }
};

export const authorizeShopOwnerOrAdmin = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): void => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
        return;
    }

    const userRole = req.user.role;

    if (userRole === 'admin' || userRole === 'shop_owner') {
        next();
    } else {
        res.status(403).json({
            success: false,
            error: 'Access denied - shop owner or admin required'
        });
    }
};

export const authorizePurchaseAccess = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): void => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
        return;
    }

    next();
};

export const authorizePurchaseStatusUpdate = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): void => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
        return;
    }

    const userRole = req.user.role;
    const { status } = req.body;

    if (userRole === 'admin' || userRole === 'shop_owner') {
        next();
        return;
    }

    if (userRole === 'customer' && status === 'cancelled') {
        next();
        return;
    }

    res.status(403).json({
        success: false,
        error: 'Insufficient permissions to update purchase status'
    });
};
