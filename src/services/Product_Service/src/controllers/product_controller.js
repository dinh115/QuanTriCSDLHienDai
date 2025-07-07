import * as ProductModel from '../models/product_model.js';

// Get all products with filters
export async function getProducts(req, res) {
    try {
        const filters = {
            shopId: req.query.shopId,
            status: req.query.status,
            category: req.query.category,
            search: req.query.search
        };
        
        const products = await ProductModel.getAllProducts(filters);
        res.json({
            success: true,
            data: products,
            count: products.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

// Get single product by ID
export async function getProductById(req, res) {
    try {
        const { id } = req.params;
        const product = await ProductModel.findProductById(id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

// Create new product
export async function createProduct(req, res) {
    try {
        const productData = req.body;
        
        // Validate required fields
        if (!productData.name || !productData.price || !productData.shopId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: name, price, shopId'
            });
        }
        
        const product = await ProductModel.createProduct(productData);
        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

// Update product
export async function updateProduct(req, res) {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        const product = await ProductModel.updateProduct(id, updateData);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Product updated successfully',
            data: product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

// Delete product
export async function deleteProduct(req, res) {
    try {
        const { id } = req.params;
        const product = await ProductModel.deleteProduct(id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

// Get products by shop
export async function getProductsByShop(req, res) {
    try {
        const { shopId } = req.params;
        const filters = {
            status: req.query.status,
            category: req.query.category
        };
        
        const products = await ProductModel.getProductsByShop(shopId, filters);
        res.json({
            success: true,
            data: products,
            count: products.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

// Update product stock
export async function updateProductStock(req, res) {
    try {
        const { id } = req.params;
        const { stock } = req.body;
        
        if (typeof stock !== 'number' || stock < 0) {
            return res.status(400).json({
                success: false,
                message: 'Stock must be a non-negative number'
            });
        }
        
        const product = await ProductModel.updateProductStock(id, stock);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Stock updated successfully',
            data: product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

// Validate products (for cart/order validation)
export async function validateProducts(req, res) {
    try {
        const { productIds } = req.body;
        
        if (!Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'productIds must be a non-empty array'
            });
        }
        
        const result = await ProductModel.validateProducts(productIds);

        // Map lại dữ liệu hợp lệ thành định dạng mong muốn
        const validProducts = result.valid.map(product => ({
            id: product.id,
            shopId: product.shopId,
            name: product.name,
            price: product.price,
            stock: product.stock,
            image: product.image,
            available: product.status === 'active' && product.stock > 0
        }));

        res.json({
            success: true,
            data: {
                valid: validProducts,
                invalid: result.invalid,
                validCount: validProducts.length,
                invalidCount: result.invalid.length
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}
