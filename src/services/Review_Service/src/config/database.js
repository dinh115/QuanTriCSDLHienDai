const { Client } = require('cassandra-driver');

const client = new Client({
  contactPoints: ['localhost'],
  localDataCenter: 'datacenter1',
  keyspace: 'review_data'
});

client.connect()
  .then(() => console.log('✅ Connected to Cassandra'))
  .catch(err => console.error('❌ Error connecting to Cassandra:', err));

module.exports = client;