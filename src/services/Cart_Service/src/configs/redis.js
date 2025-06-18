import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

// Kết nối Redis và export client
(async () => {
  await redisClient.connect();
  console.log('Connected to Redis');
})();

export default redisClient;