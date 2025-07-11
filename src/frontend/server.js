// server.js (COMPLETE VERSION)
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

// Helper function to call product service
async function callProductService(endpoint, method = 'GET', data = null) {
  try {
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (data) {
      config.body = JSON.stringify(data);
    }
    
    const response = await fetch(`http://localhost:3001${endpoint}`, config);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error calling product service: ${error.message}`);
    throw error;
  }
}

// Home page - Load products from service
app.get('/', async (req, res) => {
  const username = req.user?.username || ("User #" + Math.floor(Math.random() * 100 + 1));
  
  try {
    // Lấy danh sách sản phẩm từ product service
    const products = await callProductService('/api/products?limit=20&status=active');
    
    res.render('home.ejs', { 
      username, 
      user: req.user, 
      products: products.data || [],
      totalProducts: products.total || 0
    });
  } catch (error) {
    console.error('Error loading products:', error);
    res.render('home.ejs', { 
      username, 
      user: req.user, 
      products: [],
      totalProducts: 0,
      error: 'Không thể tải sản phẩm'
    });
  }
});

// --- PRODUCT ROUTES ---
// API to get products for frontend
app.get('/api/products', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 20, sort = 'createdAt', shopId } = req.query;
    
    let endpoint = '/api/products?';
    const params = new URLSearchParams();
    
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    if (shopId) params.append('shopId', shopId);
    params.append('page', page);
    params.append('limit', limit);
    params.append('sort', sort);
    params.append('status', 'active');
    
    endpoint += params.toString();
    
    const products = await callProductService(endpoint);
    res.json(products);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi tải sản phẩm',
      error: error.message 
    });
  }
});

// Get single product
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await callProductService(`/api/products/${req.params.id}`);
    res.json(product);
  } catch (error) {
    if (error.message.includes('404')) {
      res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy sản phẩm' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Lỗi khi tải sản phẩm',
        error: error.message 
      });
    }
  }
});

// Get categories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await callProductService('/api/categories');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi tải danh mục',
      error: error.message 
    });
  }
});

// Product detail page
app.get('/product/:id', async (req, res) => {
  try {
    const product = await callProductService(`/api/products/${req.params.id}`);
    res.render('product-detail', { 
      product: product.data || product,
      title: product.data?.name || product.name,
      user: req.user
    });
  } catch (error) {
    console.error('Error loading product detail:', error);
    res.status(404).render('404', { 
      title: 'Không tìm thấy sản phẩm',
      message: 'Sản phẩm bạn tìm kiếm không tồn tại',
      user: req.user
    });
  }
});

// Search page
app.get('/search', async (req, res) => {
  try {
    const { q: query, category, page = 1 } = req.query;
    
    let endpoint = '/api/products?';
    const params = new URLSearchParams();
    
    if (query) params.append('search', query);
    if (category) params.append('category', category);
    params.append('page', page);
    params.append('limit', 20);
    params.append('status', 'active');
    
    endpoint += params.toString();
    
    const results = await callProductService(endpoint);
    
    res.render('search', { 
      results: results.data || [],
      query,
      category,
      totalResults: results.total || 0,
      currentPage: parseInt(page),
      totalPages: Math.ceil((results.total || 0) / 20),
      title: `Kết quả tìm kiếm: ${query || 'Tất cả sản phẩm'}`,
      user: req.user
    });
  } catch (error) {
    console.error('Error in search:', error);
    res.render('search', { 
      results: [],
      query: req.query.q || '',
      category: req.query.category || '',
      totalResults: 0,
      currentPage: 1,
      totalPages: 0,
      title: 'Kết quả tìm kiếm',
      user: req.user,
      error: 'Không thể tìm kiếm sản phẩm'
    });
  }
});

// Create new product page
app.get('/products/new', (req, res) => {
  if (!req.user) return res.redirect('/login');
  res.render('product_form', { 
    title: 'Thêm sản phẩm mới',
    user: req.user,
    product: null,
    isEdit: false
  });
});

// Create new product
app.post('/products', upload.array('images', 10), async (req, res) => {
  if (!req.user) return res.redirect('/login');
  
  try {
    const productData = {
      shopId: req.user.shopId || req.user.id,
      name: req.body.name,
      description: req.body.description,
      price: parseFloat(req.body.price),
      stock: parseInt(req.body.stock) || 0,
      category: req.body.category,
      subcategory: req.body.subcategory,
      brand: req.body.brand,
      tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [],
      status: req.body.status || 'draft'
    };

    // Handle uploaded images
    if (req.files && req.files.length > 0) {
      productData.images = req.files.map(file => `/images/${file.filename}`);
      productData.image = productData.images[0]; // Set first image as main image
    }

    // Handle specifications
    if (req.body.specifications) {
      productData.specifications = JSON.parse(req.body.specifications);
    }

    const result = await callProductService('/api/products', 'POST', productData);
    
    res.redirect(`/product/${result.data.id}`);
  } catch (error) {
    console.error('Error creating product:', error);
    res.render('product_form', { 
      title: 'Thêm sản phẩm mới',
      user: req.user,
      product: req.body,
      isEdit: false,
      error: 'Không thể tạo sản phẩm: ' + error.message
    });
  }
});

// Edit product page
app.get('/products/:id/edit', async (req, res) => {
  if (!req.user) return res.redirect('/login');
  
  try {
    const product = await callProductService(`/api/products/${req.params.id}`);
    
    // Check if user owns this product
    if (product.data.shopId !== req.user.shopId && product.data.shopId !== req.user.id) {
      return res.status(403).render('403', { 
        title: 'Không có quyền truy cập',
        message: 'Bạn không có quyền chỉnh sửa sản phẩm này',
        user: req.user
      });
    }
    
    res.render('product_form', { 
      title: 'Chỉnh sửa sản phẩm',
      user: req.user,
      product: product.data,
      isEdit: true
    });
  } catch (error) {
    console.error('Error loading product for edit:', error);
    res.status(404).render('404', { 
      title: 'Không tìm thấy sản phẩm',
      message: 'Sản phẩm bạn muốn chỉnh sửa không tồn tại',
      user: req.user
    });
  }
});

// Update product
app.put('/products/:id', upload.array('images', 10), async (req, res) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
  
  try {
    const productData = {
      name: req.body.name,
      description: req.body.description,
      price: parseFloat(req.body.price),
      stock: parseInt(req.body.stock) || 0,
      category: req.body.category,
      subcategory: req.body.subcategory,
      brand: req.body.brand,
      tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [],
      status: req.body.status || 'draft'
    };

    // Handle uploaded images
    if (req.files && req.files.length > 0) {
      productData.images = req.files.map(file => `/images/${file.filename}`);
      productData.image = productData.images[0];
    }

    // Handle specifications
    if (req.body.specifications) {
      productData.specifications = JSON.parse(req.body.specifications);
    }

    const result = await callProductService(`/api/products/${req.params.id}`, 'PUT', productData);
    
    res.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Không thể cập nhật sản phẩm: ' + error.message
    });
  }
});

// Delete product
app.delete('/products/:id', async (req, res) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
  
  try {
    await callProductService(`/api/products/${req.params.id}`, 'DELETE');
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Không thể xóa sản phẩm: ' + error.message
    });
  }
});

// --- CART ROUTES ---
app.get('/cart', async (req, res) => {
  const cartId = req.cookies.cartId;
  try {
    const response = await fetch(`http://cart_service:3001/carts/${cartId}`);
    const cart = await response.json();
    const cartItems = cart.items || [];
    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity || 0), 0);
    res.render('boilerplates/cart.ejs', {
      cart,
      cartItems,
      total,
      user: req.user,
      lastAddedId: req.query.highlight
    });
  } catch (err) {
    console.error('❌ Lỗi khi lấy giỏ hàng:', err);
    res.render('boilerplates/cart.ejs', {
      cart: {},
      cartItems: [],
      total: 0,
      user: req.user,
      lastAddedId: null
    });
  }
});

app.post('/cart/add', async (req, res) => {
  const cartId = req.cookies.cartId;
  const { productId, quantity, shopId, name, price } = req.body;
  
  try {
    const response = await fetch(`http://cart_service:3001/carts/${cartId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity, shopId, name, price })
    });
    const result = await response.json();
    
    if (!result || !result.cart || !Array.isArray(result.cart.items)) {
      return res.status(400).json({ success: false, message: 'Không thể thêm vào giỏ hàng' });
    }
    
    const newItemId = result.cart.items.at(-1)?.id;
    res.redirect(`/cart?highlight=${newItemId}`);
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi thêm vào giỏ hàng' });
  }
});

app.post('/cart/update', async (req, res) => {
  const cartId = req.cookies.cartId;
  const { itemId, quantity } = req.body;
  try {
    const response = await fetch(`http://cart_service:3001/carts/${cartId}`);
    const cart = await response.json();
    const item = cart.items.find(i => i.id === itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    
    item.quantity = parseInt(quantity);
    item.updatedAt = new Date().toISOString();
    
    const updateRes = await fetch(`http://cart_service:3001/carts/${cartId}`, {
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
    const deleteRes = await fetch(`http://cart_service:3001/carts/${cartId}/items/${itemId}`, { 
      method: 'DELETE' 
    });
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
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    if (!response.ok) {
      return res.render('login', { error: 'Tên đăng nhập hoặc mật khẩu không đúng!' });
    }
    
    const data = await response.json();
    const token = data.data?.token;
    
    if (!token) {
      return res.render('login', { error: 'Không tìm thấy token từ server!' });
    }
    
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

// --- REVIEW ROUTES ---
app.get('/review', (req, res) => {
  res.render('review', { 
    title: 'Đánh giá sản phẩm',
    user: req.user
  });
});

app.get('/review-form', (req, res) => {
  const { productId } = req.query;
  res.render('review-form', { 
    title: 'Viết đánh giá',
    user: req.user,
    productId
  });
});

app.post('/review', async (req, res) => {
  if (!req.user) return res.redirect('/login');
  
  try {
    const reviewData = {
      userId: req.user.id,
      productId: req.body.productId,
      rating: parseInt(req.body.rating),
      comment: req.body.comment,
      images: req.body.images || []
    };
    
    // Call review service or save to database
    // For now, just redirect back
    res.redirect(`/product/${req.body.productId}`);
  } catch (error) {
    console.error('Error submitting review:', error);
    res.render('review-form', { 
      title: 'Viết đánh giá',
      user: req.user,
      productId: req.body.productId,
      error: 'Không thể gửi đánh giá'
    });
  }
});

// --- ERROR HANDLING ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { 
    title: 'Lỗi hệ thống',
    message: 'Đã xảy ra lỗi, vui lòng thử lại sau',
    user: req.user,
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { 
    title: 'Không tìm thấy trang',
    message: 'Trang bạn tìm kiếm không tồn tại',
    user: req.user
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Frontend running at http://localhost:${PORT}`);
});

export default app;