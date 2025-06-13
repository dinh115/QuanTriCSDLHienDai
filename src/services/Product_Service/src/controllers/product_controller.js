import * as ProductModel from '../models/product_model.js';

export async function getProducts(req, res) {
    const products = await ProductModel.getAllProducts();
    res.json(products);
}

export async function create(req, res) {
    const product = req.body;
    const id = await ProductModel.createProduct(product);
    res.json({ message: 'Created', id });
}
