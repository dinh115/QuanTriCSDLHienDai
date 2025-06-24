import { createClient, RedisClientType } from 'redis';
import { config } from './environments';
import chalk from 'chalk';

class RedisConnection {
    private client: RedisClientType;
    private isConnected: boolean = false;

    constructor() {
        this.client = createClient({
            url: config.REDIS_URL
        });

        this.client.on('error', (err) => {
            console.error(chalk.bold.red('Redis Client Error:', err));
            this.isConnected = false;
        });

        this.client.on('connect', () => {
            console.log(chalk.yellow('🔗 Redis connecting...'));
        });

        this.client.on('ready', () => {
            console.log(chalk.blue('⚡ Redis connected and ready'));
            this.isConnected = true;
        });

        this.client.on('end', () => {
            console.log(chalk.bold.green('Redis connection ended'));
            this.isConnected = false;
        });
    }

    async connect(): Promise<void> {
        try {
            await this.client.connect();
        } catch (error) {
            console.error(chalk.bold.red('Failed to connect to Redis:', error));
            // Don't exit process, allow app to run without Redis
        }
    }

    async disconnect(): Promise<void> {
        try {
            await this.client.disconnect();
        } catch (error) {
            console.error(chalk.bold.red('Error disconnecting from Redis:', error));
        }
    }

    getClient(): RedisClientType {
        return this.client;
    }

    isReady(): boolean {
        return this.isConnected && this.client.isReady;
    }
}

export const redisConnection = new RedisConnection();
export default redisConnection;