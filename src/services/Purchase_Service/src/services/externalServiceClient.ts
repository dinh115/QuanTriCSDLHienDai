import axios from 'axios';
import dotenv from 'dotenv';
import { PurchaseItem, Purchase, CartData, PaymentMethod } from '../types';

dotenv.config();

export interface ProductValidationResponse {
    id: string;
    shopId: string;
    name: string;
    price: number;
    stock: number;
    image?: string;
    available: boolean;
}

export interface UserData {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'customer' | 'admin';
    status: 'active' | 'inactive';
    createdAt: Date;
}

export class ExternalServiceClient {
    private userServiceUrl: string;
    private productServiceUrl: string;
    private paymentServiceUrl: string;
    private cartServiceUrl: string;
    private serviceToken: string;

    constructor() {
        this.userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3002/api';
        this.productServiceUrl = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3001';
        this.paymentServiceUrl = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3003';
        this.cartServiceUrl = process.env.CART_SERVICE_URL || 'http://localhost:3004';

        this.serviceToken = process.env.SERVICE_TOKEN || 'service-secret-token-123';
    }

    private getServiceHeaders() {
        return {
            'X-Service-Token': this.serviceToken,
            'Content-Type': 'application/json'
        };
    }

    async validateUser(userId: string): Promise<UserData> {
        try {
            const response = await axios.get(`${this.userServiceUrl}/internal/users/${userId}`, {
                headers: this.getServiceHeaders()
            });
            return response.data.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error('Axios error response:', {
                    status: error.response?.status,
                    data: error.response?.data,
                    headers: error.response?.headers,
                });
            } else {
                console.error('Unexpected error:', error);
            }

            throw new Error('Failed to validate user');
        }
    }

    async getCartData(cartId: string): Promise<CartData> {
        try {
            const response = await axios.get(`${this.cartServiceUrl}/carts/${cartId}`);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                throw new Error('Cart not found');
            }
            throw new Error('Failed to fetch cart data');
        }
    }

    async clearCart(cartId: string): Promise<void> {
        try {
            await axios.delete(`${this.cartServiceUrl}/carts/${cartId}/items`);
        } catch (error) {
            console.error('Failed to clear cart:', error);
        }
    }

    async validateProducts(items: Omit<PurchaseItem, 'totalPrice'>[]): Promise<PurchaseItem[]> {
        try {
            const productIds = items.map(item => item.productId);

            const response = await axios.post(`${this.productServiceUrl}/products/validate`, {
                productIds
            });

            // Trích đúng mảng sản phẩm hợp lệ từ response
            const validProducts: ProductValidationResponse[] = response.data.data.valid;

            console.info("VALID PRODUCTS: " + JSON.stringify(validProducts));

            return items.map(item => {
                const product = validProducts.find(p => p.id === item.productId);

                if (!product || !product.available) {
                    throw new Error(`Product ${item.productId} not found or unavailable`);
                }

                if (product.stock < item.quantity) {
                    throw new Error(`Insufficient stock for product ${item.productId}. Available: ${product.stock}, Requested: ${item.quantity}`);
                }

                return {
                    ...item,
                    shopId: product.shopId,
                    unitPrice: product.price,
                    totalPrice: product.price * item.quantity,
                    productName: product.name,
                    productImage: product.image
                };
            });
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to validate products');
        }
    }


    async processPayment(purchase: Purchase, paymentToken?: string): Promise<void> {
        try {
            if (purchase.paymentMethod === PaymentMethod.COD) {
                return;
            }

            await axios.post(`${this.paymentServiceUrl}/payments/process`, {
                purchaseId: purchase.id,
                amount: purchase.totalAmount,
                paymentMethod: purchase.paymentMethod,
                userId: purchase.userId,
                paymentToken,
                billingAddress: purchase.billingAddress || purchase.shippingAddress
            });
        } catch (error) {
            console.error('Failed to process payment:', error);
            throw new Error('Payment processing failed');
        }
    }
}
