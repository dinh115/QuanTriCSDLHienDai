import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 3002;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Mock product data
const products = [
    {
        id: 'product-1',
        name: 'Wireless Headphones',
        description: 'High-quality wireless headphones with noise cancellation',
        price: 99.99,
        stock: 50,
        category: 'Electronics',
        status: 'active',
        createdAt: new Date('2024-01-01')
    },
    {
        id: 'product-2',
        name: 'Smartphone Case',
        description: 'Protective case for smartphones',
        price: 19.99,
        stock: 100,
        category: 'Accessories',
        status: 'active',
        createdAt: new Date('2024-01-05')
    },
    {
        id: 'product-3',
        name: 'Laptop Stand',
        description: 'Adjustable laptop stand for ergonomic working',
        price: 45.50,
        stock: 25,
        category: 'Office',
        status: 'active',
        createdAt: new Date('2024-01-10')
    },
    {
        id: 'product-4',
        name: 'USB Cable',
        description: 'High-speed USB-C cable',
        price: 12.99,
        stock: 200,
        category: 'Electronics',
        status: 'active',
        createdAt: new Date('2024-01-15')
    },
    {
        id: 'product-5',
        name: 'Out of Stock Item',
        description: 'This item is currently out of stock',
        price: 29.99,
        stock: 0,
        category: 'Test',
        status: 'active',
        createdAt: new Date('2024-02-01')
    }
];

// Get all products
app.get('/products', (req, res) => {
    const { category, status } = req.query;
    let filteredProducts = products;

    if (category) {
        filteredProducts = filteredProducts.filter(p => p.category.toLowerCase() === (category as string).toLowerCase());
    }

    if (status) {
        filteredProducts = filteredProducts.filter(p => p.status === status);
    }

    res.json({ success: true, data: filteredProducts });
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

// Validate products (used by purchase service)
app.post('/products/validate', (req, res) => {
    const { productIds } = req.body;

    if (!Array.isArray(productIds)) {
        return res.status(400).json({ error: 'productIds must be an array' });
    }

    const validProducts = productIds.map(id => {
        const product = products.find(p => p.id === id);
        if (!product) {
            return null;
        }
        return product;
    }).filter(Boolean);

    if (validProducts.length !== productIds.length) {
        const foundIds = validProducts.map(p => p!.id);
        const notFoundIds = productIds.filter(id => !foundIds.includes(id));
        return res.status(404).json({
            error: 'Some products not found',
            notFound: notFoundIds
        });
    }

    res.json(validProducts);
});

// Update product stock (simulate stock reduction after purchase)
app.patch('/products/:id/stock', (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body;

    const product = products.find(p => p.id === id);
    if (!product) {
        return res.status(404).json({ error: 'Product not found' });
    }

    if (typeof quantity !== 'number' || quantity < 0) {
        return res.status(400).json({ error: 'Invalid quantity' });
    }

    if (product.stock < quantity) {
        return res.status(400).json({ error: 'Insufficient stock' });
    }

    product.stock -= quantity;
    res.json({ success: true, data: product });
});

// Create product (for testing)
app.post('/products', (req, res) => {
    const { name, description, price, stock, category } = req.body;

    if (!name || !price || stock === undefined) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const newProduct = {
        id: uuidv4(),
        name,
        description: description || '',
        price: parseFloat(price),
        stock: parseInt(stock),
        category: category || 'General',
        status: 'active',
        createdAt: new Date()
    };

    products.push(newProduct);
    res.status(201).json({ success: true, data: newProduct });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'Product Service',
        timestamp: new Date().toISOString(),
        port: PORT
    });
});

app.listen(PORT, () => {
    console.log(`📦 Product Service running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
});