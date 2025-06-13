import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import productRoutes from './routes/product_route.js';
import morgan from 'morgan';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(express.json());

app.use('/products', productRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});
app.get('/create', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'products/add.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Product service running on http://localhost:${PORT}`);
});
