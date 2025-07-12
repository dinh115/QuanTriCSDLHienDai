// routes/products.js - Server-side route handler
const express = require('express');
const router = express.Router();
const axios = require('axios');

// Product service base URL
const PRODUCT_SERVICE_URL = 'http://localhost:3001';

// Get products with filtering and pagination
router.get('/products', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 12,
            category,
            sort,
            status = 'active',
            search
        } = req.query;

        // Build query parameters for product service
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            status
        });

        if (category) params.append('category', category);
        if (sort) params.append('sort', sort);
        if (search) params.append('search', search);

        // Call product service
        const response = await axios.get(`${PRODUCT_SERVICE_URL}/products?${params}`);
        
        // Return formatted response
        res.json({
            success: true,
            products: response.data.products || [],
            total: response.data.total || 0,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil((response.data.total || 0) / parseInt(limit))
        });

    } catch (error) {
        console.error('Error fetching products:', error.message);
        res.status(500).json({
            success: false,
            error: 'Không thể tải danh sách sản phẩm',
            details: error.message
        });
    }
});

// Get product categories
router.get('/products/categories', async (req, res) => {
    try {
        const response = await axios.get(`${PRODUCT_SERVICE_URL}/products/categories`);
        
        res.json({
            success: true,
            categories: response.data.categories || []
        });

    } catch (error) {
        console.error('Error fetching categories:', error.message);
        res.status(500).json({
            success: false,
            error: 'Không thể tải danh mục sản phẩm',
            details: error.message
        });
    }
});

// Get single product
router.get('/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const response = await axios.get(`${PRODUCT_SERVICE_URL}/products/${id}`);
        
        res.json({
            success: true,
            product: response.data.product || null
        });

    } catch (error) {
        console.error('Error fetching product:', error.message);
        res.status(404).json({
            success: false,
            error: 'Không tìm thấy sản phẩm',
            details: error.message
        });
    }
});

// Search products
router.get('/products/search', async (req, res) => {
    try {
        const {
            q: query,
            page = 1,
            limit = 12,
            category,
            sort
        } = req.query;

        if (!query) {
            return res.status(400).json({
                success: false,
                error: 'Vui lòng nhập từ khóa tìm kiếm'
            });
        }

        const params = new URLSearchParams({
            search: query,
            page: page.toString(),
            limit: limit.toString(),
            status: 'active'
        });

        if (category) params.append('category', category);
        if (sort) params.append('sort', sort);

        const response = await axios.get(`${PRODUCT_SERVICE_URL}/products?${params}`);
        
        res.json({
            success: true,
            products: response.data.products || [],
            total: response.data.total || 0,
            query,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil((response.data.total || 0) / parseInt(limit))
        });

    } catch (error) {
        console.error('Error searching products:', error.message);
        res.status(500).json({
            success: false,
            error: 'Lỗi khi tìm kiếm sản phẩm',
            details: error.message
        });
    }
});

// Get products by brand
router.get('/products/brand/:brand', async (req, res) => {
    try {
        const { brand } = req.params;
        const {
            page = 1,
            limit = 12,
            sort
        } = req.query;

        const params = new URLSearchParams({
            brand,
            page: page.toString(),
            limit: limit.toString(),
            status: 'active'
        });

        if (sort) params.append('sort', sort);

        const response = await axios.get(`${PRODUCT_SERVICE_URL}/products?${params}`);
        
        res.json({
            success: true,
            products: response.data.products || [],
            total: response.data.total || 0,
            brand,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil((response.data.total || 0) / parseInt(limit))
        });

    } catch (error) {
        console.error('Error fetching products by brand:', error.message);
        res.status(500).json({
            success: false,
            error: 'Không thể tải sản phẩm theo thương hiệu',
            details: error.message
        });
    }
});

module.exports = router;