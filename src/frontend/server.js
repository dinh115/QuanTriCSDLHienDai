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
const redisClient = createClient({
  socket: {
    host: '127.0.0.1',
    port: 6379
  }
});

redisClient.on('error', (err) => console.error('❌ Redis Client Error:', err));

await redisClient.connect(); // 👈 vì đang ở ES module, có thể dùng await trực tiếp (Node 14+)

// Trang chủ
app.get('/', (req, res) => {
  const username = "User #" + Math.floor(Math.random() * 100 + 1);
  res.render('home.ejs', { username });
});

// Khởi động server
app.listen(PORT, () => {
  console.log(`✅ Frontend running at http://localhost:${PORT}`);
});

// API: thêm vào giỏ hàng
// Chạy Redis server trước khi chạy ứng dụng này
// docker run -d --name redis-cart -p 6379:6379 redis

// Trang giỏ hàng
app.get('/cart', async (req, res) => {
  const cartId = req.cookies.cartId;
  if (!cartId) return res.redirect('/');

  const response = await fetch(`http://localhost:3001/carts/${cartId}`);
  const cart = await response.json();

  res.render('boilerplates/cart.ejs', { cart, lastAddedId: req.query.highlight });
});


// API: Thêm sản phẩm vào giỏ hàng
app.post('/cart/add', async (req, res) => {
  const cartId = req.cookies.cartId;
  const { productId, quantity, shopId } = req.body;

  const response = await fetch(`http://localhost:3001/carts/${cartId}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, quantity, shopId })
  });

  const result = await response.json();
  const newItemId = result.cart.items.at(-1)?.id;

  res.redirect(`/cart?highlight=${newItemId}`);
});