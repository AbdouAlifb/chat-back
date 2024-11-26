const neo4j = require('neo4j-driver');

module.exports.dbConnect = async () => {
  try {
    // Crée le driver de connexion
    const driver = neo4j.driver(
      process.env.NEO4J_URI,
      neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
    );

    // Vérifie la connexion en créant une session
    const session = driver.session();
    await session.run('RETURN 1'); // Une requête simple pour tester la connexion
    console.log('Database connected...');

    // Ferme la session (tu peux la conserver ouverte si nécessaire)
    session.close();

    // Optionnel : stocke le driver dans une variable globale si tu as besoin de l’utiliser ailleurs
    global.neo4jDriver = driver;

  } catch (error) {
    console.error('Erreur de connexion à la base de données :', error.message);
  }
};
const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
);

async function dbConnect() {
  try {
    await driver.verifyConnectivity();
    console.log('Database connected...');
  } catch (error) {
    console.error('Erreur de connexion à la base de données :', error.message);
  }
}

module.exports = { dbConnect, driver };