// server.js (MERGED)
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from 'redis';
import cookieParser from 'cookie-parser';
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = 5000;

// --- Multer Configuration for File Uploads ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'public', 'images'));
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage: storage });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware gán cartId nếu chưa có
app.use((req, res, next) => {
  if (!req.cookies.cartId) {
    res.cookie('cartId', uuidv4());
  }
  next();
});

// Middleware xác thực JWT
const SECRET_KEY = 'your-super-secret-jwt-key-change-in-production';
function authenticateToken(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    req.user = null;
    return next();
  }
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
  } catch (err) {
    console.error('JWT Verify Error:', err.name, err.message);
    req.user = null;
  }
  next();
}
app.use(authenticateToken);

// Redis client
const redisClient = createClient({
  socket: {
    host: 'redis',
    port: 6379
  }
});
redisClient.on('error', (err) => console.error('❌ Redis Client Error:', err));
await redisClient.connect();

// Views config
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Home page
app.get('/', (req, res) => {
  const username = req.user?.username || ("User #" + Math.floor(Math.random() * 100 + 1));
  const exampleProductId = "22417326-f9fd-4954-9ead-3ceafd52f3d6";
  res.render('home.ejs', { username, user: req.user, exampleProductId });
});

// --- CART ROUTES ---
app.get('/cart', async (req, res) => {
  const cartId = req.cookies.cartId;
  try {
    const response = await fetch(`http://cart-service:3004/carts/${cartId}`);
    //console.log(response);
    const cart = await response.json();
    const cartItems = cart.items || [];
    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity || 0), 0);
    res.render('boilerplates/cart.ejs', {
      cart,
      cartItems,
      total,
      lastAddedId: req.query.highlight,
      cartId
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

app.post('/cart/add', async (req, res) => {
  const cartId = req.cookies.cartId;
  const { productId, quantity, shopId, name, price } = req.body;
  const response = await fetch(`http://cart-service:3004/carts/${cartId}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, quantity, shopId, name, price })
  });
  const result = await response.json();
  if (!result || !result.cart || !Array.isArray(result.cart.items)) return;
  const newItemId = result.cart.items.at(-1)?.id;
  res.redirect(`/cart?highlight=${newItemId}`);
});

app.post('/cart/update', async (req, res) => {
  const cartId = req.cookies.cartId;
  const { itemId, quantity } = req.body;
  try {
    const response = await fetch(`http://cart-service:3004/carts/${cartId}`);
    const cart = await response.json();
    const item = cart.items.find(i => i.id === itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    item.quantity = parseInt(quantity);
    item.updatedAt = new Date().toISOString();
    const updateRes = await fetch(`http://cart-service:3004/carts/${cartId}`, {
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

app.post('/cart/remove', async (req, res) => {
  const cartId = req.cookies.cartId;
  const { itemId } = req.body;
  try {
    const deleteRes = await fetch(`http://cart-service:3004/carts/${cartId}/items/${itemId}`, { method: 'DELETE' });
    if (!deleteRes.ok) throw new Error('Xoá không thành công');
    res.json({ success: true });
  } catch (err) {
    console.error('Lỗi khi xoá sản phẩm:', err);
    res.status(500).json({ success: false });
  }
});

// --- AUTH ROUTES ---
app.get('/login', (req, res) => {
  if (req.user) return res.redirect('/');
  res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const response = await fetch('http://user-service:3002/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!response.ok) return res.render('login', { error: 'Tên đăng nhập hoặc mật khẩu không đúng!' });
    const data = await response.json();
    const token = data.data?.token;
    if (!token) return res.render('login', { error: 'Không tìm thấy token từ server!' });
    res.cookie('token', token, { httpOnly: true });
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.render('login', { error: 'Có lỗi xảy ra khi đăng nhập!' });
  }
});

app.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});

// --- CHECKOUT ROUTES ---------------

app.post('/checkout', (req, res) => {
  const { cartId, selectedItems } = req.body;

  // Parse selectedItems (it comes as JSON string)
  const items = JSON.parse(selectedItems);

  // - cartId: string
  // - items: Array of {cartItemId, productId, shopId, quantity}

  console.info(req.user);
  console.info(items);

  res.render('checkout', {
    cartId,
    selectedItems: items,
    user: req.user,
    token: req.cookies.token
  });
});

// --- REVIEW ROUTES (like before) ---
// (Tạm lược bớt ở đây vì phần còn lại giống, bạn có thể nối tiếp phần reviews nếu cần)

app.listen(PORT, () => {
  console.log(`✅ Frontend running at http://localhost:${PORT}`);
});