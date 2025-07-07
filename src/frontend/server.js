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

app.get('/', (req, res) => {
    const username = "User #" + Math.floor(Math.random() * 100) + 1;
    res.render('home.ejs', { username });
});

// Trang login
app.get('/login', (req, res) => {
    res.render('login');
});


// Xử lý login → gửi POST đến API backend
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        console.log(JSON.stringify({ username, password }));
        const response = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            return res.send('Đăng nhập thất bại!');
        }

        const data = await response.json();
        const token = data.token;

        res.cookie('token', token, { httpOnly: true });
        res.redirect('/');
        console.log('Đăng nhập thành công');
    } catch (err) {
        res.status(500).send('Lỗi kết nối backend!');
    }
});

// Middleware xác thực bằng JWT
import jwt from 'jsonwebtoken';
const SECRET_KEY = 'your_secret_key'; // phải giống với backend

function authenticateToken(req, res, next) {
    const token = req.cookies.token;
    if (!token) return res.redirect('/login');

    try {
        const user = jwt.verify(token, SECRET_KEY);
        req.user = user;
        next();
    } catch (err) {
        res.redirect('/login');
    }
}



app.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/login');
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Frontend running at http://localhost:${PORT}`);
});
