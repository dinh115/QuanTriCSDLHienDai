import axios from 'axios';
import { PurchaseItem, Purchase } from '../types';

export class ExternalServiceClient {
    private userServiceUrl: string;
    private productServiceUrl: string;
    private paymentServiceUrl: string;

    constructor() {
        this.userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001';
        this.productServiceUrl = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002';
        this.paymentServiceUrl = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3003';
    }

    async validateUser(userId: string): Promise<void> {
        try {
            await axios.get(`${this.userServiceUrl}/users/${userId}`);
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                throw new Error('User not found');
            }
            throw new Error('Failed to validate user');
        }
    }

    async validateProducts(items: Omit<PurchaseItem, 'totalPrice'>[]): Promise<PurchaseItem[]> {
        try {
            const productIds = items.map(item => item.productId);
            const response = await axios.post(`${this.productServiceUrl}/products/validate`, {
                productIds
            });

            const validProducts = response.data;

            return items.map(item => {
                const product = validProducts.find((p: any) => p.id === item.productId);
                if (!product) {
                    throw new Error(`Product ${item.productId} not found`);
                }

                if (product.stock < item.quantity) {
                    throw new Error(`Insufficient stock for product ${item.productId}`);
                }

                return {
                    ...item,
                    unitPrice: product.price, // Use actual price from product service
                    totalPrice: product.price * item.quantity
                };
            });
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to validate products');
        }
    }

    async processPayment(purchase: Purchase): Promise<void> {
        try {
            await axios.post(`${this.paymentServiceUrl}/payments/process`, {
                purchaseId: purchase.id,
                amount: purchase.totalAmount,
                paymentMethod: purchase.paymentMethod,
                userId: purchase.userId
            });
        } catch (error) {
            console.error('Failed to process payment:', error);
            // In a real application, you might want to handle this more gracefully
            // Perhaps by updating the purchase status to "payment_failed"
        }
    }

}
