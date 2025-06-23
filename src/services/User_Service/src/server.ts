import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import bcrypt from 'bcryptjs';
import Joi from 'joi';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

interface User {
    id: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'customer' | 'admin';
    status: 'active' | 'inactive';
    createdAt: Date;
}

interface JWTPayload {
    userId: string;
    email: string;
    role: string;
    status: string;
}

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET: string = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN: any = process.env.JWT_EXPIRES_IN || '24h';
const SERVICE_TOKEN = process.env.SERVICE_TOKEN || 'service-secret-token-123';

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Mock database - in production, use a real database
const authenticateService = (req: any, res: express.Response, next: express.NextFunction) => {
    const serviceToken = req.headers['x-service-token'];

    if (!serviceToken || serviceToken !== SERVICE_TOKEN) {
        return res.status(401).json({
            success: false,
            error: 'Unauthorized - Invalid service token'
        });
    }

    next();
};

const users: User[] = [
    {
        id: '391841e9-e11f-4bd7-8234-4aa5d540a83d',
        email: 'john.doe@example.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password
        firstName: 'John',
        lastName: 'Doe',
        role: 'customer',
        status: 'active',
        createdAt: new Date('2024-01-01')
    },
    {
        id: '9a60903b-07ab-4786-bd27-1348d4046cf8',
        email: 'jane.smith@example.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'customer',
        status: 'active',
        createdAt: new Date('2024-01-15')
    },
    {
        id: 'e21bc80d-b413-4651-9b20-b7d189d1905b',
        email: 'bob.wilson@example.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password
        firstName: 'Bob',
        lastName: 'Wilson',
        role: 'customer',
        status: 'inactive',
        createdAt: new Date('2024-02-01')
    },
    {
        id: 'a740a9b4-c72d-4b16-8120-748a2e8b69ac',
        email: 'admin@example.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        status: 'active',
        createdAt: new Date('2024-01-01')
    }
];

// Active sessions store - in production, use Redis
const activeSessions = new Set<string>();

// Validation schemas
const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
});

const registerSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    firstName: Joi.string().trim().min(1).required(),
    lastName: Joi.string().trim().min(1).required()
});

const createUserSchema = Joi.object({
    email: Joi.string().email().required(),
    firstName: Joi.string().trim().min(1).required(),
    lastName: Joi.string().trim().min(1).required(),
    password: Joi.string().min(6).optional(),
    role: Joi.string().valid('customer', 'admin').optional().default('customer'),
    status: Joi.string().valid('active', 'inactive').optional().default('active')
});

// Utility functions
const createToken = (user: User): string => {
    const payload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        status: user.status
    };

    const options: jwt.SignOptions = {
        expiresIn: JWT_EXPIRES_IN
    };

    return jwt.sign(payload, JWT_SECRET, options);
};

const verifyToken = (token: string): JWTPayload | null => {
    try {
        return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch {
        return null;
    }
};

const sanitizeUser = (user: User) => ({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt
});

// Middleware for authentication
const authenticateToken = (req: any, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token || !activeSessions.has(token)) {
        return res.status(401).json({
            success: false,
            error: 'Unauthorized - No valid token provided'
        });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        activeSessions.delete(token);
        return res.status(401).json({
            success: false,
            error: 'Invalid token'
        });
    }

    const user = users.find(u => u.id === decoded.userId);
    if (!user || user.status !== 'active') {
        activeSessions.delete(token);
        return res.status(401).json({
            success: false,
            error: 'User not found or inactive'
        });
    }

    req.user = decoded;
    next();
};

// Middleware for admin access
const requireAdmin = (req: any, res: express.Response, next: express.NextFunction) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Admin access required'
        });
    }
    next();
};

// =============================================================================
// AUTHENTICATION ROUTES
// =============================================================================

app.get('/internal/users/:id', authenticateService, (req, res) => {
    try {
        const { id } = req.params;
        const user = users.find(u => u.id === id);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Return user data for internal services
        res.json({
            success: true,
            data: sanitizeUser(user)
        });
    } catch (error) {
        console.error('Internal get user error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Internal endpoint to get multiple users by IDs
app.post('/internal/users/batch', authenticateService, (req, res) => {
    try {
        const { userIds } = req.body;

        if (!Array.isArray(userIds)) {
            return res.status(400).json({
                success: false,
                error: 'userIds must be an array'
            });
        }

        const foundUsers = users
            .filter(u => userIds.includes(u.id))
            .map(sanitizeUser);

        res.json({
            success: true,
            data: foundUsers
        });
    } catch (error) {
        console.error('Internal batch get users error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Internal endpoint to check if user exists and is active
app.get('/internal/users/:id/status', authenticateService, (req, res) => {
    try {
        const { id } = req.params;
        const user = users.find(u => u.id === id);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.json({
            success: true,
            data: {
                id: user.id,
                status: user.status,
                role: user.role,
                exists: true,
                active: user.status === 'active'
            }
        });
    } catch (error) {
        console.error('Internal user status check error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Internal endpoint to verify multiple users exist
app.post('/internal/users/verify', authenticateService, (req, res) => {
    try {
        const { userIds } = req.body;

        if (!Array.isArray(userIds)) {
            return res.status(400).json({
                success: false,
                error: 'userIds must be an array'
            });
        }

        const verificationResults = userIds.map(userId => {
            const user = users.find(u => u.id === userId);
            return {
                userId,
                exists: !!user,
                active: user?.status === 'active',
                role: user?.role
            };
        });

        res.json({
            success: true,
            data: verificationResults
        });
    } catch (error) {
        console.error('Internal user verification error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

app.post('/auth/login', async (req, res) => {
    try {
        const { error, value } = loginSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: error.details[0].message
            });
        }

        const { email, password } = value;
        console.log(email, password);
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        if (user.status !== 'active') {
            return res.status(403).json({
                success: false,
                error: 'Account is not active'
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        const token = createToken(user);
        activeSessions.add(token);

        res.json({
            success: true,
            data: {
                token,
                user: sanitizeUser(user)
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

app.post('/auth/register', async (req, res) => {
    try {
        const { error, value } = registerSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: error.details[0].message
            });
        }

        const { email, password, firstName, lastName } = value;

        // Check if user already exists
        const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: 'User with this email already exists'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create new user
        const newUser: User = {
            id: uuidv4(),
            email: email.toLowerCase(),
            password: hashedPassword,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            role: 'customer',
            status: 'active',
            createdAt: new Date()
        };

        users.push(newUser);

        const token = createToken(newUser);
        activeSessions.add(token);

        res.status(201).json({
            success: true,
            data: {
                token,
                user: sanitizeUser(newUser)
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

app.post('/auth/verify', (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                error: 'Token is required'
            });
        }

        if (!activeSessions.has(token)) {
            return res.status(401).json({
                success: false,
                error: 'Session not found or expired'
            });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            activeSessions.delete(token);
            return res.status(401).json({
                success: false,
                error: 'Invalid token'
            });
        }

        // Verify user still exists and is active
        const user = users.find(u => u.id === decoded.userId);
        if (!user || user.status !== 'active') {
            activeSessions.delete(token);
            return res.status(401).json({
                success: false,
                error: 'User not found or inactive'
            });
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
        console.error('Token verification error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

app.post('/auth/logout', (req, res) => {
    try {
        const { token } = req.body;

        if (token && activeSessions.has(token)) {
            activeSessions.delete(token);
        }

        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

app.get('/auth/profile', authenticateToken, (req: any, res) => {
    try {
        const user = users.find(u => u.id === req.user.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.json({
            success: true,
            data: sanitizeUser(user)
        });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(401).json({
            success: false,
            error: 'Unauthorized'
        });
    }
});

// =============================================================================
// USER MANAGEMENT ROUTES
// =============================================================================

// Get all users (public endpoint from original service, now requires auth)
app.get('/users', authenticateToken, (req: any, res) => {
    try {
        // Allow admin to see all users, customers can only see active users
        let filteredUsers = users;

        if (req.user.role !== 'admin') {
            filteredUsers = users.filter(u => u.status === 'active');
        }

        const sanitizedUsers = filteredUsers.map(sanitizeUser);
        res.json({ success: true, data: sanitizedUsers });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Get user by ID
app.get('/users/:id', authenticateToken, (req: any, res) => {
    try {
        const { id } = req.params;
        const user = users.find(u => u.id === id);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Users can only view their own profile unless they're admin
        if (req.user.role !== 'admin' && req.user.userId !== id) {
            return res.status(403).json({
                success: false,
                error: 'Access denied'
            });
        }

        res.json({
            success: true,
            data: sanitizeUser(user)
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Create user (admin only)
app.post('/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { error, value } = createUserSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: error.details[0].message
            });
        }

        const { email, firstName, lastName, password, role, status } = value;

        // Check if user already exists
        const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: 'User with this email already exists'
            });
        }

        // Generate default password if not provided
        const userPassword = password || 'defaultPassword123';
        const hashedPassword = await bcrypt.hash(userPassword, 12);

        const newUser: User = {
            id: uuidv4(),
            email: email.toLowerCase(),
            password: hashedPassword,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            role: role || 'customer',
            status: status || 'active',
            createdAt: new Date()
        };

        users.push(newUser);

        res.status(201).json({
            success: true,
            data: sanitizeUser(newUser)
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Update user (admin can update any user, users can update their own profile)
app.put('/users/:id', authenticateToken, async (req: any, res) => {
    try {
        const { id } = req.params;
        const user = users.find(u => u.id === id);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Users can only update their own profile unless they're admin
        if (req.user.role !== 'admin' && req.user.userId !== id) {
            return res.status(403).json({
                success: false,
                error: 'Access denied'
            });
        }

        const { firstName, lastName, email, role, status, password } = req.body;

        // Only admins can change role and status
        if (req.user.role !== 'admin' && (role !== undefined || status !== undefined)) {
            return res.status(403).json({
                success: false,
                error: 'Only admins can change role or status'
            });
        }

        // Update user fields
        if (firstName) user.firstName = firstName.trim();
        if (lastName) user.lastName = lastName.trim();
        if (email) {
            // Check if new email already exists
            const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.id !== id);
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    error: 'Email already in use'
                });
            }
            user.email = email.toLowerCase();
        }
        if (password) {
            user.password = await bcrypt.hash(password, 12);
        }
        if (role && req.user.role === 'admin') {
            user.role = role;
        }
        if (status && req.user.role === 'admin') {
            user.status = status;
        }

        res.json({
            success: true,
            data: sanitizeUser(user)
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Delete user (admin only)
app.delete('/users/:id', authenticateToken, requireAdmin, (req, res) => {
    try {
        const { id } = req.params;
        const userIndex = users.findIndex(u => u.id === id);

        if (userIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        users.splice(userIndex, 1);

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Admin-only route to get all users (including sensitive info)
app.get('/admin/users', authenticateToken, requireAdmin, (req, res) => {
    try {
        const allUsers = users.map(sanitizeUser);
        res.json({
            success: true,
            data: allUsers
        });
    } catch (error) {
        console.error('Admin users list error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// =============================================================================
// UTILITY ROUTES
// =============================================================================

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Combined User Management Service',
        timestamp: new Date().toISOString(),
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        features: ['authentication', 'user-management']
    });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});

app.listen(PORT, () => {
    console.log(`👤 Combined User Management Service running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🧪 Test credentials:`);
    console.log(`   Customer: john.doe@example.com / password`);
    console.log(`   Customer: jane.smith@example.com / password`);
    console.log(`   Inactive: bob.wilson@example.com / password`);
    console.log(`   Admin: admin@example.com / password`);
    console.log(`🔐 Authentication endpoints:`);
    console.log(`   POST /auth/login`);
    console.log(`   POST /auth/register`);
    console.log(`   POST /auth/verify`);
    console.log(`   POST /auth/logout`);
    console.log(`   GET  /auth/profile`);
    console.log(`👥 User management endpoints:`);
    console.log(`   GET    /users (authenticated)`);
    console.log(`   GET    /users/:id (authenticated)`);
    console.log(`   POST   /users (admin only)`);
    console.log(`   PUT    /users/:id (self or admin)`);
    console.log(`   DELETE /users/:id (admin only)`);
    console.log(`   GET    /admin/users (admin only)`);
    console.log(`🔧 Internal service endpoints:`);
    console.log(`   GET  /internal/users/:id (service token required)`);
    console.log(`   POST /internal/users/batch (service token required)`);
    console.log(`   GET  /internal/users/:id/status (service token required)`);
    console.log(`   POST /internal/users/verify (service token required)`);
    console.log(`🔑 Service Token: ${SERVICE_TOKEN}`);
    console.log(`🚀 Server ready for requests!`);
});