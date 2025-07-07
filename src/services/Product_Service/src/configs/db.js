import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config(); // Load biến môi trường từ .env

const uri = process.env.MONGO_URI;

export async function connectDB() {
    try {
        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('Connected to MongoDB via Mongoose');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}
