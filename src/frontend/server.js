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

//get health
app.get('/health', (req, res) => {
  res.status(200).send('Frontend is healthy');
});


// Home page
// app.get('/', (req, res) => {
//   const username = req.user?.username || ("User #" + Math.floor(Math.random() * 100 + 1));
//   const exampleProductId = "22417326-f9fd-4954-9ead-3ceafd52f3d6";
//   res.render('home.ejs', { username, user: req.user, exampleProductId });
// });

app.get('/', async (req, res) => { // Make the route handler async
    const username = req.user?.username || ("User #" + Math.floor(Math.random() * 100 + 1));
    const exampleProductId = "22417326-f9fd-4954-9ead-3ceafd52f3d6";

    // --- START: Added code for review notifications ---
    let productsToReview = [];
    try {
        // These IDs would realistically come from a user's purchase history in a database
        const purchasedProductIds = [
            "f47ac10b-58cc-4372-a567-0e02b2c3d479",
            "10000000-0000-0000-0000-000000000000"
        ];

        // Fetch details for all products concurrently
        const productDetailsPromises = purchasedProductIds.map(async (productid) => {
            try {
                const response = await fetch('http://review-service:3009/products/details', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ productid })
                });

                if (!response.ok) {
                    console.error(`API request failed for product ID: ${productid} with status: ${response.status}`);
                    return null;
                }
                const productData = await response.json();
                // Attach the ID for creating the link in the template
                productData.productid = productid;
                return productData;

            } catch (fetchError) {
                console.error(`Fetch error for product ID: ${productid}`, fetchError);
                return null; // Prevent a single failed fetch from crashing the entire process
            }
        });

        // Wait for all fetches to complete and filter out any that failed (returned null)
        productsToReview = (await Promise.all(productDetailsPromises)).filter(p => p !== null);

    } catch (error) {
        console.error('❌ Error fetching product details for notifications:', error);
        // If the service is down, we'll just render the page with no review notifications
        productsToReview = [];
    }
    // --- END: Added code for review notifications ---

    res.render('home.ejs', {
        username,
        user: req.user,
        exampleProductId,
        productsToReview // Pass the new data to the view
    });
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
// Reviews route - initial load
app.get('/reviews', async (req, res) => {
    const apiUrl = 'http://review-service:3009/product/10000000-0000-0000-0000-000000000000/reviews';

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        // Map API fields to frontend format
        const reviews = data.reviews.map((r, idx) => ({
            id: idx + 1,
            username: r.username,
            rating: r.rating,
            date: new Date(r.review_date).toLocaleString('vi-VN'),
            title: null,
            content: r.noidung,
            response: r.has_reply
                ? {
                      title: "Phản Hồi Của Người Bán",
                      content: r.reply_content,
                  }
                : null,
            images: r.images || [],
            chatluong: r.chatluong,
            mota_dung: r.mota_dung,
            phanloai: r.phanloai
        }));

        res.render('review.ejs', { 
            reviews, 
            nextPage: data.nextPage,
            hasMore: !!data.nextPage
        });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).send("Lỗi khi tải đánh giá");
    }
});

// API endpoint for pagination with filters
app.get('/reviews/:productId', async (req, res) => {
    const { productId } = req.params; // Get productId from URL
    const apiUrl = `http://review-service:3009/product/${productId}/reviews`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        // Map API fields to frontend format (this logic remains the same)
        const reviews = data.reviews.map((r, idx) => ({
            id: idx + 1,
            username: r.username,
            rating: r.rating,
            date: new Date(r.review_date).toLocaleString('vi-VN'),
            title: null,
            content: r.noidung,
            response: r.has_reply
                ? {
                      title: "Phản Hồi Của Người Bán",
                      content: r.reply_content,
                  }
                : null,
            images: r.images || [],
            chatluong: r.chatluong,
            mota_dung: r.mota_dung,
            phanloai: r.phanloai
        }));

        // Pass productId to the template
        res.render('review.ejs', {
            productId, // Pass the ID to the view
            reviews,
            nextPage: data.nextPage,
            hasMore: !!data.nextPage
        });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).send("Lỗi khi tải đánh giá");
    }
});

// API endpoint for pagination with filters (MODIFIED)
app.get('/api/reviews/:productId', async (req, res) => {
    const { productId } = req.params; // Get productId from URL
    const pageState = req.query.pageState;
    const filter = req.query.filter;

    let apiUrl = `http://review-service:3009/product/${productId}/reviews`;

    // Apply filter to URL (this logic remains the same)
    if (filter && filter !== 'all') {
        if (filter.startsWith('rating-')) {
            const rating = filter.split('-')[1];
            apiUrl += `/rating/${rating}`;
        } else if (filter === 'images') {
            apiUrl += '/images';
        }
    }

    // Add pagination if provided
    if (pageState) {
        apiUrl += `?pageState=${pageState}`;
    }

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        // Map API fields to frontend format (this logic remains the same)
        const reviews = data.reviews.map((r, idx) => ({
            id: idx + 1,
            username: r.username,
            rating: r.rating,
            date: new Date(r.review_date).toLocaleString('vi-VN'),
            title: null,
            content: r.noidung,
            response: r.has_reply
                ? {
                      title: "Phản Hồi Của Người Bán",
                      content: r.reply_content,
                  }
                : null,
            images: r.images || [],
            chatluong: r.chatluong,
            mota_dung: r.mota_dung,
            phanloai: r.phanloai
        }));

        res.json({
            reviews,
            nextPage: data.nextPage,
            hasMore: !!data.nextPage,
            filter: filter || 'all'
        });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ error: "Lỗi khi tải đánh giá" });
    }
});

// Review form route
// app.get('/review-form', (req, res) => {
//     const username = "User #" + Math.floor(Math.random() * 100) + 1;
//     res.render('review-form.ejs', { username });
// });

// MODIFIED: Review form route is now dynamic to get the product ID
// app.get('/product/:productId/review-form', (req, res) => {
//     const { productId } = req.params;
//     const username = "User #" + Math.floor(Math.random() * 100) + 1;
//     // Pass the productId to the form template
//     res.render('review-form.ejs', { username, productId });
// });

app.get('/product/:productId/review-form', async (req, res) => {
    const { productId } = req.params;
    const username = req.user?.username || ("User #" + Math.floor(Math.random() * 100 + 1)); // Use req.user if available

    let productDetails = null;

    try {
        // Fetch product details from your review-service
        const response = await fetch('http://review-service:3009/products/details', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productid: productId }) // Ensure this matches your API's expected payload
        });

        if (!response.ok) {
            console.error(`API request failed for product ID: ${productId} with status: ${response.status}`);
            // Log the error but don't prevent the page from loading
            // You might want to display a message to the user later in the EJS if productDetails is null
        } else {
            productDetails = await response.json();
        }
    } catch (error) {
        console.error('❌ Error fetching product details for review form:', error);
        // If the review service is down or there's a network error, productDetails will remain null
    }

    // Pass the productId, username, and productDetails to the form template
    res.render('review-form.ejs', {
        username,
        productId,
        product: productDetails, // Pass the fetched product details here
        user: req.user // Ensure you're passing req.user if your header-review-form.ejs uses it
    });
});


// NEW: Route to handle the review form submission with file uploads
app.post('/product/:productId/reviews', upload.array('images', 5), async (req, res) => {
    const { productId } = req.params;
    
    // Extract text data from the form body
    const { rating, phanloai, chatluong, mota_dung, noidung } = req.body;
    
    // Get the relative paths of uploaded images provided by multer
    const imagePaths = req.files ? req.files.map(file => `/images/${file.filename}`) : [];

    // Construct the payload for your backend API
    const payload = {
        mauser: "dda14db3-f64e-4c66-bc60-e02b061761b2", // session dummy
        username: "username", // session dummy
        rating: parseInt(rating, 10), // Ensure rating is a number
        phanloai,
        chatluong,
        mota_dung,
        noidung,
        images: imagePaths
    };

    try {
        // Send the composed data to your backend API
        const apiResponse = await fetch(`http://review-service:3009/product/${productId}/reviews`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!apiResponse.ok) {
            const errorText = await apiResponse.text();
            throw new Error(`Backend API Error: ${apiResponse.status} - ${errorText}`);
        }
        
        // After successful submission, redirect the user to see their new review
        console.log('Review submitted successfully!');
        res.redirect(`/reviews/${productId}`);

    } catch (error) {
        console.error('Error submitting review to backend:', error);
        res.status(500).send("Lỗi khi gửi đánh giá.");
    }
});

// ⭐ NEW: API endpoint to handle review replies
app.post('/product/:productId/reviews/:reviewId/reply', async (req, res) => {
    const { productId, reviewId } = req.params;
    const { reply_content } = req.body;

    try {
        const apiResponse = await fetch(`http://review-service:3009/product/${productId}/reviews/${reviewId}/reply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reply_content })
        });

        if (!apiResponse.ok) {
            const errorText = await apiResponse.text();
            console.error(`Backend API Error: ${apiResponse.status} - ${errorText}`);
            return res.status(apiResponse.status).json({ success: false, message: 'Failed to submit reply to the backend.' });
        }

        const responseData = await apiResponse.json();
        console.log('Reply submitted successfully!');
        res.status(200).json({ success: true, message: 'Reply submitted successfully!', data: responseData });

    } catch (error) {
        console.error('Error submitting reply:', error);
        res.status(500).json({ success: false, message: 'An internal server error occurred.' });
    }
});

// --- NEW ROUTES FOR SHOP OWNER REPLIES ---

// NEW: Route to display reviews for shop owner
app.get('/reviews-shop-owner/:productId', async (req, res) => {
    const { productId } = req.params;
    const apiUrl = `http://review-service:3009/product/${productId}/reviews`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        // Map API fields, including mauser which is needed for the reply API
        const reviews = data.reviews.map((r, idx) => ({
            id: idx + 1,
            username: r.username,
            rating: r.rating,
            date: new Date(r.review_date).toLocaleString('vi-VN'),
            title: null,
            content: r.noidung,
            mauser: r.mauser, // Include mauser for the reply button
            response: r.has_reply
                ? {
                    title: "Phản Hồi Của Người Bán",
                    content: r.reply_content,
                }
                : null,
            images: r.images || [],
            chatluong: r.chatluong,
            mota_dung: r.mota_dung,
            phanloai: r.phanloai
        }));

        res.render('reviews-shop-owner.ejs', {
            productId,
            reviews,
            nextPage: data.nextPage,
            hasMore: !!data.nextPage
        });
    } catch (error) {
        console.error('Error fetching reviews for shop owner:', error);
        res.status(500).send("Lỗi khi tải đánh giá");
    }
});

// NEW: API endpoint to handle reply submission
app.post('/api/product/:productId/reviews/:mauser/reply', async (req, res) => {
    const { productId, mauser } = req.params;
    const { reply_content } = req.body;

    // Validate input
    if (!reply_content) {
        return res.status(400).json({ error: 'Nội dung phản hồi không được để trống.' });
    }

    try {
        const apiResponse = await fetch(`http://review-service:3009/product/${productId}/reviews/${mauser}/reply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reply_content })
        });

        if (!apiResponse.ok) {
            const errorText = await apiResponse.text();
            console.error(`Backend API Error: ${apiResponse.status} - ${errorText}`);
            return res.status(apiResponse.status).json({ error: `Lỗi khi gửi phản hồi: ${apiResponse.statusText}` });
        }

        const data = await apiResponse.json();
        res.json({
            success: true,
            message: 'Phản hồi đã được gửi thành công.',
            replyData: data // Or whatever the backend returns
        });
    } catch (error) {
        console.error('Error submitting reply to backend:', error);
        res.status(500).json({ error: "Lỗi server khi gửi phản hồi." });
    }
});

app.listen(PORT, () => {
  console.log(`✅ Frontend running at http://localhost:${PORT}`);
});