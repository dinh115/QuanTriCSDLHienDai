import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import morgan from 'morgan';

const app = express();
const PORT = 3000;
app.use(morgan('dev'));

app.use(express.json());

// Proxy configuration for the product service
const productServiceUrl = 'http://product-service:3001';
app.use('/products', createProxyMiddleware({
  target: productServiceUrl,
  changeOrigin: true,
  pathRewrite: {
    '^/products': '', // Remove /products prefix
  },
}));

// Proxy configuration for the user service
const userServiceUrl = 'http://user-service:3002';
app.use('/users', createProxyMiddleware({
  target: userServiceUrl,
  changeOrigin: true,
  pathRewrite: {
    '^/users': '', // Remove /users prefix
  },
}));

// Proxy configuration for the cart service - ĐÃ CẬP NHẬT
app.use('/cart', createProxyMiddleware({
  target: process.env.CART_SERVICE_URL || 'http://cart-service:3003',
  changeOrigin: true,
  pathRewrite: {
    '^/cart': '', // Remove /cart prefix
  },
}));

app.listen(PORT, () => {
  console.log(`api-gateway running at http://localhost:${PORT}`);
});