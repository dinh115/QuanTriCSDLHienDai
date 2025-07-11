// Before running, install the necessary packages:
// npm install cassandra-driver uuid

const cassandra = require('cassandra-driver');
const { v5: uuidv5 } = require('uuid'); // For UUIDv5 generation

/**
 * Configuration for Cassandra connection and data generation.
 * IMPORTANT: Update CASSANDRA_CONTACT_POINTS and CASSANDRA_KEYSPACE
 * to match your Cassandra setup.
 */
const CASSANDRA_CONTACT_POINTS = ['localhost'];
const CASSANDRA_KEYSPACE = 'review_data';
const NAMESPACE_UUID = '3f96061a-3a25-4f89-9ae9-abc012345678';

const TOTAL_PRODUCTS_TO_INSERT = 10000;
const START_USER_INDEX = 101;
const END_USER_INDEX = 3100;

// Initialize the Cassandra client
const client = new cassandra.Client({
    contactPoints: CASSANDRA_CONTACT_POINTS,
    keyspace: CASSANDRA_KEYSPACE,
    localDataCenter: 'datacenter1'
});

async function connectCassandra() {
    try {
        await client.connect();
        console.log('Successfully connected to Cassandra.');
    } catch (err) {
        console.error('Error connecting to Cassandra:', err);
        process.exit(1);
    }
}

async function seedData() {
    await connectCassandra();

    const productsToInsert = [];
    let currentProductIdCounter = 1;
    let currentUserIndex = START_USER_INDEX;

    console.log(`Starting data generation for ${TOTAL_PRODUCTS_TO_INSERT} products...`);

    while (productsToInsert.length < TOTAL_PRODUCTS_TO_INSERT) {
        const userName = `user_${currentUserIndex}`;
        const shopId = uuidv5(userName, NAMESPACE_UUID);

        const productName = `product_${currentProductIdCounter}`;
        const description = `${productName}${shopId}`;
        const productUuidNameInput = `${productName}${shopId}`;
        const productId = uuidv5(productUuidNameInput, NAMESPACE_UUID);

        productsToInsert.push({
            productid: productId,
            productname: productName,
            description: description,
            shopid: shopId
        });

        currentProductIdCounter++;
        currentUserIndex++;
        if (currentUserIndex > END_USER_INDEX) {
            currentUserIndex = START_USER_INDEX;
        }
    }

    console.log(`Generated ${productsToInsert.length} products. Proceeding with insertion.`);

    const insertQuery = 'INSERT INTO products (productid, productname, description, shopid) VALUES (?, ?, ?, ?)';
    const BATCH_SIZE = 100;

    for (let i = 0; i < productsToInsert.length; i += BATCH_SIZE) {
        const batch = productsToInsert.slice(i, i + BATCH_SIZE).map(product => ({
            query: insertQuery,
            params: [product.productid, product.productname, product.description, product.shopid]
        }));

        try {
            await client.batch(batch, { prepare: true });
            console.log(`Inserted batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(productsToInsert.length / BATCH_SIZE)}`);
        } catch (err) {
            console.error(`Error inserting batch starting at index ${i}:`, err);
        }
    }

    console.log('Data seeding complete! All generated products have been attempted for insertion.');
    await client.shutdown();
}

seedData();
