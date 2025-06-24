import redisClient from '../configs/redis.js';
import { createNewCart, createNewCartItem } from '../models/cart_model.js';

export async function addItemToCart(req, res) {
  const { cartId } = req.params;
  const { shopId, productId, quantity } = req.body;
  const cartKey = `cart:${cartId}`;

  try {
    let cart = null;
    const existingCart = await redisClient.get(cartKey);
    if (existingCart) {
      cart = JSON.parse(existingCart);
    } else {
      cart = createNewCart(cartId);  // sinh userId mới
    }

    const newItem = createNewCartItem({ shopId, productId, quantity });
    cart.items.push(newItem);
    cart.updatedAt = new Date().toISOString();

    await redisClient.set(cartKey, JSON.stringify(cart));
    res.status(201).json({ message: '✅ Đã thêm sản phẩm vào giỏ', cart });
  } catch (err) {
    console.error('❌ Lỗi khi thêm vào giỏ:', err);
    res.status(500).json({ error: 'Lỗi server' });
  }
}

export async function getCart(req, res) {
  const { cartId } = req.params;
  const cartKey = `cart:${cartId}`;
  try {
    const cartData = await redisClient.get(cartKey);
    if (!cartData) return res.status(404).json({ error: 'Không tìm thấy giỏ hàng' });

    const cart = JSON.parse(cartData);
    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
}

export async function clearCartItems(req, res) {
  const { cartId } = req.params;
  const cartKey = `cart:${cartId}`;
  try {
    const cartData = await redisClient.get(cartKey);
    if (!cartData) return res.status(404).json({ error: 'Không tìm thấy giỏ hàng' });

    const cart = JSON.parse(cartData);
    cart.items = [];
    cart.updatedAt = new Date().toISOString();

    await redisClient.set(cartKey, JSON.stringify(cart));
    res.json({ message: '🧹 Đã xóa toàn bộ sản phẩm', cart });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
}
