// src/models/productModel.js
import { connectDB } from '../configs/db.js';

const collectionName = 'Products';

export async function createProduct(product) {
    const db = await connectDB();
    const result = await db.collection("Products").insertOne(product);
    console.log("\n\n LMAO \n\n");
    console.log("Product created with ID:", result.insertedId);
    return result.insertedId;
}

export async function getAllProducts() {
    const db = await connectDB();
    return await db.collection("Products").find({}).toArray();
}

export async function getProductById(id) {
    const db = await connectDB();
    return await db.collection("Products").findOne({ _id: new db.bson.ObjectId(id) });
}

export async function updateProduct(id, updateData) {
    const db = await connectDB();
    return await db.collection("Products").updateOne(
        { _id: new db.bson.ObjectId(id) },
        { $set: updateData }
    );
}

export async function deleteProduct(id) {
    const db = await connectDB();
    return await db.collection("Products").deleteOne({ _id: new db.bson.ObjectId(id) });
}
