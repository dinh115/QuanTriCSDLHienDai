import Joi from 'joi';
import { PurchaseStatus } from '../types';

export const createPurchaseSchema = Joi.object({
    userId: Joi.string().required(),
    items: Joi.array().items(
        Joi.object({
            productId: Joi.string().required(),
            quantity: Joi.number().integer().min(1).required(),
            unitPrice: Joi.number().min(0).required()
        })
    ).min(1).required(),
    paymentMethod: Joi.string().required(),
    shippingAddress: Joi.object({
        street: Joi.string().required(),
        city: Joi.string().required(),
        state: Joi.string().required(),
        zipCode: Joi.string().required(),
        country: Joi.string().required()
    }).required()
});

export const updatePurchaseStatusSchema = Joi.object({
    status: Joi.string().valid(...Object.values(PurchaseStatus)).required()
});

export const queryPurchasesSchema = Joi.object({
    userId: Joi.string().optional(),
    status: Joi.string().valid(...Object.values(PurchaseStatus)).optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'totalAmount').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});
