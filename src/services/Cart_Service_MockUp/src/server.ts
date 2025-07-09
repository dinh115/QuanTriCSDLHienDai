import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import Joi from 'joi';
import { v4 as uuidv4 } from 'uuid';

// Types
interface CartItem {
    id: string;
    productId: string;
    shopId: string;
    quantity: number;
    addedAt: Date;
}

interface CartData {
    id: string;
    userId: string;
    items: CartItem[];
    createdAt: Date;
    updatedAt: Date;
}

interface ProductInfo {
    id: string;
    shopId: string;
    name: string;
    price: number;
    image?: string;
    stock: number;
    available: boolean;
}

interface CartItemWithProduct extends CartItem {
    product?: ProductInfo;
    totalPrice?: number;
}

interface CartWithProducts extends Omit<CartData, 'items'> {
    items: CartItemWithProduct[];
    subtotal: number;
    totalItems: number;
}

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Mock database - Updated to match product service data
const carts: CartData[] = [
    {
        id: '79524227-ce77-4157-85e7-91ddb029b8f4',
        userId: '391841e9-e11f-4bd7-8234-4aa5d540a83d',
        items: [
            {
                id: '897080b1-adb2-486e-8068-2bcfdd88bc58',
                shopId: '22812e8f-2523-4f00-a134-0223a71cd07d',
                productId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', // Sony WH-1000XM5 Headphones
                quantity: 1,
                addedAt: new Date('2024-01-15T10:00:00Z')
            },
            {
                id: '56eafe08-3601-4dec-9b25-71b01603777a',
                shopId: '26515359-2f3e-4bca-ba09-b1abcaea1911',
                productId: '550e8400-e29b-41d4-a716-446655440000', // Anker PowerLine III USB-C Cable
                quantity: 2,
                addedAt: new Date('2024-01-15T11:30:00Z')
            }
        ],
        createdAt: new Date('2024-01-15T09:00:00Z'),
        updatedAt: new Date('2024-01-15T11:30:00Z')
    },
    {
        id: '7a651961-079b-43b8-b2eb-471ab82ddbd5',
        userId: '9a60903b-07ab-4786-bd27-1348d4046cf8',
        items: [
            {
                id: 'c274fa94-2e11-455b-833a-8d93dbe2040e',
                shopId: 'd7119d2c-3488-444c-bc08-07dc24513c4b',
                productId: '6ba7b811-9dad-11d1-80b4-00c04fd430c8', // UPLIFT V2 Standing Desk
                quantity: 1,
                addedAt: new Date('2024-01-16T14:00:00Z')
            },
            {
                id: '86f66225-948a-4b85-8404-ca0cbd61882e',
                shopId: 'bc8db569-a773-439c-b0db-5baa02d5d374',
                productId: '987fcdeb-51a2-4567-8901-234567890abc', // Gaming Mechanical Keyboard
                quantity: 1,
                addedAt: new Date('2024-01-16T15:00:00Z')
            }
        ],
        createdAt: new Date('2024-01-16T14:00:00Z'),
        updatedAt: new Date('2024-01-16T15:00:00Z')
    }
];


// Mock product data - Updated to match product service exactly
const mockProducts: ProductInfo[] = [
    {
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        shopId: '22812e8f-2523-4f00-a134-0223a71cd07d',
        name: 'Sony WH-1000XM5 Wireless Headphones',
        price: 7490000,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
        stock: 45,
        available: true
    },
    {
        id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        shopId: '12190a5b-3d4e-4fa8-8c5a-3b0526a5a85d',
        name: 'iPhone 15 Pro Max Case',
        price: 1090000,
        image: 'https://images.unsplash.com/photo-1601593346740-925612772716?w=500',
        stock: 150,
        available: true
    },
    {
        id: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
        shopId: 'd7119d2c-3488-444c-bc08-07dc24513c4b',
        name: 'UPLIFT V2 Standing Desk',
        price: 2080000,
        image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500',
        stock: 12,
        available: true
    },
    {
        id: '550e8400-e29b-41d4-a716-446655440000',
        shopId: '26515359-2f3e-4bca-ba09-b1abcaea1911',
        name: 'Anker PowerLine III USB-C Cable',
        price: 50000,
        image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=500',
        stock: 300,
        available: true
    },
    {
        id: '123e4567-e89b-12d3-a456-426614174000',
        shopId: '5e8eb443-645b-45f6-aab6-227a6e630597',
        name: 'MacBook Pro M3 14"',
        price: 52000000,
        image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500',
        stock: 8,
        available: true
    },
    {
        id: '987fcdeb-51a2-4567-8901-234567890abc',
        shopId: 'bc8db569-a773-439c-b0db-5baa02d5d374',
        name: 'Gaming Mechanical Keyboard',
        price: 3400000,
        image: 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=500',
        stock: 35,
        available: true
    },
    {
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        shopId: 'c1956c8d-be5f-4ae3-b195-eb1f7b24ac16',
        name: 'Wireless Charging Pad',
        price: 1000000,
        image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=500',
        stock: 0, // Out of stock
        available: false
    }
];

// Validation schemas
const addItemSchema = Joi.object({
    productId: Joi.string().required(),
    shopId: Joi.string().required(),
    quantity: Joi.number().integer().min(1).max(99).required()
});

const updateItemSchema = Joi.object({
    quantity: Joi.number().integer().min(1).max(99).required()
});

const bulkUpdateSchema = Joi.object({
    items: Joi.array().items(
        Joi.object({
            productId: Joi.string().required(),
            quantity: Joi.number().integer().min(1).max(99).required()
        })
    ).required()
});

// Utility functions
const getProductInfo = (productId: string): ProductInfo | undefined => {
    return mockProducts.find(p => p.id === productId);
};

const enrichCartWithProducts = (cart: CartData): CartWithProducts => {
    const enrichedItems: CartItemWithProduct[] = cart.items.map(item => {
        const product = getProductInfo(item.productId);
        return {
            ...item,
            product,
            totalPrice: product ? product.price * item.quantity : 0
        };
    });

    const subtotal = enrichedItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    const totalItems = enrichedItems.reduce((sum, item) => sum + item.quantity, 0);

    return {
        ...cart,
        items: enrichedItems,
        subtotal,
        totalItems
    };
};

const findOrCreateCart = (userId: string): CartData => {
    let cart = carts.find(c => c.userId === userId);

    if (!cart) {
        cart = {
            id: uuidv4(),
            userId,
            items: [],
            createdAt: new Date(),
            updatedAt: new Date()
        };
        carts.push(cart);
    }

    return cart;
};

// Routes

// Get cart by user ID
app.get('/carts/user/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const cart = findOrCreateCart(userId);
        const enrichedCart = enrichCartWithProducts(cart);

        res.json({
            success: true,
            data: enrichedCart
        });
    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch cart'
        });
    }
});

// Get cart by cart ID
app.get('/carts/:cartId', (req, res) => {
    try {
        const { cartId } = req.params;
        const cart = carts.find(c => c.id === cartId);

        if (!cart) {
            return res.status(404).json({
                success: false,
                error: 'Cart not found'
            });
        }

        const enrichedCart = enrichCartWithProducts(cart);

        res.json({
            success: true,
            data: enrichedCart
        });
    } catch (error) {
        console.error('Get cart by ID error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch cart'
        });
    }
});

// Add item to cart
app.post('/carts/:userId/items', (req, res) => {
    try {
        const { userId } = req.params;
        const { error, value } = addItemSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                error: error.details[0].message
            });
        }

        const { productId, quantity } = value;

        // Check if product exists
        const product = getProductInfo(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        if (!product.available) {
            return res.status(400).json({
                success: false,
                error: 'Product is not available'
            });
        }

        const cart = findOrCreateCart(userId);

        // Check if item already exists in cart
        const existingItemIndex = cart.items.findIndex(item => item.productId === productId);

        if (existingItemIndex !== -1) {
            // Update existing item quantity
            const newQuantity = cart.items[existingItemIndex].quantity + quantity;

            if (newQuantity > product.stock) {
                return res.status(400).json({
                    success: false,
                    error: `Insufficient stock. Available: ${product.stock}, Requested: ${newQuantity}`
                });
            }

            cart.items[existingItemIndex].quantity = newQuantity;
        } else {
            // Check stock availability
            if (quantity > product.stock) {
                return res.status(400).json({
                    success: false,
                    error: `Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`
                });
            }

            // Add new item
            const newItem: CartItem = {
                id: uuidv4(),
                shopId: uuidv4(),
                productId,
                quantity,
                addedAt: new Date()
            };
            cart.items.push(newItem);
        }

        cart.updatedAt = new Date();
        const enrichedCart = enrichCartWithProducts(cart);

        res.status(201).json({
            success: true,
            data: enrichedCart
        });
    } catch (error) {
        console.error('Add item error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add item to cart'
        });
    }
});

// Update item quantity in cart
app.put('/carts/:userId/items/:itemId', (req, res) => {
    try {
        const { userId, itemId } = req.params;
        const { error, value } = updateItemSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                error: error.details[0].message
            });
        }

        const { quantity } = value;
        const cart = carts.find(c => c.userId === userId);

        if (!cart) {
            return res.status(404).json({
                success: false,
                error: 'Cart not found'
            });
        }

        const itemIndex = cart.items.findIndex(item => item.id === itemId);

        if (itemIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Item not found in cart'
            });
        }

        const item = cart.items[itemIndex];
        const product = getProductInfo(item.productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        if (quantity > product.stock) {
            return res.status(400).json({
                success: false,
                error: `Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`
            });
        }

        cart.items[itemIndex].quantity = quantity;
        cart.updatedAt = new Date();

        const enrichedCart = enrichCartWithProducts(cart);

        res.json({
            success: true,
            data: enrichedCart
        });
    } catch (error) {
        console.error('Update item error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update item'
        });
    }
});

// Remove item from cart
app.delete('/carts/:userId/items/:itemId', (req, res) => {
    try {
        const { userId, itemId } = req.params;
        const cart = carts.find(c => c.userId === userId);

        if (!cart) {
            return res.status(404).json({
                success: false,
                error: 'Cart not found'
            });
        }

        const itemIndex = cart.items.findIndex(item => item.id === itemId);

        if (itemIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Item not found in cart'
            });
        }

        cart.items.splice(itemIndex, 1);
        cart.updatedAt = new Date();

        const enrichedCart = enrichCartWithProducts(cart);

        res.json({
            success: true,
            data: enrichedCart
        });
    } catch (error) {
        console.error('Remove item error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to remove item'
        });
    }
});

// Clear all items from cart
app.delete('/carts/:cartId/items', (req, res) => {
    try {
        const { cartId } = req.params;
        const cart = carts.find(c => c.id === cartId);

        if (!cart) {
            return res.status(404).json({
                success: false,
                error: 'Cart not found'
            });
        }

        cart.items = [];
        cart.updatedAt = new Date();

        const enrichedCart = enrichCartWithProducts(cart);

        res.json({
            success: true,
            data: enrichedCart,
            message: 'Cart cleared successfully'
        });
    } catch (error) {
        console.error('Clear cart error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to clear cart'
        });
    }
});

// Bulk update cart items
app.put('/carts/:userId/items', (req, res) => {
    try {
        const { userId } = req.params;
        const { error, value } = bulkUpdateSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                error: error.details[0].message
            });
        }

        const { items } = value;
        const cart = findOrCreateCart(userId);

        // Validate all products first
        for (const item of items) {
            const product = getProductInfo(item.productId);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    error: `Product ${item.productId} not found`
                });
            }
            if (!product.available) {
                return res.status(400).json({
                    success: false,
                    error: `Product ${item.productId} is not available`
                });
            }
            if (item.quantity > product.stock) {
                return res.status(400).json({
                    success: false,
                    error: `Insufficient stock for product ${item.productId}. Available: ${product.stock}, Requested: ${item.quantity}`
                });
            }
        }

        // Clear existing items and add new ones
        cart.items = items.map((item: { productId: string; quantity: number }) => ({
            id: uuidv4(),
            productId: item.productId,
            quantity: item.quantity,
            addedAt: new Date()
        }));

        cart.updatedAt = new Date();
        const enrichedCart = enrichCartWithProducts(cart);

        res.json({
            success: true,
            data: enrichedCart
        });
    } catch (error) {
        console.error('Bulk update error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update cart'
        });
    }
});

// Get cart summary (lightweight version)
app.get('/carts/:userId/summary', (req, res) => {
    try {
        const { userId } = req.params;
        const cart = findOrCreateCart(userId);
        const enrichedCart = enrichCartWithProducts(cart);

        res.json({
            success: true,
            data: {
                cartId: cart.id,
                userId: cart.userId,
                totalItems: enrichedCart.totalItems,
                subtotal: enrichedCart.subtotal,
                itemCount: cart.items.length,
                updatedAt: cart.updatedAt
            }
        });
    } catch (error) {
        console.error('Get cart summary error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch cart summary'
        });
    }
});

// Check item availability in cart
app.post('/carts/validate', (req, res) => {
    try {
        const { cartId } = req.body;

        if (!cartId) {
            return res.status(400).json({
                success: false,
                error: 'Cart ID is required'
            });
        }

        const cart = carts.find(c => c.id === cartId);

        if (!cart) {
            return res.status(404).json({
                success: false,
                error: 'Cart not found'
            });
        }

        const validationResults = cart.items.map(item => {
            const product = getProductInfo(item.productId);

            if (!product) {
                return {
                    itemId: item.id,
                    productId: item.productId,
                    valid: false,
                    error: 'Product not found'
                };
            }

            if (!product.available) {
                return {
                    itemId: item.id,
                    productId: item.productId,
                    valid: false,
                    error: 'Product not available'
                };
            }

            if (item.quantity > product.stock) {
                return {
                    itemId: item.id,
                    productId: item.productId,
                    valid: false,
                    error: `Insufficient stock. Available: ${product.stock}, Requested: ${item.quantity}`
                };
            }

            return {
                itemId: item.id,
                productId: item.productId,
                valid: true
            };
        });

        const allValid = validationResults.every(result => result.valid);

        res.json({
            success: true,
            data: {
                valid: allValid,
                items: validationResults
            }
        });
    } catch (error) {
        console.error('Cart validation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to validate cart'
        });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Cart Service',
        timestamp: new Date().toISOString(),
        port: PORT,
        environment: process.env.NODE_ENV || 'development'
    });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});

app.listen(PORT, () => {
    console.log(`🛒 Cart Service running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🧪 Test data available:`);
    console.log(`   Cart ID: cart-123 (User: user-123)`);
    console.log(`     - Sony WH-1000XM5 Headphones (1x) - ₫7,490,000`);
    console.log(`     - Anker PowerLine III USB-C Cable (2x) - ₫100,000`);
    console.log(`   Cart ID: cart-456 (User: user-456)`);
    console.log(`     - UPLIFT V2 Standing Desk (1x) - ₫2,080,000`);
    console.log(`     - Gaming Mechanical Keyboard (1x) - ₫3,400,000`);
    console.log(`🛍️  Available endpoints:`);
    console.log(`   GET    /carts/user/:userId - Get cart by user`);
    console.log(`   GET    /carts/:cartId - Get cart by ID`);
    console.log(`   POST   /carts/:userId/items - Add item to cart`);
    console.log(`   PUT    /carts/:userId/items/:itemId - Update item quantity`);
    console.log(`   DELETE /carts/:userId/items/:itemId - Remove item from cart`);
    console.log(`   DELETE /carts/:cartId/items - Clear all items from cart`);
    console.log(`   PUT    /carts/:userId/items - Bulk update cart items`);
    console.log(`   GET    /carts/:userId/summary - Get cart summary`);
    console.log(`   POST   /carts/validate - Validate cart items`);
    console.log(`🚀 Server ready for requests!`);
});