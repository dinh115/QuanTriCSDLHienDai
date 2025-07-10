import { Response } from 'express';
import { PurchaseService } from '../services/purchaseService';
import { AuthenticatedRequest } from '../middleware/auth';
import {
    createPurchaseSchema,
    updatePurchaseStatusSchema,
    queryPurchasesSchema,
    queryUserPurchasesSchema,
    shippingCalculationSchema
} from '../validators/purchase';
import axios from 'axios';

export class PurchaseController {
    private purchaseService: PurchaseService;

    constructor() {
        this.purchaseService = new PurchaseService();
    }

    createPurchase = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { error, value } = createPurchaseSchema.validate(req.body);
            if (error) {
                res.status(400).json({
                    success: false,
                    error: error.details[0].message
                });
                return;
            }

            console.info(JSON.stringify(value));

            if (req.user?.role !== 'admin' && value.userId !== req.user?.userId) {
                res.status(403).json({ error: 'Cannot create purchase for another user' });
                return;
            }

            const purchase = await this.purchaseService.createPurchase(value);
            res.status(201).json({
                success: true,
                data: purchase,
                message: 'Purchase created successfully'
            });
        } catch (error) {
            console.error('❌ Create purchase error:');

            if (axios.isAxiosError(error)) {
                console.error(`→ Message: ${error.message}`);
                console.error(`→ URL: ${error.config?.url}`);
                console.error(`→ Status: ${error.response?.status}`);
                console.error(`→ Response: ${JSON.stringify(error.response?.data, null, 2)}`);
            } else if (error instanceof Error) {
                console.error(`→ ${error.message}`);
            } else {
                console.error('→ Unknown error:', error);
            }

            const message = axios.isAxiosError(error)
                ? error.response?.data?.message || error.response?.data?.error || error.message || 'Request failed'
                : error instanceof Error
                    ? error.message
                    : 'Internal server error';

            res.status(500).json({
                success: false,
                error: message
            });
        }
    };

    getPurchase = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const purchase = await this.purchaseService.getPurchaseById(id);

            if (!purchase) {
                res.status(404).json({ success: false, error: 'Purchase not found' });
                return;
            }

            if (req.user?.role !== 'admin' && purchase.userId !== req.user?.userId) {
                res.status(403).json({ success: false, error: 'Access denied' });
                return;
            }

            res.json({ success: true, data: purchase });
        } catch (error) {
            console.error('❌ Get purchase error:');
            this.logAxiosOrError(error);
            res.status(500).json({ success: false, error: this.extractErrorMessage(error) });
        }
    };

    getPurchases = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { error, value } = queryPurchasesSchema.validate(req.query);
            if (error) {
                res.status(400).json({ success: false, error: error.details[0].message });
                return;
            }

            if (req.user?.role !== 'admin') value.userId = req.user?.userId;

            const result = await this.purchaseService.getPurchases(value);
            res.json({ success: true, data: result });
        } catch (error) {
            console.error('❌ Get purchases error:');
            this.logAxiosOrError(error);
            res.status(500).json({ success: false, error: this.extractErrorMessage(error) });
        }
    };

    updatePurchaseStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const { error, value } = updatePurchaseStatusSchema.validate(req.body);

            if (error) {
                res.status(400).json({ success: false, error: error.details[0].message });
                return;
            }

            const existingPurchase = await this.purchaseService.getPurchaseById(id);
            if (!existingPurchase) {
                res.status(404).json({ success: false, error: 'Purchase not found' });
                return;
            }

            if (req.user?.role !== 'admin' && existingPurchase.userId !== req.user?.userId) {
                res.status(403).json({ success: false, error: 'Access denied' });
                return;
            }

            if (req.user?.role !== 'admin') {
                if (value.status !== 'cancelled' || existingPurchase.status !== 'pending') {
                    res.status(403).json({ success: false, error: 'You can only cancel pending purchases' });
                    return;
                }
            }

            const purchase = await this.purchaseService.updatePurchaseStatus(id, value.status);
            res.json({ success: true, data: purchase, message: 'Purchase status updated successfully' });
        } catch (error) {
            console.error('❌ Update purchase error:');
            this.logAxiosOrError(error);
            res.status(500).json({ success: false, error: this.extractErrorMessage(error) });
        }
    };

    getUserPurchases = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { userId } = req.params;

            if (req.user?.role !== 'admin' && req.user?.userId !== userId) {
                res.status(403).json({ error: 'Access denied' });
                return;
            }

            const { error, value } = queryUserPurchasesSchema.validate(req.query);
            if (error) {
                res.status(400).json({ success: false, error: error.details[0].message });
                return;
            }

            const result = await this.purchaseService.getUserPurchases(userId, value);
            res.json({ success: true, data: result });
        } catch (error) {
            console.error('❌ Get user purchase error:');
            this.logAxiosOrError(error);
            res.status(500).json({ success: false, error: this.extractErrorMessage(error) });
        }
    };

    calculateShipping = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { error, value } = shippingCalculationSchema.validate(req.body);
            if (error) {
                res.status(400).json({ success: false, error: error.details[0].message });
                return;
            }

            const shippingOptions = await this.purchaseService.getShippingOptions(
                value.subtotal,
                value.shippingAddress
            );

            res.json({ success: true, data: shippingOptions });
        } catch (error) {
            console.error('❌ Calculate shipping error:');
            this.logAxiosOrError(error);
            res.status(500).json({ success: false, error: this.extractErrorMessage(error) });
        }
    };

    private extractErrorMessage = (error: unknown): string => {
        if (axios.isAxiosError(error)) {
            return error.response?.data?.message || error.response?.data?.error || error.message || 'Request failed';
        } else if (error instanceof Error) {
            return error.message;
        } else {
            return 'Internal server error';
        }
    };

    private logAxiosOrError = (error: unknown): void => {
        if (axios.isAxiosError(error)) {
            console.error(`→ Message: ${error.message}`);
            console.error(`→ URL: ${error.config?.url}`);
            console.error(`→ Status: ${error.response?.status}`);
            console.error(`→ Response: ${JSON.stringify(error.response?.data, null, 2)}`);
        } else if (error instanceof Error) {
            console.error(`→ ${error.message}`);
        } else {
            console.error('→ Unknown error:', error);
        }
    };
}
