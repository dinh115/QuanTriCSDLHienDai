import { createClient, RedisClientType } from 'redis';
import { config } from './environments';

class RedisConnection {
    private static instance: RedisConnection | null = null;
    private client: RedisClientType;
    private isConnected: boolean = false;

    private constructor() {
        this.client = createClient({
            url: config.REDIS_URL
        });

        this.client.on('error', (err) => {
            console.error('Redis Client Error:', err);
            this.isConnected = false;
        });

        this.client.on('connect', () => {
            console.log('🔗 Redis connecting...');
        });

        this.client.on('ready', () => {
            console.log('⚡ Redis connected and ready');
            this.isConnected = true;
        });

        this.client.on('end', () => {
            console.log('Redis connection ended');
            this.isConnected = false;
        });
    }

    public static getInstance(): RedisConnection {
        if (!RedisConnection.instance) {
            RedisConnection.instance = new RedisConnection();
        }
        return RedisConnection.instance;
    }

    async connect(): Promise<void> {
        try {
            await this.client.connect();
        } catch (error) {
            console.error('Failed to connect to Redis:', error);
        }
    }

    async disconnect(): Promise<void> {
        try {
            await this.client.disconnect();
        } catch (error) {
            console.error('Error disconnecting from Redis:', error);
        }
    }

    getClient(): RedisClientType {
        return this.client;
    }

    isReady(): boolean {
        return this.isConnected && this.client.isReady;
    }
}

export const redisConnection = RedisConnection.getInstance();
export default redisConnection;
