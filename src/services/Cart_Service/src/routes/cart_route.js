import express from 'express';
import cartController from '../controllers/cart_controller.js';

const router = express.Router();

router.post('/add', cartController.addToCart);
router.get('/:userId', cartController.getCart);
router.delete('/remove', cartController.removeFromCart);

export default router;