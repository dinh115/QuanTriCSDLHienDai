import mongodb from 'mongodb';
// This script connects to a MongoDB database and creates a collection named "Products".

const MongoClient = mongodb.MongoClient;
const url = 'mongodb://localhost:27017';
const dbName = 'Shopee_UDPT';
// Ensure the MongoDB server is running before executing this script.
async function init() {
  const client = new MongoClient(url);
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(dbName);

    const collections = await db.listCollections({ name: 'Products' }).toArray();
    if (collections.length > 0) {
      console.log('⚠️  Collection "Products" already exists. Skipping.');
    } else {
      await db.createCollection('Products');
      console.log('✅ Collection "Products" created!');
    }

  } catch (err) {
    console.error('❌ Error during init:', err);
  } finally {
    await client.close();
    console.log('🔒 Connection closed');
  }
}

init();