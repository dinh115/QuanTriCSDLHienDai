// server.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from 'redis';
import cookieParser from 'cookie-parser';
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;


// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


// Gán cart id nếu chưa có
app.use((req, res, next) => {
  if (!req.cookies.cartId) {
    res.cookie('cartId', uuidv4());
  }
  next();
});


// Thiết lập EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Tĩnh
app.use(express.static(path.join(__dirname, 'public')));


// Redis client
// Chạy Redis server trước khi chạy ứng dụng này
// docker run -d --name redis-cart -p 6379:6379 redis
const redisClient = createClient({
  socket: {
    host: '127.0.0.1',
    port: 6379
  }
});
redisClient.on('error', (err) => console.error('❌ Redis Client Error:', err));
await redisClient.connect();

// Trang chủ
app.get('/', (req, res) => {
  const username = "User #" + Math.floor(Math.random() * 100 + 1);
  res.render('home.ejs', { username });
});


// Khởi động server
app.listen(PORT, () => {
  console.log(`✅ Frontend running at http://localhost:${PORT}`);
});


// Trang giỏ hàng
app.get('/cart', async (req, res) => {
  const cartId = req.cookies.cartId;

  try {
    const response = await fetch(`http://localhost:3001/carts/${cartId}`);
    const cart = await response.json();

    const cartItems = cart.items || [];
    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity || 0), 0);

    res.render('boilerplates/cart.ejs', {
      cart,
      cartItems,
      total,
      lastAddedId: req.query.highlight
    });
  } catch (err) {
    console.error('❌ Lỗi khi lấy giỏ hàng:', err);
    res.render('boilerplates/cart.ejs', {
      cart: {},
      cartItems: [],
      total: 0,
      lastAddedId: null
    });
  }
});

// API: Thêm sản phẩm vào giỏ hàng
app.post('/cart/add', async (req, res) => {
  const cartId = req.cookies.cartId;
  const { productId, quantity, shopId, name, price } = req.body;

  const response = await fetch(`http://localhost:3001/carts/${cartId}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, quantity, shopId, name, price })
  });

  const result = await response.json();
  
  if (!result || !result.cart || !Array.isArray(result.cart.items)) {
    console.error('❌ Không nhận được cart hợp lệ từ backend:', result);

    // Đừng gọi res.status().send() và res.redirect() trong cùng 1 request
    // Chỉ gọi 1 lần duy nhất
    return; // ⛔ Ngắt ngay tại đây
  }

const newItemId = result.cart.items.at(-1)?.id;
res.redirect(`/cart?highlight=${newItemId}`);
});

// API: Cập nhật số lượng sản phẩm trong giỏ hàng
app.post('/cart/update', async (req, res) => {
  const cartId = req.cookies.cartId;
  const { itemId, quantity } = req.body;

  try {
    const response = await fetch(`http://localhost:3001/carts/${cartId}`);
    const cart = await response.json();

    const item = cart.items.find(i => i.id === itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });

    item.quantity = parseInt(quantity);
    item.updatedAt = new Date().toISOString();

    const updateRes = await fetch(`http://localhost:3001/carts/${cartId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cart)
    });

    const updatedCart = await updateRes.json();
    const total = updatedCart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    res.json({ success: true, total });
  } catch (err) {
    console.error('Lỗi khi cập nhật số lượng:', err);
    res.status(500).json({ success: false });
  }
});

// API: Xóa sản phẩm khỏi giỏ hàng
app.post('/cart/remove', async (req, res) => {
  const cartId = req.cookies.cartId;
  const { itemId } = req.body;

  try {
    const deleteRes = await fetch(`http://localhost:3001/carts/${cartId}/items/${itemId}`, {
      method: 'DELETE'
    });

    if (!deleteRes.ok) throw new Error('Xoá không thành công');

    res.json({ success: true });
  } catch (err) {
    console.error('Lỗi khi xoá sản phẩm:', err);
    res.status(500).json({ success: false });
  }
});