import express from 'express';
import { addItemToCart, getCart, clearCartItems } from '../controllers/cart_controller.js';

const router = express.Router();

router.post('/carts/:cartId/items', addItemToCart);
router.get('/carts/:cartId', getCart);
router.delete('/carts/:cartId/items', clearCartItems);

export default router;
