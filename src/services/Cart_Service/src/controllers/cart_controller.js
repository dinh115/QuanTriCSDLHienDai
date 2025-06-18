import CartModel from '../models/cart_model.js';
import redisClient from '../configs/redis.js'; // Đảm bảo import redisClient

const cartModel = new CartModel(redisClient);

export default {
  addToCart: async (req, res) => {
    try {
      const { userId, productId, quantity } = req.body;
      const cart = await cartModel.addToCart(userId, productId, quantity);
      res.status(200).json(cart);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getCart: async (req, res) => {
    try {
      const { userId } = req.params;
      const cart = await cartModel.getCart(userId);
      res.status(200).json(cart);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  removeFromCart: async (req, res) => {
    try {
      const { userId, productId } = req.body;
      const cart = await cartModel.removeFromCart(userId, productId);
      res.status(200).json(cart);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};