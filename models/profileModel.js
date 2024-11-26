// profileModel.js
const { driver } = require('../utiles/dbConnect');

module.exports = {
  async upsertProfile(clientId, profileData) {
    const session = driver.session();
    try {
      // Check if client exists
      const clientCheckResult = await session.run(
        'MATCH (c:Client {id: $clientId}) RETURN c',
        { clientId }
      );

      if (clientCheckResult.records.length === 0) {
        throw new Error('Client not found');
      }

      const query = `
        MATCH (c:Client {id: $clientId})
        MERGE (c)-[:HAS_PROFILE]->(p:Profile)
        SET p += $profileData
        RETURN p
      `;
      const params = { clientId, profileData };
      const result = await session.run(query, params);

      if (result.records.length > 0) {
        return result.records[0].get('p').properties;
      } else {
        throw new Error('Profile update failed');
      }
    } finally {
      await session.close();
    }
  },

  async getProfile(clientId) {
    const session = driver.session();
    try {
      const query = `
        MATCH (c:Client {id: $clientId})-[:HAS_PROFILE]->(p:Profile)
        RETURN p
      `;
      const result = await session.run(query, { clientId });
      if (result.records.length > 0) {
        return result.records[0].get('p').properties;
      } else {
        return null;
      }
    } finally {
      await session.close();
    }
  },
};
