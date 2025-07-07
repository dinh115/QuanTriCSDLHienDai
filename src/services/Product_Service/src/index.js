import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import productRoutes from './routes/product_route.js';
import { connectDB } from './configs/db.js';
import morgan from 'morgan';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to database
connectDB();

// Middleware
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(morgan('dev'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/products', productRoutes);

// View routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/create', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'products/add.html'));
});

app.get('/manage', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'products/manage.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'Product Service' 
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Product service running on http://localhost:${PORT}`);
    console.log(`📊 Management interface: http://localhost:${PORT}/manage`);
});