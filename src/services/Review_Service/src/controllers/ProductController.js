const ProductModel = require('../models/ProductModel'); // Adjust path if necessary

class ProductController {
    /**
     * POST API to fetch productname and image for a given product ID.
     * The product ID is expected in the request body.
     * @param {Object} req - The request object.
     * @param {Object} res - The response object.
     */
    static async getProductDetails(req, res) {
        try {
            const { productid } = req.body; // Expect productid in the request body

            if (!productid) {
                return res.status(400).json({ error: 'Product ID is required in the request body.' });
            }

            const product = await ProductModel.getProductNameAndImage(productid);

            if (!product) {
                return res.status(404).json({ error: 'Product not found.' });
            }

            res.json(product);
        } catch (error) {
            console.error('Error fetching product details:', error);
            res.status(500).json({ error: 'Internal server error.' });
        }
    }
}

module.exports = ProductController;