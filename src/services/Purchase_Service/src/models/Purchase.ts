import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import {
    Purchase,
    PurchaseStatus,
    PaymentMethod,
    ShippingMethod,
    PurchaseItem,
    ShippingDetails,
    VoucherDetails,
    PaymentDetails,
    ShippingAddress
} from '../types';

export interface PurchaseDocument extends Omit<Purchase, 'id'>, Document {
    _id: string;
}

const PurchaseItemSchema = new Schema<PurchaseItem>({
    productId: { type: String, required: true },
    shopId: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    productName: { type: String },
    productImage: { type: String }
}, { _id: false });

const ShippingDetailsSchema = new Schema<ShippingDetails>({
    method: {
        type: String,
        enum: Object.values(ShippingMethod),
        required: true
    },
    cost: { type: Number, required: true, min: 0 },
    estimatedDelivery: { type: String, required: true },
    trackingNumber: { type: String }
}, { _id: false });

const VoucherDetailsSchema = new Schema<VoucherDetails>({
    code: { type: String, required: true },
    discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    appliedAmount: { type: Number, required: true, min: 0 }
}, { _id: false });

const PaymentDetailsSchema = new Schema<PaymentDetails>({
    transactionId: { type: String },
    cardLast4: { type: String },
    cardBrand: { type: String },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    paidAt: { type: Date },
    failureReason: { type: String }
}, { _id: false });

const ShippingAddressSchema = new Schema<ShippingAddress>({
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true },
    fullName: { type: String, required: true },
    phoneNumber: { type: String, required: true }
}, { _id: false });

const PurchaseSchema = new Schema<PurchaseDocument>({
    _id: {
        type: String,
        default: () => uuidv4(),
    },
    userId: { type: String, required: true, index: true },
    cartId: { type: String },
    items: [PurchaseItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    shippingDetails: { type: ShippingDetailsSchema, required: true },
    voucher: { type: VoucherDetailsSchema },
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
        type: String,
        enum: Object.values(PurchaseStatus),
        default: PurchaseStatus.PENDING,
        index: true
    },
    paymentMethod: {
        type: String,
        enum: Object.values(PaymentMethod),
        required: true
    },
    paymentDetails: { type: PaymentDetailsSchema },
    shippingAddress: { type: ShippingAddressSchema, required: true },
    billingAddress: { type: ShippingAddressSchema },
    notes: { type: String }
}, {
    timestamps: true,
    versionKey: false
});

// Transform the output to use 'id' instead of '_id'
PurchaseSchema.set('toJSON', {
    transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        return ret;
    }
});

export const PurchaseModel = mongoose.model<PurchaseDocument>('Purchase', PurchaseSchema);
