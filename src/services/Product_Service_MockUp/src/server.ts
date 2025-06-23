import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 3002;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Enhanced product interface
interface Product {
    id: string;
    shopId: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    category: string;
    subcategory?: string;
    brand?: string;
    image?: string;
    images?: string[];
    status: 'active' | 'inactive' | 'discontinued';
    rating?: number;
    reviewCount?: number;
    tags?: string[];
    specifications?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

// Enhanced mock product data
const products: Product[] = [
    {
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        shopId: '22812e8f-2523-4f00-a134-0223a71cd07d',
        name: 'Sony WH-1000XM5 Wireless Headphones',
        description: 'Industry-leading noise canceling wireless headphones with premium sound quality and all-day comfort',
        price: 7490000,
        stock: 45,
        category: 'Electronics',
        subcategory: 'Audio',
        brand: 'Sony',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
        images: [
            'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
            'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500'
        ],
        status: 'active',
        rating: 4.8,
        reviewCount: 2456,
        tags: ['wireless', 'noise-canceling', 'premium', 'bluetooth'],
        specifications: {
            batteryLife: '30 hours',
            connectivity: 'Bluetooth 5.2',
            weight: '250g',
            driverSize: '30mm'
        },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
    },
    {
        id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        shopId: '12190a5b-3d4e-4fa8-8c5a-3b0526a5a85d',
        name: 'iPhone 15 Pro Max Case',
        description: 'Ultra-protective case with military-grade drop protection and wireless charging compatibility',
        price: 1090000,
        stock: 150,
        category: 'Accessories',
        subcategory: 'Phone Cases',
        brand: 'OtterBox',
        image: 'https://images.unsplash.com/photo-1601593346740-925612772716?w=500',
        status: 'active',
        rating: 4.6,
        reviewCount: 892,
        tags: ['protective', 'wireless-charging', 'drop-proof'],
        specifications: {
            material: 'Polycarbonate + TPU',
            dropProtection: '4x Military Standard',
            compatibility: 'iPhone 15 Pro Max'
        },
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-02-15')
    },
    {
        id: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
        shopId: 'd7119d2c-3488-444c-bc08-07dc24513c4b',
        name: 'UPLIFT V2 Standing Desk',
        description: 'Premium height-adjustable standing desk with memory presets and cable management',
        price: 2080000,
        stock: 12,
        category: 'Furniture',
        subcategory: 'Office Desk',
        brand: 'UPLIFT',
        image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500',
        status: 'active',
        rating: 4.9,
        reviewCount: 1567,
        tags: ['ergonomic', 'height-adjustable', 'memory-presets', 'cable-management'],
        specifications: {
            heightRange: '25.3" - 50.9"',
            weight: '85 lbs',
            maxLoad: '355 lbs',
            desktop: 'Bamboo'
        },
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-03-01')
    },
    {
        id: '550e8400-e29b-41d4-a716-446655440000',
        shopId: '26515359-2f3e-4bca-ba09-b1abcaea1911',
        name: 'Anker PowerLine III USB-C Cable',
        description: 'Ultra-durable USB-C to USB-C cable with 100W power delivery and 480Mbps data transfer',
        price: 50000,
        stock: 300,
        category: 'Electronics',
        subcategory: 'Cables',
        brand: 'Anker',
        image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=500',
        status: 'active',
        rating: 4.7,
        reviewCount: 3421,
        tags: ['usb-c', 'fast-charging', '100w', 'durable'],
        specifications: {
            length: '6ft',
            powerDelivery: '100W',
            dataTransfer: '480Mbps',
            durability: '25,000+ bend lifespan'
        },
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15')
    },
    {
        id: '123e4567-e89b-12d3-a456-426614174000',
        shopId: '5e8eb443-645b-45f6-aab6-227a6e630597',
        name: 'MacBook Pro M3 14"',
        description: 'Powerful laptop with M3 chip, Liquid Retina XDR display, and all-day battery life',
        price: 52000000,
        stock: 8,
        category: 'Electronics',
        subcategory: 'Laptops',
        brand: 'Apple',
        image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500',
        status: 'active',
        rating: 4.9,
        reviewCount: 756,
        tags: ['laptop', 'm3-chip', 'retina-display', 'professional'],
        specifications: {
            processor: 'Apple M3',
            memory: '8GB',
            storage: '512GB SSD',
            display: '14.2" Liquid Retina XDR',
            batteryLife: '18 hours'
        },
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-03-15')
    },
    {
        id: '987fcdeb-51a2-4567-8901-234567890abc',
        shopId: 'bc8db569-a773-439c-b0db-5baa02d5d374',
        name: 'Gaming Mechanical Keyboard',
        description: 'RGB backlit mechanical keyboard with tactile switches perfect for gaming and typing',
        price: 3400000,
        stock: 35,
        category: 'Electronics',
        subcategory: 'Keyboards',
        brand: 'Corsair',
        image: 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=500',
        status: 'active',
        rating: 4.5,
        reviewCount: 1234,
        tags: ['mechanical', 'rgb', 'gaming', 'tactile'],
        specifications: {
            switches: 'Cherry MX Blue',
            backlighting: 'RGB',
            connectivity: 'USB-A',
            keyLayout: 'Full Size'
        },
        createdAt: new Date('2024-02-10'),
        updatedAt: new Date('2024-02-10')
    },
    {
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        shopId: 'c1956c8d-be5f-4ae3-b195-eb1f7b24ac16',
        name: 'Wireless Charging Pad',
        description: 'Fast wireless charging pad compatible with all Qi-enabled devices',
        price: 1000000,
        stock: 0, // Out of stock for testing
        category: 'Electronics',
        subcategory: 'Chargers',
        brand: 'Belkin',
        image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=500',
        status: 'active',
        rating: 4.3,
        reviewCount: 567,
        tags: ['wireless', 'qi-charging', 'fast-charging'],
        specifications: {
            output: '15W',
            compatibility: 'Qi-enabled devices',
            cableLength: '5ft'
        },
        createdAt: new Date('2024-02-15'),
        updatedAt: new Date('2024-03-20')
    }
];

// Get all products with enhanced filtering and pagination
app.get('/products', (req, res) => {
    const {
        category,
        subcategory,
        brand,
        status,
        minPrice,
        maxPrice,
        inStock,
        search,
        sortBy,
        sortOrder,
        page = '1',
        limit = '10'
    } = req.query;

    let filteredProducts = [...products];

    // Apply filters
    if (category) {
        filteredProducts = filteredProducts.filter(p =>
            p.category.toLowerCase() === (category as string).toLowerCase()
        );
    }

    if (subcategory) {
        filteredProducts = filteredProducts.filter(p =>
            p.subcategory?.toLowerCase() === (subcategory as string).toLowerCase()
        );
    }

    if (brand) {
        filteredProducts = filteredProducts.filter(p =>
            p.brand?.toLowerCase() === (brand as string).toLowerCase()
        );
    }

    if (status) {
        filteredProducts = filteredProducts.filter(p => p.status === status);
    }

    if (minPrice) {
        filteredProducts = filteredProducts.filter(p => p.price >= parseFloat(minPrice as string));
    }

    if (maxPrice) {
        filteredProducts = filteredProducts.filter(p => p.price <= parseFloat(maxPrice as string));
    }

    if (inStock === 'true') {
        filteredProducts = filteredProducts.filter(p => p.stock > 0);
    }

    if (search) {
        const searchTerm = (search as string).toLowerCase();
        filteredProducts = filteredProducts.filter(p =>
            p.name.toLowerCase().includes(searchTerm) ||
            p.description.toLowerCase().includes(searchTerm) ||
            p.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
        );
    }

    // Apply sorting
    if (sortBy) {
        const order = sortOrder === 'desc' ? -1 : 1;
        filteredProducts.sort((a, b) => {
            let aVal: any, bVal: any;

            switch (sortBy) {
                case 'price':
                    aVal = a.price;
                    bVal = b.price;
                    break;
                case 'name':
                    aVal = a.name.toLowerCase();
                    bVal = b.name.toLowerCase();
                    break;
                case 'rating':
                    aVal = a.rating || 0;
                    bVal = b.rating || 0;
                    break;
                case 'stock':
                    aVal = a.stock;
                    bVal = b.stock;
                    break;
                case 'createdAt':
                    aVal = a.createdAt;
                    bVal = b.createdAt;
                    break;
                default:
                    aVal = a.createdAt;
                    bVal = b.createdAt;
            }

            if (aVal < bVal) return -1 * order;
            if (aVal > bVal) return 1 * order;
            return 0;
        });
    }

    // Apply pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;

    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
    const totalProducts = filteredProducts.length;
    const totalPages = Math.ceil(totalProducts / limitNum);

    res.json({
        success: true,
        data: paginatedProducts,
        pagination: {
            currentPage: pageNum,
            totalPages,
            totalProducts,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1
        }
    });
});

// Get product by ID
app.get('/products/:id', (req, res) => {
    const { id } = req.params;
    const product = products.find(p => p.id === id);

    if (!product) {
        return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ success: true, data: product });
});

// Get product categories
app.get('/categories', (req, res) => {
    const categories = [...new Set(products.map(p => p.category))];
    const subcategories = [...new Set(products.map(p => p.subcategory).filter(Boolean))];
    const brands = [...new Set(products.map(p => p.brand).filter(Boolean))];

    res.json({
        success: true,
        data: {
            categories,
            subcategories,
            brands
        }
    });
});

// Validate products (used by purchase service) - Enhanced
app.post('/products/validate', (req, res) => {
    const { productIds } = req.body; 0

    if (!Array.isArray(productIds)) {
        return res.status(400).json({ error: 'productIds must be an array' });
    }

    const validationResults = productIds.map(id => {
        const product = products.find(p => p.id === id);
        if (!product) {
            return {
                id,
                valid: false,
                error: 'Product not found'
            };
        }

        return {
            id: product.id,
            shopId: product.shopId,
            name: product.name,
            price: product.price,
            stock: product.stock,
            image: product.image,
            available: product.status === 'active' && product.stock > 0,
            valid: true
        };
    });

    const invalidProducts = validationResults.filter(result => !result.valid);

    if (invalidProducts.length > 0) {
        return res.status(400).json({
            error: 'Some products are invalid',
            invalidProducts,
            validProducts: validationResults.filter(result => result.valid)
        });
    }

    res.json(validationResults.map(result => ({
        id: result.id,
        shopId: result.shopId,
        name: result.name,
        price: result.price,
        stock: result.stock,
        image: result.image,
        available: result.available
    })));
});

// Update product stock (simulate stock reduction after purchase)
app.patch('/products/:id/stock', (req, res) => {
    const { id } = req.params;
    const { quantity, operation = 'decrease' } = req.body;

    const product = products.find(p => p.id === id);
    if (!product) {
        return res.status(404).json({ error: 'Product not found' });
    }

    if (typeof quantity !== 'number' || quantity < 0) {
        return res.status(400).json({ error: 'Invalid quantity' });
    }

    if (operation === 'decrease') {
        if (product.stock < quantity) {
            return res.status(400).json({
                error: 'Insufficient stock',
                available: product.stock,
                requested: quantity
            });
        }
        product.stock -= quantity;
    } else if (operation === 'increase') {
        product.stock += quantity;
    } else {
        return res.status(400).json({ error: 'Invalid operation. Use "increase" or "decrease"' });
    }

    product.updatedAt = new Date();

    res.json({
        success: true,
        data: product,
        message: `Stock ${operation}d by ${quantity}. New stock: ${product.stock}`
    });
});

// Bulk update stock
app.patch('/products/stock/bulk', (req, res) => {
    const { updates } = req.body;

    if (!Array.isArray(updates)) {
        return res.status(400).json({ error: 'updates must be an array' });
    }

    const results = [];
    const errors = [];

    for (const update of updates) {
        const { productId, quantity, operation = 'decrease' } = update;
        const product = products.find(p => p.id === productId);

        if (!product) {
            errors.push({ productId, error: 'Product not found' });
            continue;
        }

        if (operation === 'decrease') {
            if (product.stock < quantity) {
                errors.push({
                    productId,
                    error: 'Insufficient stock',
                    available: product.stock,
                    requested: quantity
                });
                continue;
            }
            product.stock -= quantity;
        } else if (operation === 'increase') {
            product.stock += quantity;
        }

        product.updatedAt = new Date();
        results.push({
            productId,
            newStock: product.stock,
            operation,
            quantity
        });
    }

    res.json({
        success: errors.length === 0,
        data: results,
        errors: errors.length > 0 ? errors : undefined
    });
});

// Create product (enhanced)
app.post('/products', (req, res) => {
    const {
        name,
        description,
        price,
        stock,
        category,
        subcategory,
        brand,
        image,
        images,
        tags,
        specifications
    } = req.body;

    if (!name || !price || stock === undefined || !category) {
        return res.status(400).json({
            error: 'Missing required fields: name, price, stock, category'
        });
    }

    const newProduct: Product = {
        id: `${uuidv4()}`,
        shopId: `${uuidv4()}`,
        name,
        description: description || '',
        price: parseFloat(price),
        stock: parseInt(stock),
        category,
        subcategory,
        brand,
        image,
        images: images || [],
        status: 'active',
        tags: tags || [],
        specifications: specifications || {},
        createdAt: new Date(),
        updatedAt: new Date()
    };

    products.push(newProduct);
    res.status(201).json({ success: true, data: newProduct });
});

// Update product
app.put('/products/:id', (req, res) => {
    const { id } = req.params;
    const productIndex = products.findIndex(p => p.id === id);

    if (productIndex === -1) {
        return res.status(404).json({ error: 'Product not found' });
    }

    const updatedProduct = {
        ...products[productIndex],
        ...req.body,
        id, // Ensure ID doesn't change
        updatedAt: new Date()
    };

    products[productIndex] = updatedProduct;
    res.json({ success: true, data: updatedProduct });
});

// Delete product
app.delete('/products/:id', (req, res) => {
    const { id } = req.params;
    const productIndex = products.findIndex(p => p.id === id);

    if (productIndex === -1) {
        return res.status(404).json({ error: 'Product not found' });
    }

    const deletedProduct = products.splice(productIndex, 1)[0];
    res.json({ success: true, data: deletedProduct });
});

// Search products
app.get('/search', (req, res) => {
    const { q, category, minPrice, maxPrice, limit = '20' } = req.query;

    if (!q) {
        return res.status(400).json({ error: 'Search query is required' });
    }

    const searchTerm = (q as string).toLowerCase();
    let results = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.brand?.toLowerCase().includes(searchTerm) ||
        product.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
    );

    // Apply additional filters
    if (category) {
        results = results.filter(p => p.category.toLowerCase() === (category as string).toLowerCase());
    }

    if (minPrice) {
        results = results.filter(p => p.price >= parseFloat(minPrice as string));
    }

    if (maxPrice) {
        results = results.filter(p => p.price <= parseFloat(maxPrice as string));
    }

    // Limit results
    const limitNum = parseInt(limit as string);
    results = results.slice(0, limitNum);

    res.json({
        success: true,
        data: results,
        query: q,
        totalResults: results.length
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'Product Service',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        port: PORT,
        totalProducts: products.length,
        activeProducts: products.filter(p => p.status === 'active').length
    });
});

// Get service stats
app.get('/stats', (req, res) => {
    const stats = {
        totalProducts: products.length,
        activeProducts: products.filter(p => p.status === 'active').length,
        inactiveProducts: products.filter(p => p.status === 'inactive').length,
        outOfStockProducts: products.filter(p => p.stock === 0).length,
        categories: [...new Set(products.map(p => p.category))].length,
        brands: [...new Set(products.map(p => p.brand).filter(Boolean))].length,
        averagePrice: products.reduce((sum, p) => sum + p.price, 0) / products.length,
        totalStock: products.reduce((sum, p) => sum + p.stock, 0)
    };

    res.json({ success: true, data: stats });
});

app.listen(PORT, () => {
    console.log(`📦 Enhanced Product Service running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`📈 Service stats: http://localhost:${PORT}/stats`);
    console.log(`🔍 Search endpoint: http://localhost:${PORT}/search`);
});