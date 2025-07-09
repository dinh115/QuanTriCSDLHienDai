import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded({ extended: false }));
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


app.get('/', (req, res) => {
    res.render('home.ejs', { user: req.user });
});

// Trang login
app.get('/login', (req, res) => {
    if (req.user) {
        res.redirect('/');
        return;
    }
    res.render('login', { error: null });
});


// Xử lý login → gửi POST đến API backend
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
        return res.render('login', { error: 'Có lỗi xảy ra khi đăng nhập!' });
    }
});


app.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/login');
});


const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Frontend running at http://localhost:${PORT}`);
});
