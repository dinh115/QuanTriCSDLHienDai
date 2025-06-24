import chalk from 'chalk';
import { Response } from 'express';
import { authService } from '../services/authService';
import userService from '../services/UserService';
import { AuthenticatedRequest, ApiResponse } from '../types';
import logger from '../config/logger';
import {
    loginSchema,
    registerSchema,
    createUserSchema,
    updateUserSchema,
    batchUsersSchema
} from '../middlewares/validation';

class UserController {
    /**
     * Login user
     */
    async login(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { error, value } = loginSchema.validate(req.body);
            if (error) {
                res.status(400).json({
                    success: false,
                    error: error.details[0].message
                });
                return;
            }

            const result = await authService.login(value);

            res.json({
                success: true,
                data: {
                    token: result.token,
                    user: result.user.toJSON()
                }
            });
        } catch (error) {
            logger.error('Login controller error:', error);
            const message = error instanceof Error ? error.message : 'Login failed';

            if (message.includes('Invalid credentials')) {
                res.status(401).json({ success: false, error: message });
            } else if (message.includes('not active')) {
                res.status(403).json({ success: false, error: message });
            } else {
                res.status(500).json({ success: false, error: 'Internal server error' });
            }
        }
    }

    /**
     * Register user
     */
    async register(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { error, value } = registerSchema.validate(req.body);
            if (error) {
                res.status(400).json({
                    success: false,
                    error: error.details[0].message
                });
                return;
            }

            const result = await authService.register(value);

            res.status(201).json({
                success: true,
                data: {
                    token: result.token,
                    user: result.user.toJSON()
                }
            });
        } catch (error) {
            logger.error('Register controller error:', error);
            const message = error instanceof Error ? error.message : 'Registration failed';

            if (message.includes('already exists')) {
                res.status(409).json({ success: false, error: message });
            } else {
                res.status(500).json({ success: false, error: 'Internal server error' });
            }
        }
    }

    /**
    * Logout user
    */
    async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            // Get token from Authorization header
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                res.status(401).json({
                    success: false,
                    error: 'Authorization header missing or invalid format'
                });
                return;
            }

            const token = authHeader.substring(7); // Remove 'Bearer ' prefix
            await authService.logout(token);

            res.json({
                success: true,
                message: 'Logged out successfully'
            });
        } catch (error) {
            logger.error('Logout controller error:', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    /**
     * Get user profile
     */
    async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: 'Unauthorized' });
                return;
            }

            const user = await userService.getUserById(req.user.userId);
            if (!user) {
                res.status(404).json({ success: false, error: 'User not found' });
                return;
            }

            res.json({
                success: true,
                data: user
            });
        } catch (error) {
            logger.error('Get profile controller error:', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    /**
     * Get users
     */
    async getUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const {
                page = 1,
                limit = 10,
                status,
                role,
                search,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = req.query;

            // For non-admin users, only show active users
            const queryOptions = {
                page: parseInt(page as string),
                limit: parseInt(limit as string),
                status: req.user?.role !== 'admin' ? 'active' : (status as string),
                role: role as string,
                search: search as string,
                sortBy: sortBy as string,
                sortOrder: sortOrder as 'asc' | 'desc'
            };

            let result = await userService.findUsers(queryOptions);

            if (req.user?.role !== 'admin') {
                const { users, ...rest } = result;

                const usersNoPassword = users.map((user: any) => {
                    const { password, ...userWithoutPassword } = user;
                    return userWithoutPassword;
                });

                result = {
                    users: usersNoPassword,
                    ...rest
                };
            }

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error('Get users controller error:', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    /**
    * Get user by ID Internal
    */
    async getUserInternal(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            const user = await userService.getUserById(id);
            if (!user) {
                res.status(404).json({ success: false, error: 'User not found' });
                return;
            }

            res.json({
                success: true,
                data: user
            });
        } catch (error) {
            logger.error('Get user controller error:', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    /**
     * Get user by ID
     */
    async getUser(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            // Users can only view their own profile unless they're admin
            if (req.user?.role !== 'admin' && req.user?.userId !== id) {
                res.status(403).json({ success: false, error: 'Access denied' });
                return;
            }

            const user = await userService.getUserById(id);
            if (!user) {
                res.status(404).json({ success: false, error: 'User not found' });
                return;
            }

            res.json({
                success: true,
                data: user
            });
        } catch (error) {
            logger.error('Get user controller error:', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    /**
     * Create user (admin only)
     */
    async createUser(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { error, value } = createUserSchema.validate(req.body);
            if (error) {
                res.status(400).json({
                    success: false,
                    error: error.details[0].message
                });
                return;
            }

            const user = await userService.createUser(value);

            res.status(201).json({
                success: true,
                data: user
            });
        } catch (error) {
            logger.error('Create user controller error:', error);
            const message = error instanceof Error ? error.message : 'User creation failed';

            if (message.includes('already exists')) {
                res.status(409).json({ success: false, error: message });
            } else {
                res.status(500).json({ success: false, error: 'Internal server error' });
            }
        }
    }

    /**
  * Update user (their own profile)
  */
    async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const id = req.user?.userId;
            if (!id) {
                res.status(401).json({ success: false, error: 'Unauthorized' });
                return;
            }

            const { error, value } = updateUserSchema.validate(req.body);

            if (error) {
                res.status(400).json({
                    success: false,
                    error: error.details[0].message
                });
                return;
            }

            // Users can only update their own profile unless they're admin
            if (req.user?.role !== 'admin' && req.user?.userId !== id) {
                res.status(403).json({ success: false, error: 'Access denied' });
                return;
            }

            // Only admins can change role and status
            if (req.user?.role !== 'admin' && (value.role || value.status)) {
                res.status(403).json({
                    success: false,
                    error: 'Only admins can change role or status'
                });
                return;
            }

            const user = await userService.updateUser(id, value);
            if (!user) {
                res.status(404).json({ success: false, error: 'User not found' });
                return;
            }

            res.json({
                success: true,
                data: user
            });
        } catch (error) {
            logger.error('Update user controller error:', error);
            const message = error instanceof Error ? error.message : 'User update failed';

            if (message.includes('Email already in use')) {
                res.status(409).json({ success: false, error: message });
            } else {
                res.status(500).json({ success: false, error: 'Internal server error' });
            }
        }
    }
    /**
     * Update user
     */
    async updateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { error, value } = updateUserSchema.validate(req.body);

            if (error) {
                res.status(400).json({
                    success: false,
                    error: error.details[0].message
                });
                return;
            }

            // Users can only update their own profile unless they're admin
            if (req.user?.role !== 'admin' && req.user?.userId !== id) {
                res.status(403).json({ success: false, error: 'Access denied' });
                return;
            }

            // Only admins can change role and status
            if (req.user?.role !== 'admin' && (value.role || value.status)) {
                res.status(403).json({
                    success: false,
                    error: 'Only admins can change role or status'
                });
                return;
            }

            const user = await userService.updateUser(id, value);
            if (!user) {
                res.status(404).json({ success: false, error: 'User not found' });
                return;
            }

            res.json({
                success: true,
                data: user
            });
        } catch (error) {
            logger.error('Update user controller error:', error);
            const message = error instanceof Error ? error.message : 'User update failed';

            if (message.includes('Email already in use')) {
                res.status(409).json({ success: false, error: message });
            } else {
                res.status(500).json({ success: false, error: 'Internal server error' });
            }
        }
    }

    /**
     * Delete user (admin only)
     */
    async deleteUser(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            const success = await userService.deleteUser(id);
            if (!success) {
                res.status(404).json({ success: false, error: 'User not found' });
                return;
            }

            res.json({
                success: true,
                message: 'User deleted successfully'
            });
        } catch (error) {
            logger.error('Delete user controller error:', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    /**
     * Batch get users by IDs (internal service)
     */
    async batchGetUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { error, value } = batchUsersSchema.validate(req.body);
            if (error) {
                res.status(400).json({
                    success: false,
                    error: error.details[0].message
                });
                return;
            }

            const users = await userService.getUsersByIds(value.userIds);

            res.json({
                success: true,
                data: users
            });
        } catch (error) {
            logger.error('Batch get users controller error:', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    /**
     * Check user status (internal service)
     */
    async checkUserStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const status = await userService.checkUserStatus(id);

            if (!status.exists) {
                res.status(404).json({ success: false, error: 'User not found' });
                return;
            }

            res.json({
                success: true,
                data: {
                    id,
                    status: status.user?.status,
                    role: status.role,
                    exists: status.exists,
                    active: status.active
                }
            });
        } catch (error) {
            logger.error('Check user status controller error:', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    /**
     * Verify multiple users (internal service)
     */
    async verifyUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { error, value } = batchUsersSchema.validate(req.body);
            if (error) {
                res.status(400).json({
                    success: false,
                    error: error.details[0].message
                });
                return;
            }

            const verificationResults = await userService.verifyUsers(value.userIds);

            res.json({
                success: true,
                data: verificationResults
            });
        } catch (error) {
            logger.error('Verify users controller error:', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    /**
     * Verify token
     */
    async verifyToken(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { token } = req.body;

            if (!token) {
                res.status(400).json({
                    success: false,
                    error: 'Token is required'
                });
                return;
            }

            const decoded = await authService.verifySession(token);
            if (!decoded) {
                res.status(401).json({
                    success: false,
                    error: 'Invalid or expired token'
                });
                return;
            }

            res.json({
                success: true,
                data: {
                    userId: decoded.userId,
                    email: decoded.email,
                    role: decoded.role,
                    status: decoded.status
                }
            });
        } catch (error) {
            logger.error('Verify token controller error:', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }
}

export default new UserController();