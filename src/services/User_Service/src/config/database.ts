import mongoose from 'mongoose';
import { config } from './environments';

export const connectDatabase = async (): Promise<void> => {
    try {
        await mongoose.connect(config.MONGODB_URI);
        console.log('📦 MongoDB connected successfully');

        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('MongoDB connection closed through app termination');
            process.exit(0);
        });

    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        process.exit(1);
    }
};

export default connectDatabase;
