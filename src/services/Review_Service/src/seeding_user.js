const cassandra = require('cassandra-driver');
const { v5: uuidv5 } = require('uuid');

const NAMESPACE = '3f96061a-3a25-4f89-9ae9-abc012345678';
const TOTAL_USERS = 10100;

// Cassandra client setup
const client = new cassandra.Client({
  contactPoints: ['localhost'], // Update if needed
  localDataCenter: 'datacenter1', // Update according to your setup
  keyspace: 'review_data' // Replace with your keyspace name
});

// Role determination function
function getRoleByNumber(num) {
  if (num >= 1 && num <= 100) return 'admin';
  if (num >= 101 && num <= 3100) return 'shop_owner';
  if (num >= 3101 && num <= 10100) return 'customer';
  return 'customer';
}

// Generate and insert users
async function seedUsers() {
  const query = 'INSERT INTO users (userid, username, role) VALUES (?, ?, ?)';

  for (let i = 1; i <= TOTAL_USERS; i++) {
    const username = `user_${i}`;
    const id = uuidv5(username, NAMESPACE);
    const role = getRoleByNumber(i);

    try {
      await client.execute(query, [id, username, role], { prepare: true });
      if (i % 1000 === 0) console.log(`Inserted ${i} users`);
    } catch (err) {
      console.error(`Failed to insert user ${username}:`, err);
    }
  }

  console.log('Seeding completed.');
  await client.shutdown();
}

seedUsers();
