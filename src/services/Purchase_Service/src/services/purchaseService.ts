import { PurchaseModel, PurchaseDocument } from '../models/Purchase';
import { CreatePurchaseRequest, PurchaseStatus, Purchase } from '../types';
import { ExternalServiceClient } from './externalServiceClient';

export class PurchaseService {
    private externalServiceClient: ExternalServiceClient;

    constructor() {
        this.externalServiceClient = new ExternalServiceClient();
    }

    async createPurchase(data: CreatePurchaseRequest): Promise<Purchase> {
        // Validate user exists (call user service)
        await this.externalServiceClient.validateUser(data.userId);

        // Validate products and get prices (call product service)
        const validatedItems = await this.externalServiceClient.validateProducts(data.items);

        // Calculate total amount
        const totalAmount = validatedItems.reduce((sum, item) => sum + item.totalPrice, 0);

        const purchase = new PurchaseModel({
            userId: data.userId,
            items: validatedItems,
            totalAmount,
            paymentMethod: data.paymentMethod,
            shippingAddress: data.shippingAddress,
            status: PurchaseStatus.PENDING
        });

        const savedPurchase = await purchase.save();
        return savedPurchase.toJSON() as Purchase;
    }

    async getPurchaseById(id: string): Promise<Purchase | null> {
        const purchase = await PurchaseModel.findById(id);
        return purchase ? purchase.toJSON() as Purchase : null;
    }

    async getPurchases(filters: {
        userId?: string;
        status?: PurchaseStatus;
        page: number;
        limit: number;
        sortBy: string;
        sortOrder: 'asc' | 'desc';
    }): Promise<{ purchases: Purchase[]; total: number; page: number; totalPages: number }> {
        const query: any = {};

        if (filters.userId) query.userId = filters.userId;
        if (filters.status) query.status = filters.status;

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

    async updatePurchaseStatus(id: string, status: PurchaseStatus): Promise<Purchase | null> {
        const purchase = await PurchaseModel.findByIdAndUpdate(
            id,
            { status, updatedAt: new Date() },
            { new: true }
        );

        if (!purchase) return null;

        // Notify payment service if status changes to confirmed
        if (status === PurchaseStatus.CONFIRMED) {
            await this.externalServiceClient.processPayment(purchase.toJSON() as Purchase);
        }

        return purchase.toJSON() as Purchase;
    }

    async deletePurchase(id: string): Promise<boolean> {
        const result = await PurchaseModel.deleteOne({ _id: id });
        return result.deletedCount > 0;
    }

    async getUserPurchases(userId: string): Promise<Purchase[]> {
        const purchases = await PurchaseModel.find({ userId }).sort({ createdAt: -1 });
        return purchases.map(p => p.toJSON() as Purchase);
    }
}
