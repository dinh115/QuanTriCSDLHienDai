const { Client } = require('cassandra-driver');

// Configuration is now driven by environment variables for better flexibility in different environments (dev, prod, etc.).
// Defaults are provided for local development if environment variables are not set.
const contactPoints = (process.env.CASSANDRA_CONTACT_POINTS || 'cassandra-node-1').split(',');
const localDataCenter = process.env.CASSANDRA_DATACENTER || 'datacenter1';
const keyspace = process.env.CASSANDRA_KEYSPACE || 'review_data';

const client = new Client({
  contactPoints: contactPoints,
  localDataCenter: localDataCenter,
  keyspace: keyspace
});

client.connect()
  .then(() => console.log('✅ Connected to Cassandra'))
  .catch(err => console.error('❌ Error connecting to Cassandra:', err));

module.exports = client;