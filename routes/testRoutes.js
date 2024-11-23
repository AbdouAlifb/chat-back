// const express = require('express');
// const router = express.Router();
// const { session } = require('../db');

// // Test API endpoint to fetch data
// router.get('/', async (req, res) => {
//   try {
//     const result = await session.run('MATCH (n) RETURN n LIMIT 5'); // Fetch first 5 nodes
//     const nodes = result.records.map((record) => record.get('n'));
//     res.status(200).json(nodes);
//   } catch (error) {
//     console.error('Error fetching data from Neo4j:', error);
//     res.status(500).json({ message: 'Error connecting to Neo4j' });
//   }
// });

// module.exports = router;
