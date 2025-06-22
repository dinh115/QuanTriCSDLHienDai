import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Purchase, PurchaseStatus, PurchaseItem } from '../types';

export interface PurchaseDocument extends Omit<Purchase, 'id'>, Document {
    _id: string;
}

const PurchaseItemSchema = new Schema<PurchaseItem>({
    productId: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 }
}, { _id: false });

const ShippingAddressSchema = new Schema({
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true }
}, { _id: false });

const PurchaseSchema = new Schema<PurchaseDocument>({
    _id: {
        type: String,
        default: () => uuidv4(),
    },
    userId: { type: String, required: true, index: true },
    items: [PurchaseItemSchema],
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
        type: String,
        enum: Object.values(PurchaseStatus),
        default: PurchaseStatus.PENDING,
        index: true
    },
    paymentMethod: { type: String, required: true },
    shippingAddress: ShippingAddressSchema,
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