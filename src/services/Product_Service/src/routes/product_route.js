import express from 'express';
import * as ProductController from '../controllers/product_controller.js';

const router = express.Router();

router.get('/', ProductController.getProducts);
router.post('/add', ProductController.create);

export default router;
