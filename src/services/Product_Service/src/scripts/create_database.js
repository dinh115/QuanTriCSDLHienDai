import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/product_schema.js'; // Đảm bảo bạn đã có model này

dotenv.config();

async function init() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Dùng Product.init() để đảm bảo indexes được tạo (và collection được sinh ra)
    await Product.init();

    console.log('Collection "products" (lowercased) successed');
  } catch (err) {
    console.error('Error during init:', err);
  } finally {
    await mongoose.connection.close();
    console.log('Connection closed');
  }
}

init();
