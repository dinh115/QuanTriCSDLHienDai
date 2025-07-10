import { createClient } from 'redis';

const redisClient = createClient({
  socket: {
    host: 'redis',
    port: 6379
  }
});

redisClient.on('error', err => console.error('❌ Redis error:', err));

await redisClient.connect();
console.log('✅ Redis connected');

export default redisClient;