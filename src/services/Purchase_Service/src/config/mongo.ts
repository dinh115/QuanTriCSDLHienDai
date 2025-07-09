import mongoose from 'mongoose';
import chalk from 'chalk';
export const connectDatabase = async (): Promise<void> => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/purchase_service';

        await mongoose.connect(mongoUri, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        console.log(chalk.bold.green('✅ Connected to MongoDB'));
    } catch (error) {
        console.error(chalk.bold.red('❌ MongoDB connection error:', error));
        process.exit(1);
    }
};