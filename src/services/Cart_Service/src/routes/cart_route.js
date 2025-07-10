import express from 'express';
import {getCart, addItemToCart,updateCart, deleteCartItem, clearCartItems} from '../controllers/cart_controller.js';

const router = express.Router();

router.get('/:cartId', getCart);
router.post('/:cartId/items', addItemToCart);
router.put('/:cartId', updateCart);
router.delete('/:cartId/items/:itemId', deleteCartItem);
router.delete('/:cartId/items', clearCartItems);

export default router;