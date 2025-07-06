import express from 'express';
import cartRouter from './routes/cart_route.js';

const app = express();
app.use(express.json());

app.use('/carts', cartRouter); // Mount đúng prefix

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🛒 Cart Service running at http://localhost:${PORT}`);
});
