import { Response } from 'express';
import { PurchaseService } from '../services/purchaseService';
import { AuthenticatedRequest } from '../middleware/auth';
import {
    createPurchaseSchema,
    updatePurchaseStatusSchema,
    queryPurchasesSchema
} from '../validators/purchase';

export class PurchaseController {
    private purchaseService: PurchaseService;

    constructor() {
        this.purchaseService = new PurchaseService();
    }

    createPurchase = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { error, value } = createPurchaseSchema.validate(req.body);
            if (error) {
                res.status(400).json({ error: error.details[0].message });
                return;
            }

            // Ensure user can only create purchases for themselves (unless admin)
            if (req.user?.role !== 'admin' && value.userId !== req.user?.userId) {
                res.status(403).json({ error: 'Cannot create purchase for another user' });
                return;
            }

            const purchase = await this.purchaseService.createPurchase(value);
            res.status(201).json({ success: true, data: purchase });
        } catch (error) {
            console.error('Create purchase error:', error);
            res.status(500).json({
                error: error instanceof Error ? error.message : 'Internal server error'
            });
        }
    };

    getPurchase = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const purchase = await this.purchaseService.getPurchaseById(id);

            if (!purchase) {
                res.status(404).json({ error: 'Purchase not found' });
                return;
            }

            // Check if user can access this purchase
            if (req.user?.role !== 'admin' && purchase.userId !== req.user?.userId) {
                res.status(403).json({ error: 'Access denied' });
                return;
            }

            res.json({ success: true, data: purchase });
        } catch (error) {
            console.error('Get purchase error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    getPurchases = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { error, value } = queryPurchasesSchema.validate(req.query);
            if (error) {
                res.status(400).json({ error: error.details[0].message });
                return;
            }

            // Non-admin users can only see their own purchases
            if (req.user?.role !== 'admin') {
                value.userId = req.user?.userId;
            }

            const result = await this.purchaseService.getPurchases(value);
            res.json({ success: true, data: result });
        } catch (error) {
            console.error('Get purchases error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    updatePurchaseStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const { error, value } = updatePurchaseStatusSchema.validate(req.body);

            if (error) {
                res.status(400).json({ error: error.details[0].message });
                return;
            }

            // Check if purchase exists and user has access
            const existingPurchase = await this.purchaseService.getPurchaseById(id);
            if (!existingPurchase) {
                res.status(404).json({ error: 'Purchase not found' });
                return;
            }

            // Only admin or purchase owner can update (with restrictions)
            if (req.user?.role !== 'admin' && existingPurchase.userId !== req.user?.userId) {
                res.status(403).json({ error: 'Access denied' });
                return;
            }

            // Regular users can only cancel their own pending purchases
            if (req.user?.role !== 'admin') {
                if (value.status !== 'cancelled' || existingPurchase.status !== 'pending') {
                    res.status(403).json({ error: 'You can only cancel pending purchases' });
                    return;
                }
            }

            const purchase = await this.purchaseService.updatePurchaseStatus(id, value.status);
            res.json({ success: true, data: purchase });
        } catch (error) {
            console.error('Update purchase status error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    getUserPurchases = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { userId } = req.params;

            // Check authorization
            if (req.user?.role !== 'admin' && req.user?.userId !== userId) {
                res.status(403).json({ error: 'Access denied' });
                return;
            }

            const purchases = await this.purchaseService.getUserPurchases(userId);
            res.json({ success: true, data: purchases });
        } catch (error) {
            console.error('Get user purchases error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    };
}