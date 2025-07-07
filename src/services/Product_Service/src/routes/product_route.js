import express from 'express';
import * as ProductController from '../controllers/product_controller.js';

const router = express.Router();

// Get all products (with optional filters)
router.get('/', ProductController.getProducts);

// Get single product by ID
router.get('/:id', ProductController.getProductById);

// Create new product
router.post('/', ProductController.createProduct);

// Update product
router.put('/:id', ProductController.updateProduct);

// Delete product
router.delete('/:id', ProductController.deleteProduct);

// Get products by shop
router.get('/shop/:shopId', ProductController.getProductsByShop);

// Update product stock
router.patch('/:id/stock', ProductController.updateProductStock);

// Validate products (for cart/order validation)
router.post('/validate', ProductController.validateProducts);

// Legacy routes for backward compatibility
router.post('/add', ProductController.createProduct);

export default router;