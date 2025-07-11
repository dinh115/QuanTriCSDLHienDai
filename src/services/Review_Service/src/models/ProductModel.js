const client = require('../config/database'); // Assuming your database client is configured here

class ProductModel {
    /**
     * Fetches productname and image for a given product ID.
     * @param {uuid} productId - The ID of the product.
     * @returns {Object|null} An object containing productname and image, or null if not found.
     */
    static async getProductNameAndImage(productId) {
        const query = 'SELECT productname, image FROM products WHERE productid = ?';
        try {
            const result = await client.execute(query, [productId], { prepare: true });
            if (result.rows.length > 0) {
                return result.rows[0];
            }
            return null;
        } catch (error) {
            console.error('Database error fetching product name and image:', error);
            throw error;
        }
    }
}

module.exports = ProductModel;