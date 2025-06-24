import express from 'express';
import cartRoutes from './routes/cart_route.js';

const app = express();
const PORT = 3001;

app.use(express.json());
app.use(cartRoutes);

app.listen(PORT, () => {
  console.log(`🛒 Cart Service running at http://localhost:${PORT}`);
});
