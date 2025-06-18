import express from 'express';
import cartRoute from './routes/cart_route.js';
import redisClient from './configs/redis.js';

const app = express();
const port = process.env.PORT || 3003;

app.use(express.json());
app.use('/cart', cartRoute);

app.listen(port, () => {
  console.log(`Cart service running on port ${port}`);
});