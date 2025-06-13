import express from 'express';
import axios from 'axios';
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
    '^/products': '', // Remove /products prefix when forwarding to the product service
  },
}));


// Proxy configuration for the user service
const userServiceUrl = 'http://user-service:3002';
app.use('/users', createProxyMiddleware({
  target: userServiceUrl,
  changeOrigin: true,
  pathRewrite: {
    '^/users': '', // Remove /users prefix when forwarding to the user service
  },
}));




app.listen(PORT, () => {
  console.log(`api-gateway running at http://localhost:${PORT}`);
});
