// server.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from 'redis'; // 👈 thay vì require('redis')

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;


// Middleware
app.use(express.json());

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
app.post('/cart/add', async (req, res) => {
  const { user_id, product_id, quantity } = req.body;

  if (!user_id || !product_id || !quantity) {
    return res.status(400).json({ error: 'Thiếu thông tin user_id, product_id hoặc quantity' });
  }

  const cartKey = `cart:${user_id}`;

  try {
    await redisClient.hIncrBy(cartKey, product_id, parseInt(quantity));
    return res.status(200).json({ message: 'Đã thêm vào giỏ hàng', cart_key: cartKey });
  } catch (err) {
    console.error('❌ Lỗi khi thêm vào giỏ hàng:', err);
    return res.status(500).json({ error: 'Lỗi server' });
  }
});