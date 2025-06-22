export enum PurchaseStatus {
    PENDING = 'pending',
    CONFIRMED = 'confirmed',
    PROCESSING = 'processing',
    SHIPPED = 'shipped',
    DELIVERED = 'delivered',
    CANCELLED = 'cancelled',
    REFUNDED = 'refunded'
}

export interface PurchaseItem {
    productId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

export interface Purchase {
    id: string;
    userId: string;
    items: PurchaseItem[];
    totalAmount: number;
    status: PurchaseStatus;
    paymentMethod: string;
    shippingAddress: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

export interface CreatePurchaseRequest {
    userId: string;
    items: Omit<PurchaseItem, 'totalPrice'>[];
    paymentMethod: string;
    shippingAddress: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };
}

export interface UpdatePurchaseStatusRequest {
    status: PurchaseStatus;
}