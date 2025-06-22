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
const PORT = process.env.PORT || 3004;
const JWT_SECRET: string = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN: any = process.env.JWT_EXPIRES_IN || '24h';

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Mock database - in production, use a real database
const users: User[] = [
    {
        id: 'user-123',
        email: 'john.doe@example.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: secret123
        firstName: 'John',
        lastName: 'Doe',
        role: 'customer',
        status: 'active',
        createdAt: new Date('2024-01-01')
    },
    {
        id: 'user-456',
        email: 'jane.smith@example.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: secret123
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'customer',
        status: 'active',
        createdAt: new Date('2024-01-15')
    },
    {
        id: 'admin-001',
        email: 'admin@example.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: secret123
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

// Routes
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

app.get('/auth/profile', (req, res) => {
    try {
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
        if (!user) {
            activeSessions.delete(token);
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

app.get('/auth/users', (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

        if (!token || !activeSessions.has(token)) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized'
            });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({
                success: false,
                error: 'Invalid token'
            });
        }

        const user = users.find(u => u.id === decoded.userId);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Admin access required'
            });
        }

        const allUsers = users.map(sanitizeUser);
        res.json({
            success: true,
            data: allUsers
        });
    } catch (error) {
        console.error('Users list error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Authentication Service',
        timestamp: new Date().toISOString(),
        port: PORT,
        environment: process.env.NODE_ENV || 'development'
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
    console.log(`🔐 Authentication Service running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🧪 Test credentials:`);
    console.log(`   Customer: john.doe@example.com / secret123`);
    console.log(`   Admin: admin@example.com / secret123`);
    console.log(`🚀 Server ready for requests!`);
});