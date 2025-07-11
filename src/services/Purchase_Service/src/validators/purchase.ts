import Joi from 'joi';
import { PurchaseStatus, PaymentMethod, ShippingMethod } from '../types';

export const createPurchaseSchema = Joi.object({
    userId: Joi.string().uuid().required(),
    cartId: Joi.string().uuid().optional(),
    items: Joi.array().items(
        Joi.object({
            productId: Joi.string().uuid().required(),
            quantity: Joi.number().integer().min(1).required(),
            unitPrice: Joi.number().min(0).optional(),
            cartItemId: Joi.string().uuid().optional()
        })
    ).optional(),
    paymentMethod: Joi.string().valid(...Object.values(PaymentMethod)).required(),
    shippingMethod: Joi.string().valid(...Object.values(ShippingMethod)).required(),
    shippingAddress: Joi.object({
        street: Joi.string().required(),
        city: Joi.string().required(),
        state: Joi.string().required(),
        zipCode: Joi.string().required(),
        country: Joi.string().required(),
        fullName: Joi.string().required(),
        phoneNumber: Joi.string().required()
    }).required(),
    billingAddress: Joi.object({
        street: Joi.string().required(),
        city: Joi.string().required(),
        state: Joi.string().required(),
        zipCode: Joi.string().required(),
        country: Joi.string().required(),
        fullName: Joi.string().required(),
        phoneNumber: Joi.string().required()
    }).optional(),
    voucherCode: Joi.string().optional(),
    paymentToken: Joi.string().when('paymentMethod', {
        is: Joi.valid(PaymentMethod.CREDIT_CARD, PaymentMethod.DEBIT_CARD),
        then: Joi.required(),
        otherwise: Joi.optional()
    }),
    notes: Joi.string().max(500).optional()
}).custom((value, helpers) => {
    if (!value.cartId && (!value.items || value.items.length === 0)) {
        return helpers.error('custom.cartOrItems');
    }
    return value;
}).messages({
    'custom.cartOrItems': 'Either cartId or items must be provided'
});

export const updatePurchaseStatusSchema = Joi.object({
    status: Joi.string().valid(...Object.values(PurchaseStatus)).required(),
    trackingNumber: Joi.string().optional(),
    notes: Joi.string().max(500).optional()
});

export const queryUserPurchasesSchema = Joi.object({
    status: Joi.string().valid(...Object.values(PurchaseStatus)).optional(),
    paymentMethod: Joi.string().valid(...Object.values(PaymentMethod)).optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'amount', 'status').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

export const queryPurchasesSchema = Joi.object({
    userId: Joi.string().uuid().optional(),
    status: Joi.string().valid(...Object.values(PurchaseStatus)).optional(),
    paymentMethod: Joi.string().valid(...Object.values(PaymentMethod)).optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'totalAmount').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

export const shippingCalculationSchema = Joi.object({
    subtotal: Joi.number().min(0).required(),
    shippingAddress: Joi.object({
        street: Joi.string().required(),
        city: Joi.string().required(),
        state: Joi.string().required(),
        zipCode: Joi.string().required(),
        country: Joi.string().required(),
        fullName: Joi.string().required(),
        phoneNumber: Joi.string().required()
    }).required()
});
