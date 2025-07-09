import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  PORT: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Logger
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',

  // Service Token
  SERVICE_TOKEN: process.env.SERVICE_TOKEN || 'service-secret-token-123',

  // MongoDB
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://user-mongodb:27017/user-management',

  // Redis
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  REDIS_TTL: parseInt(process.env.REDIS_TTL || '3600'), // 1 hour default
};

// Validation
const requiredEnvVars = ['JWT_SECRET'];

if (config.NODE_ENV === 'production') {
  requiredEnvVars.push('MONGODB_URI', 'SERVICE_TOKEN');
}

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`Warning: ${envVar} environment variable is not set`);
  }
}