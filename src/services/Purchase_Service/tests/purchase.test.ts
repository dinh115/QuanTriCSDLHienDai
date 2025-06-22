import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import express from 'express';
import purchaseRoutes from '../src/routes/purchase';
import { beforeAll, afterAll, describe, it, expect } from '@jest/globals';

const app = express();
app.use(express.json());
app.use('/api/purchases', purchaseRoutes);

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('Purchase Service', () => {
    const mockPurchaseData = {
        userId: 'user-123',
        items: [
            {
                productId: 'product-1',
                quantity: 2,
                unitPrice: 29.99
            }
        ],
        paymentMethod: 'credit_card',
        shippingAddress: {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'USA'
        }
    };

    describe('POST /api/purchases', () => {
        it('should create a new purchase', async () => {
            const response = await request(app)
                .post('/api/purchases')
                .send(mockPurchaseData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data.userId).toBe('user-123');
            expect(response.body.data.status).toBe('pending');
        });

        it('should validate required fields', async () => {
            const response = await request(app)
                .post('/api/purchases')
                .send({})
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });
    });
});