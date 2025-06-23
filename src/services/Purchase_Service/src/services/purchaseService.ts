import { PurchaseModel, PurchaseDocument } from '../models/Purchase';
import {
    CreatePurchaseRequest,
    PurchaseStatus,
    Purchase,
    PurchaseItem,
    PaymentMethod,
    VoucherDetails,
    ShippingMethod,
    ShippingAddress,
    ShippingDetails
} from '../types';
import { ExternalServiceClient, UserData } from './externalServiceClient';

export interface VoucherValidationResponse {
    valid: boolean;
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    minOrderAmount?: number;
    maxDiscountAmount?: number;
    expiresAt?: string;
    usageLimit?: number;
    timesUsed?: number;
}

export interface ShippingCalculation {
    method: ShippingMethod;
    cost: number;
    estimatedDelivery: string;
}

export class PurchaseService {
    private externalServiceClient: ExternalServiceClient;

    // Shipping configuration
    private readonly defaultShippingRate: number;
    private readonly expressShippingRate: number;
    private readonly freeShippingThreshold: number;

    // Status transition validation
    private readonly validTransitions: Record<PurchaseStatus, PurchaseStatus[]> = {
        [PurchaseStatus.PENDING]: [PurchaseStatus.CONFIRMED, PurchaseStatus.CANCELLED],
        [PurchaseStatus.CONFIRMED]: [PurchaseStatus.PROCESSING, PurchaseStatus.CANCELLED],
        [PurchaseStatus.PROCESSING]: [PurchaseStatus.SHIPPED],
        [PurchaseStatus.SHIPPED]: [PurchaseStatus.DELIVERED],
        [PurchaseStatus.DELIVERED]: [PurchaseStatus.RETURNED, PurchaseStatus.REFUNDED],
        [PurchaseStatus.RETURNED]: [PurchaseStatus.REFUNDED],
        [PurchaseStatus.CANCELLED]: [],
        [PurchaseStatus.REFUNDED]: []
    };
    constructor() {
        this.externalServiceClient = new ExternalServiceClient();

        // Initialize shipping rates
        this.defaultShippingRate = parseInt(process.env.DEFAULT_SHIPPING_RATE || '15000');
        this.expressShippingRate = parseInt(process.env.EXPRESS_SHIPPING_RATE || '30000');
        this.freeShippingThreshold = parseInt(process.env.FREE_SHIPPING_THRESHOLD || '500000');
    }

    private validateStatusTransition(currentStatus: PurchaseStatus, newStatus: PurchaseStatus): boolean {
        const allowedTransitions = this.validTransitions[currentStatus];
        return allowedTransitions.includes(newStatus);
    }

    getValidNextStatuses(currentStatus: PurchaseStatus): PurchaseStatus[] {
        return this.validTransitions[currentStatus] || [];
    }
    // Voucher Service Methods
    private async validateVoucher(code: string, userId: string, subtotal: number): Promise<VoucherValidationResponse> {
        // Mock voucher data - replace with actual voucher logic if needed
        const mockVouchers: Record<string, VoucherValidationResponse> = {
            'SAVE10': {
                valid: true,
                code: 'SAVE10',
                discountType: 'percentage',
                discountValue: 10,
                minOrderAmount: 50000
            },
            'WELCOME20': {
                valid: true,
                code: 'WELCOME20',
                discountType: 'fixed',
                discountValue: 20000,
                minOrderAmount: 100000
            },
            'FREESHIP': {
                valid: true,
                code: 'FREESHIP',
                discountType: 'fixed',
                discountValue: 15000,
                minOrderAmount: 25000
            },
            'STUDENT15': {
                valid: true,
                code: 'STUDENT15',
                discountType: 'percentage',
                discountValue: 15,
                minOrderAmount: 75000,
                maxDiscountAmount: 50000
            },
            'VIP30': {
                valid: true,
                code: 'VIP30',
                discountType: 'fixed',
                discountValue: 30000,
                minOrderAmount: 200000
            }
        };

        const voucher = mockVouchers[code.toUpperCase()];

        if (!voucher) {
            throw new Error('Voucher not found');
        }

        if (voucher.minOrderAmount && subtotal < voucher.minOrderAmount) {
            throw new Error(`Minimum order amount of ${voucher.minOrderAmount.toLocaleString()} VND required`);
        }

        // Check expiration if set
        if (voucher.expiresAt && new Date() > new Date(voucher.expiresAt)) {
            throw new Error('Voucher has expired');
        }

        // Check usage limits if set
        if (voucher.usageLimit && voucher.timesUsed && voucher.timesUsed >= voucher.usageLimit) {
            throw new Error('Voucher usage limit exceeded');
        }

        return voucher;
    }

    private calculateVoucherDiscount(voucher: VoucherValidationResponse, subtotal: number): number {
        if (voucher.discountType === 'percentage') {
            const percentageDiscount = (subtotal * voucher.discountValue) / 100;
            return Math.min(
                percentageDiscount,
                voucher.maxDiscountAmount || subtotal
            );
        } else {
            return Math.min(voucher.discountValue, subtotal);
        }
    }

    // Shipping Service Methods
    private getBaseShippingCost(method: ShippingMethod): number {
        switch (method) {
            case ShippingMethod.STANDARD:
                return this.defaultShippingRate;
            case ShippingMethod.EXPRESS:
                return this.expressShippingRate;
            default:
                return this.defaultShippingRate;
        }
    }

    private getEstimatedDeliveryDays(method: ShippingMethod): number {
        switch (method) {
            case ShippingMethod.STANDARD:
                return 5; // 3-7 days
            case ShippingMethod.EXPRESS:
                return 2; // 1-3 days
            default:
                return 7;
        }
    }

    private getLocationMultiplier(address: ShippingAddress): number {
        // Adjust price based on location (country only for now)
        const country = address.country.toLowerCase();

        switch (country) {
            case 'vietnam':
            case 'vn':
                return 1.0;
            case 'canada':
            case 'ca':
                return 1.5;
            case 'mexico':
            case 'mx':
                return 1.3;
            case 'usa':
            case 'us':
                return 1.7;
            default:
                return 2.0;
        }
    }

    private calculateDeliveryDate(days: number): string {
        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + days);
        return deliveryDate.toISOString().split('T')[0];
    }

    private calculateShipping(
        subtotal: number,
        method: ShippingMethod,
        address: ShippingAddress
    ): ShippingCalculation {
        let baseCost = this.getBaseShippingCost(method);
        const estimatedDays = this.getEstimatedDeliveryDays(method);

        // Apply free shipping for orders above threshold (standard shipping only)
        if (method === ShippingMethod.STANDARD && subtotal >= this.freeShippingThreshold) {
            baseCost = 0;
        }

        // Apply location adjustment
        const locationMultiplier = this.getLocationMultiplier(address);
        const finalCost = Math.round(baseCost * locationMultiplier * 100) / 100; // Round to 2 decimal places

        return {
            method,
            cost: finalCost,
            estimatedDelivery: this.calculateDeliveryDate(estimatedDays)
        };
    }

    // Main Purchase Service Methods
    async createPurchase(data: CreatePurchaseRequest): Promise<Purchase> {
        // Validate user exists and is active using internal API
        const userData: UserData = await this.externalServiceClient.validateUser(data.userId);
        //console.log("VALIDATION COMPLETE");
        // Check if user is active
        if (userData.status !== 'active') {
            throw new Error('User account is not active');
        }

        let purchaseItems: PurchaseItem[] = [];
        //console.log(data.cartId);
        //console.log(data.items);
        // Get items from cart or use provided items
        if (data.cartId) {
            const cartData = await this.externalServiceClient.getCartData(data.cartId);
            const cartItems = cartData.items.map(item => ({
                shopId: item.shopId,
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: 0 // Will be filled by product validation
            }));
            purchaseItems = await this.externalServiceClient.validateProducts(cartItems);
        } else if (data.items && data.items.length > 0) {
            purchaseItems = await this.externalServiceClient.validateProducts(data.items);
        } else {
            throw new Error('Either cartId or items must be provided');
        }

        console.log(purchaseItems);
        // Calculate subtotal
        const subtotal = purchaseItems.reduce((sum, item) => sum + item.totalPrice, 0);

        // Calculate shipping
        const shippingCalculation = this.calculateShipping(
            subtotal,
            data.shippingMethod,
            data.shippingAddress
        );

        const shippingDetails: ShippingDetails = {
            method: shippingCalculation.method,
            cost: shippingCalculation.cost,
            estimatedDelivery: shippingCalculation.estimatedDelivery
        };

        // Handle voucher if provided
        let voucher: VoucherDetails | undefined;
        let discount = 0;

        if (data.voucherCode) {
            try {
                const voucherValidation = await this.validateVoucher(
                    data.voucherCode,
                    data.userId,
                    subtotal
                );

                if (voucherValidation.valid) {
                    discount = this.calculateVoucherDiscount(voucherValidation, subtotal);

                    voucher = {
                        code: voucherValidation.code,
                        discountType: voucherValidation.discountType,
                        discountValue: voucherValidation.discountValue,
                        appliedAmount: discount
                    };
                }
            } catch (error) {
                throw new Error(`Voucher error: ${error instanceof Error ? error.message : 'Invalid voucher'}`);
            }
        }

        // Calculate total amount
        const totalAmount = subtotal + shippingDetails.cost - discount;

        // Create purchase
        const purchase = new PurchaseModel({
            userId: data.userId,
            cartId: data.cartId,
            items: purchaseItems,
            subtotal,
            shippingDetails,
            voucher,
            totalAmount,
            paymentMethod: data.paymentMethod,
            paymentDetails: {
                paymentStatus: data.paymentMethod === PaymentMethod.COD ? 'pending' : 'pending'
            },
            shippingAddress: data.shippingAddress,
            billingAddress: data.billingAddress,
            notes: data.notes,
            status: PurchaseStatus.PENDING,
            // Store user info for easier access
            userInfo: {
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email
            }
        });
        console.log(purchase);

        const savedPurchase = await purchase.save();
        const purchaseData = savedPurchase.toJSON() as Purchase;

        // Process payment for non-COD orders
        // Mockup of real Payment systems, no url payment link will be generated.
        if (data.paymentMethod !== PaymentMethod.COD) {
            await this.processPayment(purchaseData, data.paymentToken);
        }

        // Clear cart if purchase was created from cart
        if (data.cartId) {
            await this.externalServiceClient.clearCart(data.cartId);
        }

        return purchaseData;
    }

    async getPurchaseById(id: string): Promise<Purchase | null> {
        const purchase = await PurchaseModel.findById(id);
        return purchase ? purchase.toJSON() as Purchase : null;
    }

    async getPurchases(filters: {
        userId?: string;
        status?: PurchaseStatus;
        paymentMethod?: PaymentMethod;
        page: number;
        limit: number;
        sortBy: string;
        sortOrder: 'asc' | 'desc';
    }): Promise<{ purchases: Purchase[]; total: number; page: number; totalPages: number }> {
        const query: any = {};

        if (filters.userId) query.userId = filters.userId;
        if (filters.status) query.status = filters.status;
        if (filters.paymentMethod) query.paymentMethod = filters.paymentMethod;

        const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;
        const skip = (filters.page - 1) * filters.limit;

        const [purchases, total] = await Promise.all([
            PurchaseModel.find(query)
                .sort({ [filters.sortBy]: sortOrder })
                .skip(skip)
                .limit(filters.limit)
                .lean(),
            PurchaseModel.countDocuments(query)
        ]);

        const totalPages = Math.ceil(total / filters.limit);

        return {
            purchases: purchases.map(p => ({ ...p, id: p._id, _id: undefined } as any)) as Purchase[],
            total,
            page: filters.page,
            totalPages
        };
    }

    private async processPayment(purchase: Purchase, paymentToken: string | undefined) {
        try {
            await this.externalServiceClient.processPayment(purchase, paymentToken);
            await PurchaseModel.findByIdAndUpdate(purchase.id, {
                'paymentDetails.paymentStatus': 'completed',
                'paymentDetails.paidAt': new Date(),
                status: PurchaseStatus.CONFIRMED
            });
        } catch (error) {
            await PurchaseModel.findByIdAndUpdate(purchase.id, {
                'paymentDetails.paymentStatus': 'failed',
                'paymentDetails.failureReason': error instanceof Error ? error.message : 'Payment failed'
            });
            throw error;
        }
    }
    async updatePurchaseStatus(id: string, status: PurchaseStatus): Promise<Purchase | null> {
        // Get the current purchase to check current status
        const currentPurchase = await PurchaseModel.findById(id);

        if (!currentPurchase) {
            throw new Error('Purchase not found');
        }

        // Validate status transition
        if (!this.validateStatusTransition(currentPurchase.status, status)) {
            throw new Error(`Invalid status transition from ${currentPurchase.status} to ${status}`);
        }

        const purchase = await PurchaseModel.findByIdAndUpdate(
            id,
            { status, updatedAt: new Date() },
            { new: true }
        );

        return purchase ? purchase.toJSON() as Purchase : null;
    }

    async getUserPurchases(
        userId: string,
        filters: {
            page: number;
            limit: number;
            sortBy?: string;
            sortOrder?: 'asc' | 'desc';
        }
    ): Promise<{ purchases: Purchase[]; total: number; page: number; totalPages: number }> {
        // Validate user exists first
        await this.externalServiceClient.validateUser(userId);

        const query = { userId };

        const sortBy = filters.sortBy || 'createdAt';
        const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;
        const skip = (filters.page - 1) * filters.limit;

        const [purchases, total] = await Promise.all([
            PurchaseModel.find(query)
                .sort({ [sortBy]: sortOrder })
                .skip(skip)
                .limit(filters.limit)
                .lean(),
            PurchaseModel.countDocuments(query)
        ]);

        const totalPages = Math.ceil(total / filters.limit);

        return {
            purchases: purchases.map(p => ({ ...p, id: p._id, _id: undefined } as any)) as Purchase[],
            total,
            page: filters.page,
            totalPages
        };
    }

    async getShippingOptions(subtotal: number, address: ShippingAddress): Promise<ShippingCalculation[]> {
        return [
            this.calculateShipping(subtotal, ShippingMethod.STANDARD, address),
            this.calculateShipping(subtotal, ShippingMethod.EXPRESS, address)
        ];
    }

    async deletePurchase(id: string): Promise<boolean> {
        const result = await PurchaseModel.deleteOne({ _id: id });
        return result.deletedCount > 0;
    }

    // User validation method for external use
    async validateUserForPurchase(userId: string): Promise<UserData> {
        return await this.externalServiceClient.validateUser(userId);
    }

    // Additional utility methods
    async validateVoucherCode(code: string, userId: string, subtotal: number): Promise<VoucherValidationResponse> {
        return this.validateVoucher(code, userId, subtotal);
    }

    async getAvailableVouchers(): Promise<string[]> {
        // Return available voucher codes for testing/admin purposes
        return ['SAVE10', 'WELCOME20', 'FREESHIP', 'STUDENT15', 'VIP30'];
    }
}