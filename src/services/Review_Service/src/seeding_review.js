const cassandra = require('cassandra-driver');
const { v5: uuidv5 } = require('uuid');
const faker = require('faker');

const NAMESPACE_UUID = '3f96061a-3a25-4f89-9ae9-abc012345678';

async function seed() {
  // Initialize Cassandra client
  const client = new cassandra.Client({
    contactPoints: ['localhost'],      // Adjust to your Cassandra cluster's contact points
    localDataCenter: 'datacenter1',    // Adjust to your data center name
    keyspace: 'review_data'          // Replace with your actual keyspace name
  });

  try {
    await client.connect();
    console.log('Connected to Cassandra');

    // Step 1: Generate shop IDs
    const shopids = [];
    for (let i = 101; i <= 3100; i++) {
      const username = `user_${i}`;
      const shopid = uuidv5(username, NAMESPACE_UUID);
      shopids.push(shopid);
    }

    // Step 2: Generate pool of usernames for reviews
    const allUsernames = [];
    for (let i = 3101; i <= 10100; i++) {
      allUsernames.push(`user_${i}`);
    }

    // Step 3: Process each shop ID
    for (const shopid of shopids) {
      const query = 'SELECT productid FROM products WHERE shopid = ? ALLOW FILTERING';
      const result = await client.execute(query, [shopid], { prepare: true });
      const productids = result.rows.map(row => row.productid);

      // Step 4: Generate 50 reviews for each product ID
      for (const productid of productids) {
        // Select 50 unique usernames randomly
        const selectedUsernames = [];
        const usedIndices = new Set();
        while (selectedUsernames.length < 50) {
          const index = Math.floor(Math.random() * allUsernames.length);
          if (!usedIndices.has(index)) {
            usedIndices.add(index);
            selectedUsernames.push(allUsernames[index]);
          }
        }

        // Generate and insert reviews
        for (const username of selectedUsernames) {
          const mauser = uuidv5(username, NAMESPACE_UUID);
          const rating = Math.floor(Math.random() * 5) + 1;
          const review_date = new Date();

          // Generate e-commerce related sample text using Faker
          const phanloai = faker.commerce.productAdjective(); // e.g., "Fantastic"
          const chatluong = faker.lorem.sentence();           // e.g., "Great quality product."
          const mota_dung = faker.lorem.sentence();           // e.g., "Matches the description perfectly."
          const noidung = faker.lorem.paragraph();            // e.g., "Really happy with this purchase..."

          // Generate random number of images (0-5) and their URLs
          const nImages = Math.floor(Math.random() * 6); // 0 to 5
          const images = [];
          for (let j = 0; j < nImages; j++) {
            const imageId = Math.floor(Math.random() * 300) + 1; // 1 to 300
            images.push(`https://picsum.photos/id/${imageId}/200/300`);
          }
          const has_images = nImages > 0;

          // Determine if there’s a reply (50/50 chance)
          const has_reply = Math.random() < 0.5;
          let reply_date = null;
          let reply_content = null;
          if (has_reply) {
            reply_date = new Date();
            reply_content = "Cảm ơn bạn đã reviews sản phẩm";
          }

          // Insert review into productReviews table
          const insertQuery = `
            INSERT INTO productReviews (
              masp, mauser, username, rating, review_date, phanloai, chatluong, 
              mota_dung, noidung, images, has_images, reply_date, reply_content, has_reply
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          const params = [
            productid, mauser, username, rating, review_date, phanloai, chatluong,
            mota_dung, noidung, images, has_images, reply_date, reply_content, has_reply
          ];
          await client.execute(insertQuery, params, { prepare: true });

          // Update productReviewsSummary table
          const ratingColumn = `rating_${rating}`;
          const updateQuery = `
            UPDATE productReviewsSummary
            SET total_reviews = total_reviews + 1,
                ${ratingColumn} = ${ratingColumn} + 1,
                has_images = has_images + ${has_images ? 1 : 0}
            WHERE masp = ?
          `;
          await client.execute(updateQuery, [productid], { prepare: true });
        }
      }
    }

    console.log('Database seeding completed successfully');
  } catch (error) {
    console.error('Error during seeding:', error);
  } finally {
    await client.shutdown();
    console.log('Disconnected from Cassandra');
  }
}

// Execute the seeding function
seed();