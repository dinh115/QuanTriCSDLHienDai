
export enum PurchaseStatus {
    PENDING = 'pending',
    CONFIRMED = 'confirmed',
    PROCESSING = 'processing',
    SHIPPED = 'shipped',
    DELIVERED = 'delivered',
    CANCELLED = 'cancelled',
    RETURNED = 'retunred',
    REFUNDED = 'refunded'
}

export enum PaymentMethod {
    COD = 'cod',
    CREDIT_CARD = 'credit_card',
    DEBIT_CARD = 'debit_card',
    PAYPAL = 'paypal'
}

export enum ShippingMethod {
    STANDARD = 'standard',
    EXPRESS = 'express',
}

export interface PurchaseItem {
    cartItemId?: string,
    productId: string;
    shopId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    productName?: string;
    productImage?: string; // Dùng cho frontend
}

export interface ShippingDetails {
    method: ShippingMethod;
    cost: number;
    estimatedDelivery: string;
    trackingNumber?: string; // Mã tra cứu đơn hàng
}

export interface VoucherDetails {
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    appliedAmount: number;
}

export interface PaymentDetails {
    transactionId?: string;
    cardLast4?: string;
    cardBrand?: string;
    paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
    paidAt?: Date;
    failureReason?: string;
}

export interface ShippingAddress {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    fullName: string;
    phoneNumber: string;
}

export interface Purchase {
    id: string;
    userId: string;
    cartId?: string; // Có thể mua thẳng, không cần bỏ vào đơn hàng
    items: PurchaseItem[];
    subtotal: number;
    shippingDetails: ShippingDetails;
    voucher?: VoucherDetails; // Có thể không áp voucher
    totalAmount: number;
    status: PurchaseStatus;
    paymentMethod: PaymentMethod;
    paymentDetails?: PaymentDetails;
    shippingAddress: ShippingAddress;
    billingAddress?: ShippingAddress;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}


export interface CreatePurchaseRequest {
    userId: string;
    cartId?: string;
    items?: Omit<PurchaseItem, 'totalPrice'>[];
    paymentMethod: PaymentMethod;
    shippingMethod: ShippingMethod;
    shippingAddress: ShippingAddress;
    billingAddress?: ShippingAddress;
    voucherCode?: string;
    paymentToken?: string; // For card payments
    notes?: string;
}

export interface UpdatePurchaseStatusRequest {
    status: PurchaseStatus;
    trackingNumber?: string;
    notes?: string;
}

export interface CartItem {
    id: string;
    shopId: string;
    productId: string;
    quantity: number;
    addedAt: Date;
}

export interface CartData {
    id: string;
    userId: string;
    items: CartItem[];
    createdAt: Date;
    updatedAt: Date;
}