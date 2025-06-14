// server.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html for root
app.get('/', (req, res) => {
    const username = "User #" + Math.floor(Math.random() * 100) + 1;
    res.render('home.ejs', { username });
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Frontend running at http://localhost:${PORT}`);
});
