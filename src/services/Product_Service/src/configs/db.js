// src/config/db.js
import { MongoClient } from 'mongodb';

const url = 'mongodb://localhost:27017';
const dbName = 'Shopee_UDPT';

let db = null;

export async function connectDB() {
    if (db) return db;

    const client = await MongoClient.connect(url);
    db = client.db(dbName);
    console.log('✅ Connected to MongoDB');
    return db;
}

