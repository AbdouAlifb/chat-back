const neo4j = require('neo4j-driver');
require('dotenv').config(); // Load environment variables

// Create Neo4j Driver
const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
);

// Create a session (to run queries)
const session = driver.session();

// Test the connection
const testConnection = async () => {
  try {
    await session.run('RETURN 1'); // Simple Cypher query
    console.log('Connected to Neo4j database successfully!');
  } catch (error) {
    console.error('Error connecting to Neo4j:', error);
  } finally {
    await session.close(); // Close session after the test
  }
};

module.exports = { driver, session, testConnection };
