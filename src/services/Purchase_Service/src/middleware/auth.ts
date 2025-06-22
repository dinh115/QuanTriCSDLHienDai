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
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            res.status(401).json({ error: 'Authentication token required' });
            return;
        }

        // Verify token with auth service
        const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3004';
        const response = await axios.post(`${authServiceUrl}/auth/verify`, { token });

        if (response.data.success) {
            req.user = response.data.data;
            next();
        } else {
            res.status(401).json({ error: 'Invalid token' });
        }
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
            res.status(401).json({ error: 'Invalid or expired token' });
        } else {
            console.error('Authentication error:', error);
            res.status(500).json({ error: 'Authentication service unavailable' });
        }
    }
};

export const authorize = (roles: string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        if (!roles.includes(req.user.role)) {
            res.status(403).json({ error: 'Insufficient permissions' });
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
        res.status(401).json({ error: 'Authentication required' });
        return;
    }

    const { userId } = req.params;
    const requestingUserId = req.user.userId;
    const userRole = req.user.role;

    // Allow if user is admin or requesting their own data
    if (userRole === 'admin' || requestingUserId === userId) {
        next();
    } else {
        res.status(403).json({ error: 'Access denied' });
    }
};