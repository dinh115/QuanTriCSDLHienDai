const cassandra = require('cassandra-driver');

const client = new cassandra.Client({
  contactPoints: ['127.0.0.1'],     // your contact points
  localDataCenter: 'datacenter1',   // your DC
  keyspace: 'review_data'
});

const allowedMasps = new Set([
  '22417326-f9fd-4954-9ead-3ceafd52f3d6',
  '86890117-a1cd-48cf-97ae-1e7cc9c1f529',
  '00000000-0000-0000-0000-000000000000'
]);

async function deleteFromProductReviewSummary() {
  const query = 'SELECT masp FROM product_review_summary';
  const result = await client.execute(query);

  for (const row of result.rows) {
    if (!allowedMasps.has(row.masp.toString())) {
      await client.execute('DELETE FROM product_review_summary WHERE masp = ?', [row.masp]);
      console.log(`Deleted masp ${row.masp} from product_review_summary`);
    }
  }
}

async function deleteFromProductReviewsNew() {
  const query = 'SELECT masp, mauser FROM product_reviews_new';
  const result = await client.execute(query);

  for (const row of result.rows) {
    if (!allowedMasps.has(row.masp.toString())) {
      await client.execute('DELETE FROM product_reviews_new WHERE masp = ? AND mauser = ?', [row.masp, row.mauser]);
      console.log(`Deleted masp ${row.masp}, mauser ${row.mauser} from product_reviews_new`);
    }
  }
}

async function run() {
  try {
    await deleteFromProductReviewSummary();
    await deleteFromProductReviewsNew();
    console.log('Deletion complete.');
  } catch (err) {
    console.error('Error during deletion:', err);
  } finally {
    await client.shutdown();
  }
}

run();
