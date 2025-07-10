import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import multer from 'multer'; // Import multer

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();



// --- Multer Configuration for File Uploads ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Save files to the 'public/images' directory
    cb(null, path.join(__dirname, 'public', 'images'));
  },
  filename: function (req, file, cb) {
    // Create a unique filename to prevent overwriting
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage: storage });

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware to parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Midlleware for cookie
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware xác thực bằng JWT
import jwt from 'jsonwebtoken';
const SECRET_KEY = 'your-super-secret-jwt-key-change-in-production'; // phải giống với backend

function authenticateToken(req, res, next) {
    const token = req.cookies.token;

    if (!token) {
        req.user = null;
        return next(); // không có token thì tiếp tục (ví dụ vào trang home)
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded; // gán toàn bộ user từ JWT vào req.user
    } catch (err) {
        console.error('JWT Verify Error:', err.name, err.message); // ⚠️ In ra lỗi thật

        req.user = null;
    }

    next();
}

app.use(authenticateToken); // áp dụng cho toàn bộ app

// Home page – có user + productId mẫu
app.get('/', (req, res) => {
    const username = req.user?.username || ("User #" + Math.floor(Math.random() * 100) + 1);
    const exampleProductId = "22417326-f9fd-4954-9ead-3ceafd52f3d6";
    res.render('home.ejs', { username, user: req.user, exampleProductId });
});

// Trang login
app.get('/login', (req, res) => {
    if (req.user) {
        return res.redirect('/');
    }
    res.render('login', { error: null });
});

// Xử lý login
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

// Logout
app.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/login');
});


// ----- REVIEW ROUTES -----

// Load reviews for hardcoded product (demo)
app.get('/reviews', async (req, res) => {
    const apiUrl = 'http://localhost:3003/product/c28d7705-5e0f-482a-8bbb-416780e42c1d/reviews';

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        const reviews = data.reviews.map((r, idx) => ({
            id: idx + 1,
            username: r.username,
            rating: r.rating,
            date: new Date(r.review_date).toLocaleString('vi-VN'),
            title: null,
            content: r.noidung,
            response: r.has_reply ? {
                title: "Phản Hồi Của Người Bán",
                content: r.reply_content,
            } : null,
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

// Load reviews for specific product
app.get('/reviews/:productId', async (req, res) => {
    const { productId } = req.params;
    const apiUrl = `http://localhost:3003/product/${productId}/reviews`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        const reviews = data.reviews.map((r, idx) => ({
            id: idx + 1,
            username: r.username,
            rating: r.rating,
            date: new Date(r.review_date).toLocaleString('vi-VN'),
            title: null,
            content: r.noidung,
            response: r.has_reply ? {
                title: "Phản Hồi Của Người Bán",
                content: r.reply_content,
            } : null,
            images: r.images || [],
            chatluong: r.chatluong,
            mota_dung: r.mota_dung,
            phanloai: r.phanloai
        }));

        res.render('review.ejs', {
            productId,
            reviews,
            nextPage: data.nextPage,
            hasMore: !!data.nextPage
        });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).send("Lỗi khi tải đánh giá");
    }
});

// API JSON - reviews with filter & pagination
app.get('/api/reviews/:productId', async (req, res) => {
    const { productId } = req.params;
    const { pageState, filter } = req.query;

    let apiUrl = `http://localhost:3003/product/${productId}/reviews`;

    if (filter && filter !== 'all') {
        if (filter.startsWith('rating-')) {
            const rating = filter.split('-')[1];
            apiUrl += `/rating/${rating}`;
        } else if (filter === 'images') {
            apiUrl += '/images';
        }
    }

    if (pageState) {
        apiUrl += `?pageState=${pageState}`;
    }

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        const reviews = data.reviews.map((r, idx) => ({
            id: idx + 1,
            username: r.username,
            rating: r.rating,
            date: new Date(r.review_date).toLocaleString('vi-VN'),
            title: null,
            content: r.noidung,
            response: r.has_reply ? {
                title: "Phản Hồi Của Người Bán",
                content: r.reply_content,
            } : null,
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

// Review form (get)
app.get('/product/:productId/review-form', (req, res) => {
    const { productId } = req.params;
    const username = req.user?.username || ("User #" + Math.floor(Math.random() * 100) + 1);
    res.render('review-form.ejs', { username, productId });
});

// Review submission (post)
app.post('/product/:productId/reviews', upload.array('images', 5), async (req, res) => {
    const { productId } = req.params;
    const { rating, phanloai, chatluong, mota_dung, noidung } = req.body;

    const imagePaths = req.files ? req.files.map(file => `/images/${file.filename}`) : [];

    const payload = {
        mauser: req.user?.id || "dda14db3-f64e-4c66-bc60-e02b061761b2",
        username: req.user?.username || "username",
        rating: parseInt(rating, 10),
        phanloai,
        chatluong,
        mota_dung,
        noidung,
        images: imagePaths
    };

    try {
        const apiResponse = await fetch(`http://localhost:3003/product/${productId}/reviews`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!apiResponse.ok) {
            const errorText = await apiResponse.text();
            throw new Error(`Backend API Error: ${apiResponse.status} - ${errorText}`);
        }

        console.log('Review submitted successfully!');
        res.redirect(`/reviews/${productId}`);
    } catch (error) {
        console.error('Error submitting review to backend:', error);
        res.status(500).send("Lỗi khi gửi đánh giá.");
    }
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Frontend running at http://localhost:${PORT}`);
});