import { Router } from 'express';
import { PurchaseController } from '../controllers/purchaseController';
import { authenticate, authorize, authorizeOwnerOrAdmin } from '../middleware/auth';

const router = Router();
const purchaseController = new PurchaseController();

// All routes require authentication
router.use(authenticate);

// Create a new purchase (customers can create for themselves, admins for anyone)
router.post('/', purchaseController.createPurchase);

// Get all purchases (admins see all, customers see only their own)
router.get('/', purchaseController.getPurchases);

// Get a specific purchase by ID (owner or admin only)
router.get('/:id', purchaseController.getPurchase);

// Update purchase status (admin can update any, customers can only cancel their pending purchases)
router.patch('/:id/status', purchaseController.updatePurchaseStatus);

// Get purchases for a specific user (owner or admin only)
router.get('/user/:userId', purchaseController.getUserPurchases);

export default router;