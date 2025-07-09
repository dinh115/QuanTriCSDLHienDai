import mongoose from 'mongoose';
import { config } from './environments';
import chalk from 'chalk';

export const connectDatabase = async (): Promise<void> => {
    try {
        await mongoose.connect(config.MONGODB_URI);
        console.log(chalk.bold.green('📦 MongoDB connected successfully'));

        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error(chalk.bold.red('MongoDB connection error:', err));
        });

        mongoose.connection.on('disconnected', () => {
            console.log(chalk.bold.red('MongoDB disconnected'));
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log(chalk.bold.red('MongoDB connection closed through app termination'));
            process.exit(0);
        });

    } catch (error) {
        console.error(chalk.bold.red('Failed to connect to MongoDB:', error));
        process.exit(1);
    }
};

export default connectDatabase;