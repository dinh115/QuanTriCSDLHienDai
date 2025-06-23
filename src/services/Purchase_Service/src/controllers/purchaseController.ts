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
import chalk from 'chalk';
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

            // Ensure user can only create purchases for themselves (unless admin)
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
            console.error(chalk.bold.red('❌ Create purchase error:'));

            if (axios.isAxiosError(error)) {
                console.error(
                    chalk.redBright(`→ Message: ${error.message}`),
                    '\n',
                    chalk.gray(`→ URL: ${error.config?.url}`),
                    '\n',
                    chalk.yellowBright(`→ Status: ${error.response?.status}`),
                    '\n',
                    chalk.cyan(`→ Response: ${JSON.stringify(error.response?.data, null, 2)}`)
                );
            } else if (error instanceof Error) {
                console.error(chalk.redBright(`→ ${error.message}`));
            } else {
                console.error(chalk.gray('→ Unknown error:'), error);
            }
            let message = 'Internal server error';

            if (axios.isAxiosError(error)) {
                message =
                    error.response?.data?.message ||
                    error.response?.data?.error ||
                    error.message ||
                    'Request failed';
            } else if (error instanceof Error) {
                message = error.message;
            }

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
                res.status(404).json({
                    success: false,
                    error: 'Purchase not found'
                });
                return;
            }

            // Check if user can access this purchase
            if (req.user?.role !== 'admin' && purchase.userId !== req.user?.userId) {
                res.status(403).json({
                    success: false,
                    error: 'Access denied'
                });
                return;
            }

            res.json({
                success: true,
                data: purchase
            });
        } catch (error) {
            console.error(chalk.bold.red('❌ Get purchase error:'));

            if (axios.isAxiosError(error)) {
                console.error(
                    chalk.redBright(`→ Message: ${error.message}`),
                    '\n',
                    chalk.gray(`→ URL: ${error.config?.url}`),
                    '\n',
                    chalk.yellowBright(`→ Status: ${error.response?.status}`),
                    '\n',
                    chalk.cyan(`→ Response: ${JSON.stringify(error.response?.data, null, 2)}`)
                );
            } else if (error instanceof Error) {
                console.error(chalk.redBright(`→ ${error.message}`));
            } else {
                console.error(chalk.gray('→ Unknown error:'), error);
            }
            let message = 'Internal server error';

            if (axios.isAxiosError(error)) {
                message =
                    error.response?.data?.message ||
                    error.response?.data?.error ||
                    error.message ||
                    'Request failed';
            } else if (error instanceof Error) {
                message = error.message;
            }

            res.status(500).json({
                success: false,
                error: message
            });
        }
    };

    getPurchases = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { error, value } = queryPurchasesSchema.validate(req.query);
            if (error) {
                res.status(400).json({
                    success: false,
                    error: error.details[0].message
                });
                return;
            }

            // Non-admin users can only see their own purchases
            if (req.user?.role !== 'admin') {
                value.userId = req.user?.userId;
            }

            const result = await this.purchaseService.getPurchases(value);
            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error(chalk.bold.red('❌ Get purchases error:'));

            if (axios.isAxiosError(error)) {
                console.error(
                    chalk.redBright(`→ Message: ${error.message}`),
                    '\n',
                    chalk.gray(`→ URL: ${error.config?.url}`),
                    '\n',
                    chalk.yellowBright(`→ Status: ${error.response?.status}`),
                    '\n',
                    chalk.cyan(`→ Response: ${JSON.stringify(error.response?.data, null, 2)}`)
                );
            } else if (error instanceof Error) {
                console.error(chalk.redBright(`→ ${error.message}`));
            } else {
                console.error(chalk.gray('→ Unknown error:'), error);
            }
            let message = 'Internal server error';

            if (axios.isAxiosError(error)) {
                message =
                    error.response?.data?.message ||
                    error.response?.data?.error ||
                    error.message ||
                    'Request failed';
            } else if (error instanceof Error) {
                message = error.message;
            }

            res.status(500).json({
                success: false,
                error: message
            });
        }
    };

    updatePurchaseStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const { error, value } = updatePurchaseStatusSchema.validate(req.body);

            if (error) {
                res.status(400).json({
                    success: false,
                    error: error.details[0].message
                });
                return;
            }

            // Check if purchase exists and user has access
            const existingPurchase = await this.purchaseService.getPurchaseById(id);
            if (!existingPurchase) {
                res.status(404).json({ success: false, error: 'Purchase not found' });
                return;
            }

            // Only admin or purchase owner can update (with restrictions)
            if (req.user?.role !== 'admin' && existingPurchase.userId !== req.user?.userId) {
                res.status(403).json({ success: false, error: 'Access denied' });
                return;
            }

            // Regular users can only cancel their own pending purchases
            if (req.user?.role !== 'admin') {
                if (value.status !== 'cancelled' || existingPurchase.status !== 'pending') {
                    res.status(403).json({ success: false, error: 'You can only cancel pending purchases' });
                    return;
                }
            }

            const purchase = await this.purchaseService.updatePurchaseStatus(id, value.status);
            res.json({
                success: true,
                data: purchase,
                message: 'Purchase status updated successfully'
            });
        } catch (error) {
            console.error(chalk.bold.red('❌ Update purchase error:'));

            if (axios.isAxiosError(error)) {
                console.error(
                    chalk.redBright(`→ Message: ${error.message}`),
                    '\n',
                    chalk.gray(`→ URL: ${error.config?.url}`),
                    '\n',
                    chalk.yellowBright(`→ Status: ${error.response?.status}`),
                    '\n',
                    chalk.cyan(`→ Response: ${JSON.stringify(error.response?.data, null, 2)}`)
                );
            } else if (error instanceof Error) {
                console.error(chalk.redBright(`→ ${error.message}`));
            } else {
                console.error(chalk.gray('→ Unknown error:'), error);
            }
            let message = 'Internal server error';

            if (axios.isAxiosError(error)) {
                message =
                    error.response?.data?.message ||
                    error.response?.data?.error ||
                    error.message ||
                    'Request failed';
            } else if (error instanceof Error) {
                message = error.message;
            }

            res.status(500).json({
                success: false,
                error: message
            });
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

            const { error, value } = queryUserPurchasesSchema.validate(req.query);
            if (error) {
                res.status(400).json({
                    success: false,
                    error: error.details[0].message
                });
                return;
            }

            const result = await this.purchaseService.getUserPurchases(userId, value);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error(chalk.bold.red('❌ Get user purchase error:'));

            if (axios.isAxiosError(error)) {
                console.error(
                    chalk.redBright(`→ Message: ${error.message}`),
                    '\n',
                    chalk.gray(`→ URL: ${error.config?.url}`),
                    '\n',
                    chalk.yellowBright(`→ Status: ${error.response?.status}`),
                    '\n',
                    chalk.cyan(`→ Response: ${JSON.stringify(error.response?.data, null, 2)}`)
                );
            } else if (error instanceof Error) {
                console.error(chalk.redBright(`→ ${error.message}`));
            } else {
                console.error(chalk.gray('→ Unknown error:'), error);
            }
            let message = 'Internal server error';

            if (axios.isAxiosError(error)) {
                message =
                    error.response?.data?.message ||
                    error.response?.data?.error ||
                    error.message ||
                    'Request failed';
            } else if (error instanceof Error) {
                message = error.message;
            }

            res.status(500).json({
                success: false,
                error: message
            });
        }
    };

    calculateShipping = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const { error, value } = shippingCalculationSchema.validate(req.body);
            if (error) {
                res.status(400).json({
                    success: false,
                    error: error.details[0].message
                });
                return;
            }

            const shippingOptions = await this.purchaseService.getShippingOptions(
                value.subtotal,
                value.shippingAddress
            );

            res.json({
                success: true,
                data: shippingOptions
            });
        } catch (error) {
            console.error(chalk.bold.red('❌ Calculate shipping error:'));

            if (axios.isAxiosError(error)) {
                console.error(
                    chalk.redBright(`→ Message: ${error.message}`),
                    '\n',
                    chalk.gray(`→ URL: ${error.config?.url}`),
                    '\n',
                    chalk.yellowBright(`→ Status: ${error.response?.status}`),
                    '\n',
                    chalk.cyan(`→ Response: ${JSON.stringify(error.response?.data, null, 2)}`)
                );
            } else if (error instanceof Error) {
                console.error(chalk.redBright(`→ ${error.message}`));
            } else {
                console.error(chalk.gray('→ Unknown error:'), error);
            }
            let message = 'Internal server error';

            if (axios.isAxiosError(error)) {
                message =
                    error.response?.data?.message ||
                    error.response?.data?.error ||
                    error.message ||
                    'Request failed';
            } else if (error instanceof Error) {
                message = error.message;
            }

            res.status(500).json({
                success: false,
                error: message
            });
        }
    };
}