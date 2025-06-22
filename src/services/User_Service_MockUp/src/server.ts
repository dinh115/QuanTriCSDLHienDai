import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Mock user data
const users = [
    {
        id: 'user-123',
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        status: 'active',
        createdAt: new Date('2024-01-01')
    },
    {
        id: 'user-456',
        email: 'jane.smith@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        status: 'active',
        createdAt: new Date('2024-01-15')
    },
    {
        id: 'user-789',
        email: 'bob.wilson@example.com',
        firstName: 'Bob',
        lastName: 'Wilson',
        status: 'inactive',
        createdAt: new Date('2024-02-01')
    }
];

// Get all users
app.get('/users', (req, res) => {
    res.json({ success: true, data: users });
});

// Get user by ID
app.get('/users/:id', (req, res) => {
    const { id } = req.params;
    const user = users.find(u => u.id === id);

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, data: user });
});

// Create user (for testing)
app.post('/users', (req, res) => {
    const { email, firstName, lastName } = req.body;

    if (!email || !firstName || !lastName) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const newUser = {
        id: uuidv4(),
        email,
        firstName,
        lastName,
        status: 'active',
        createdAt: new Date()
    };

    users.push(newUser);
    res.status(201).json({ success: true, data: newUser });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'User Service',
        timestamp: new Date().toISOString(),
        port: PORT
    });
});

app.listen(PORT, () => {
    console.log(`👤 User Service running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
});