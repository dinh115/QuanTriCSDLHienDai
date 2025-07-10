// generate-reviews-fixed.js
const cassandra = require('cassandra-driver');
const faker    = require('faker');
const { v4: uuidv4 } = require('uuid');

// 1) Configure your Cassandra client
const client = new cassandra.Client({
  contactPoints: ['127.0.0.1'],     // your contact points
  localDataCenter: 'datacenter1',   // your DC
  keyspace: 'review_data'
});

// 2) Table names
const REVIEWS_TABLE  = 'product_reviews_test';
const SUMMARY_TABLE  = 'product_review_summary_test';

// 3) Helpers to build CQL and params
function makeInsert(review) {
  // Dynamically build column list
  const cols = [
    'masp', 'mauser', 'username', 'rating', 'review_date',
    'phanloai', 'chatluong', 'mota_dung', 'noidung'
  ];
  const placeholders = ['?', '?', '?', '?', '?', '?', '?', '?', '?'];
  const params = [
    review.masp,
    review.mauser,
    review.username,
    review.rating,
    review.review_date,
    review.phanloai,
    review.chatluong,
    review.mota_dung,
    review.noidung
  ];

  // Optional images
  if (review.images.length) {
    cols.push('images', 'has_images');
    placeholders.push('?', '?');
    params.push(review.images, true);
  } else {
    cols.push('has_images');
    placeholders.push('?');
    params.push(false);
  }

  // Reply fields
  cols.push('reply_date', 'reply_content', 'has_reply');
  placeholders.push('?', '?', '?');
  params.push(
    review.has_reply ? review.reply_date : null,
    review.has_reply ? review.reply_content : null,
    review.has_reply
  );

  const cql = `INSERT INTO ${REVIEWS_TABLE} (${cols.join(', ')}) VALUES (${placeholders.join(', ')});`;
  return { cql, params };
}

function makeCountersUpdates(masp, rating, hasImages) {
  const stmts = [
    {
      query: `UPDATE ${SUMMARY_TABLE} SET total_reviews = total_reviews + 1 WHERE masp = ?;`,
      params: [masp]
    },
    {
      query: `UPDATE ${SUMMARY_TABLE} SET rating_${rating} = rating_${rating} + 1 WHERE masp = ?;`,
      params: [masp]
    }
  ];
  if (hasImages) {
    stmts.push({
      query: `UPDATE ${SUMMARY_TABLE} SET has_images = has_images + 1 WHERE masp = ?;`,
      params: [masp]
    });
  }
  return stmts;
}

// 4) Generate and batch separately
async function generateAndLoad() {
  const insertBatch = [];
  const counterBatch = [];
  const productIds = Array.from({ length: 100 }, () => uuidv4());

  for (const masp of productIds) {
    const reviewsCount = faker.datatype.number({ min: 500, max: 700 });
    for (let i = 0; i < reviewsCount; i++) {
      const hasReply = Math.random() < 0.2; // 20% chance
      const review = {
        masp,
        mauser: uuidv4(),
        username: faker.internet.userName(),
        rating: faker.datatype.number({ min: 1, max: 5 }),
        review_date: faker.date.past(1),
        phanloai: faker.commerce.color() + ' – ' + faker.commerce.productAdjective(),
        chatluong: faker.commerce.productMaterial(),
        mota_dung: faker.commerce.productDescription(),
        noidung: faker.lorem.sentences(2),
        images: Math.random() < 0.3
          ? Array.from({ length: faker.datatype.number({ min: 1, max: 3 }) }, () => faker.image.imageUrl())
          : [],
        has_reply: hasReply,
        reply_date: hasReply ? faker.date.recent(30) : null,
        reply_content: hasReply ? 'Thank you for your feedback! We are glad you enjoyed it.' : null
      };

      const { cql, params } = makeInsert(review);
      insertBatch.push({ query: cql, params });
      counterBatch.push(...makeCountersUpdates(review.masp, review.rating, review.images.length > 0));
    }

    // Flush every ~100 reviews
    if (insertBatch.length >= 100) {
      await client.batch(insertBatch, { prepare: true });
      await client.batch(counterBatch, { prepare: true, logged: false });
      console.log(`Inserted reviews & counters up to product ${masp}`);
      insertBatch.length = 0;
      counterBatch.length = 0;
    }
  }

  // Final flush
  if (insertBatch.length) {
    await client.batch(insertBatch, { prepare: true });
    await client.batch(counterBatch, { prepare: true, logged: false });
    console.log('Final batch inserted');
  }

  console.log('✅ All synthetic reviews loaded.');
  process.exit(0);
}

// 5) Execute
generateAndLoad().catch(err => {
  console.error('Error loading data:', err);
  process.exit(1);
});
