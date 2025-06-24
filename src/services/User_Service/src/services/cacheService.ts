import { redisConnection } from '../config/redis';
import { config } from '../config/environments';

export class CacheService {
    private redis = redisConnection.getClient();

    // Generic cache operations
    async get<T>(key: string): Promise<T | null> {
        try {
            if (!redisConnection.isReady()) {
                return null;
            }

            const data = await this.redis.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`Cache get error for key ${key}:`, error);
            return null;
        }
    }

    async set(key: string, value: any, ttl: number = config.REDIS_TTL): Promise<boolean> {
        try {
            if (!redisConnection.isReady()) {
                return false;
            }

            await this.redis.setEx(key, ttl, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Cache set error for key ${key}:`, error);
            return false;
        }
    }

    async del(key: string): Promise<boolean> {
        try {
            if (!redisConnection.isReady()) {
                return false;
            }

            await this.redis.del(key);
            return true;
        } catch (error) {
            console.error(`Cache delete error for key ${key}:`, error);
            return false;
        }
    }

    async exists(key: string): Promise<boolean> {
        try {
            if (!redisConnection.isReady()) {
                return false;
            }

            const result = await this.redis.exists(key);
            return result === 1;
        } catch (error) {
            console.error(`Cache exists error for key ${key}:`, error);
            return false;
        }
    }

    // Session management
    async setSession(token: string, ttl: number = config.REDIS_TTL): Promise<boolean> {
        return this.set(`session:${token}`, { active: true }, ttl);
    }

    async getSession(token: string): Promise<any> {
        return this.get(`session:${token}`);
    }

    async deleteSession(token: string): Promise<boolean> {
        return this.del(`session:${token}`);
    }

    // User caching
    // async cacheUser(userId: string, userData: any, ttl: number = 300): Promise<boolean> {
    //     return this.set(`user:${userId}`, userData, ttl);
    // }

    // async getCachedUser(userId: string): Promise<any> {
    //     return this.get(`user:${userId}`);
    // }

    // async invalidateUserCache(userId: string): Promise<boolean> {
    //     return this.del(`user:${userId}`);
    // }

    // Pattern-based operations
    async deletePattern(pattern: string): Promise<boolean> {
        try {
            if (!redisConnection.isReady()) {
                return false;
            }

            const keys = await this.redis.keys(pattern);
            if (keys.length > 0) {
                await this.redis.del(keys);
            }
            return true;
        } catch (error) {
            console.error(`Cache delete pattern error for ${pattern}:`, error);
            return false;
        }
    }

    // Health check
    async ping(): Promise<boolean> {
        try {
            if (!redisConnection.isReady()) {
                return false;
            }

            const result = await this.redis.ping();
            return result === 'PONG';
        } catch (error) {
            console.error('Cache ping error:', error);
            return false;
        }
    }
}

export const cacheService = new CacheService();
export default cacheService;