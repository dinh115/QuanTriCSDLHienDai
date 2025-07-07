import Product from './product_schema.js';

export async function getAllProducts(filters = {}) {
    try {
        const query = {};
        
        // Filter by shopId if provided
        if (filters.shopId) {
            query.shopId = filters.shopId;
        }
        
        // Filter by status if provided
        if (filters.status) {
            query.status = filters.status;
        }
        
        // Filter by category if provided
        if (filters.category) {
            query.category = filters.category;
        }
        
        // Text search
        if (filters.search) {
            query.$text = { $search: filters.search };
        }
        
        return await Product.find(query).sort({ createdAt: -1 });
    } catch (error) {
        throw new Error(`Error fetching products: ${error.message}`);
    }
}

export async function findProductById(id) {
    try {
        return await Product.findOne({ id });
    } catch (error) {
        throw new Error(`Error finding product: ${error.message}`);
    }
}

export async function findProductsByIds(productIds) {
    try {
        return await Product.find({ id: { $in: productIds } });
    } catch (error) {
        throw new Error(`Error finding products by IDs: ${error.message}`);
    }
}

export async function createProduct(data) {
    try {
        const product = new Product(data); // Không cần tự sinh id
        return await product.save();
    } catch (error) {
        throw new Error(`Error creating product: ${error.message}`);
    }
}

export async function updateProduct(id, data) {
    try {
        data.updatedAt = new Date();
        return await Product.findOneAndUpdate(
            { id }, 
            data, 
            { new: true, runValidators: true }
        );
    } catch (error) {
        throw new Error(`Error updating product: ${error.message}`);
    }
}

export async function deleteProduct(id) {
    try {
        return await Product.findOneAndDelete({ id });
    } catch (error) {
        throw new Error(`Error deleting product: ${error.message}`);
    }
}

export async function updateProductStock(id, newStock) {
    try {
        const product = await Product.findOneAndUpdate(
            { id },
            { 
                stock: newStock, 
                status: newStock > 0 ? 'active' : 'out_of_stock',
                updatedAt: new Date()
            },
            { new: true }
        );
        return product;
    } catch (error) {
        throw new Error(`Error updating stock: ${error.message}`);
    }
}

export async function getProductsByShop(shopId, filters = {}) {
    try {
        const query = { shopId };
        
        if (filters.status) {
            query.status = filters.status;
        }
        
        if (filters.category) {
            query.category = filters.category;
        }
        
        return await Product.find(query).sort({ createdAt: -1 });
    } catch (error) {
        throw new Error(`Error fetching shop products: ${error.message}`);
    }
}

export async function validateProducts(productIds) {
    try {
        const products = await Product.find({ 
            id: { $in: productIds },
            status: 'active',
            stock: { $gt: 0 }
        });
        
        const validIds = products.map(p => p.id);
        const invalidIds = productIds.filter(id => !validIds.includes(id));
        
        return {
            valid: products,
            invalid: invalidIds
        };
    } catch (error) {
        throw new Error(`Error validating products: ${error.message}`);
    }
}
