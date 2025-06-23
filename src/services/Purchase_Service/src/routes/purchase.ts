import { Router } from 'express';
import { PurchaseController } from '../controllers/purchaseController';
import {
    authenticate,
    authorize,
    authorizeOwnerOrAdmin,
    authorizePurchaseAccess,
    authorizePurchaseStatusUpdate
} from '../middleware/auth';

const router = Router();
const purchaseController = new PurchaseController();

// All routes require authentication
router.use(authenticate);

// Create a new purchase 
// Customers can create for themselves, admins can create for anyone
router.post('/', purchaseController.createPurchase);

// Get all purchases 
// Admins see all, customers see only their own
router.get('/', purchaseController.getPurchases);

// Calculate shipping options (any authenticated user)
router.post('/shipping/calculate', purchaseController.calculateShipping);

// Get a specific purchase by ID
// Owner or admin only - authorization check will be in controller
router.get('/:id', authorizePurchaseAccess, purchaseController.getPurchase);

// Update purchase status
// Admin can update any status, customers can only cancel their pending purchases
router.patch('/:id/status', authorizePurchaseStatusUpdate, purchaseController.updatePurchaseStatus);

// Get purchases for a specific user
// Owner or admin only
router.get('/user/:userId', authorizeOwnerOrAdmin, purchaseController.getUserPurchases);


export default router;