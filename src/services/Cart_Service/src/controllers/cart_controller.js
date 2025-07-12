import redisClient from '../configs/redis.js';
import { v4 as uuidv4 } from 'uuid';

// Lấy giỏ hàng theo cartId
export async function getCart(req, res) {
  const { cartId } = req.params;
  const cartKey = `cart:${cartId}`;
  try {
    const cartData = await redisClient.get(cartKey);
    if (!cartData) return res.status(404).json({ error: 'Không tìm thấy giỏ hàng' });

    const cart = JSON.parse(cartData);
    res.json(cart);
  } catch (err) {
    console.error('Lỗi khi lấy giỏ hàng:', err);
    res.status(500).json({ error: 'Lỗi server' });
  }
}

// Thêm item vào giỏ hàng
export async function addItemToCart(req, res) {
  const { cartId } = req.params;
  const { shopId, productId, quantity, name, price, userId } = req.body;
  const cartKey = `cart:${cartId}`;

  if (!userId || !productId || !quantity || !name || !price || !shopId) {
    return res.status(400).json({ error: 'Thiếu thông tin bắt buộc trong body' });
  }

  try {
    let cart;
    const existingCart = await redisClient.get(cartKey);

    if (existingCart) {
      cart = JSON.parse(existingCart);
    } else {
      // Tạo giỏ hàng mới nếu chưa có
      cart = {
        id: cartId,
        userId,
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    // 🔍 Kiểm tra xem sản phẩm đã có trong giỏ chưa
    const existingItem = cart.items.find(item => item.productId === productId);

    if (existingItem) {
      existingItem.quantity += parseInt(quantity);
      existingItem.updatedAt = new Date().toISOString();
    } else {
      const newItem = {
        productId: productId,
        shopId,
        quantity: parseInt(quantity),
        name,
        price: parseInt(price),
        addedAt: new Date().toISOString()
      };
      cart.items.push(newItem);
    }

    cart.updatedAt = new Date().toISOString();
    await redisClient.set(cartKey, JSON.stringify(cart));

    res.status(201).json({ message: 'Đã thêm sản phẩm vào giỏ', cart });
  } catch (err) {
    console.error('Lỗi khi thêm vào giỏ:', err);
    res.status(500).json({ error: 'Lỗi server' });
  }
}

// Cập nhật toàn bộ giỏ hàng (toàn bộ object)
export async function updateCart(req, res) {
  const { cartId } = req.params;
  const cartKey = `cart:${cartId}`;
  const updatedCart = req.body;

  try {
    await redisClient.set(cartKey, JSON.stringify(updatedCart));
    res.json(updatedCart);
  } catch (err) {
    console.error('Lỗi khi cập nhật giỏ hàng:', err);
    res.status(500).json({ error: 'Lỗi server' });
  }
}

// Xoá một sản phẩm trong giỏ hàng
export async function deleteCartItem(req, res) {
  const { cartId, itemId } = req.params;
  const cartKey = `cart:${cartId}`;

  try {
    const cartData = await redisClient.get(cartKey);
    if (!cartData) return res.status(404).json({ error: 'Không tìm thấy giỏ' });

    const cart = JSON.parse(cartData);
    cart.items = cart.items.filter(item => item.id !== itemId);
    cart.updatedAt = new Date().toISOString();

    await redisClient.set(cartKey, JSON.stringify(cart));
    res.json({ message: '🗑️ Đã xoá sản phẩm', cart });
  } catch (err) {
    console.error('❌ Lỗi khi xoá sản phẩm:', err);
    res.status(500).json({ error: 'Lỗi server' });
  }
}

// Xoá toàn bộ sản phẩm trong giỏ hàng
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
    res.json({ message: '🧹 Đã xoá toàn bộ sản phẩm', cart });
  } catch (err) {
    console.error('❌ Lỗi khi xoá toàn bộ:', err);
    res.status(500).json({ error: 'Lỗi server' });
  }
}