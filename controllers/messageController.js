const neo4j = require('neo4j-driver');
const path = require('path');

// Configurer le driver Neo4j
const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
);


exports.sendMessage = async (req, res) => {
  const session = driver.session();
  try {
    // Récupération du corps de la requête
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message data is required' });
    }

    // Parse le corps du message
    const { content, sender, receiver } = JSON.parse(message);
    let filePath = null;
    let imagePath = null;

    // Vérification des fichiers envoyés
    if (req.file) {
      const fileExtension = path.extname(req.file.originalname).toLowerCase();
      const filePathTemp = req.file.path.replace(/\\/g, '/');

      if (fileExtension === '.pdf') {
        filePath = filePathTemp;
      } else if (['.jpg', '.jpeg', '.png'].includes(fileExtension)) {
        imagePath = filePathTemp;
      }
    }

    // Si le contenu est vide ou null, on ne l'envoie pas
    const messageContent = content ? content : null; // Default value for content if empty

    // Création du message dans Neo4j
    const result = await session.run(
      `
      MATCH (s:Client {id: $sender}), (r:Client {id: $receiver})
      CREATE (s)-[:SENT]->(m:Message {
        sender: $sender,
        receiver: $receiver,
        content: $content,
        file: $file,
        image: $image,
        createdAt: datetime(),
        updatedAt: datetime()
      })-[:RECEIVED_BY]->(r)
      RETURN m
      `,
      { sender, receiver, content: messageContent, file: filePath, image: imagePath }
    );

    const createdMessage = result.records[0]?.get('m').properties || null;

    if (!createdMessage) {
      return res.status(500).json({ error: 'Failed to create the message' });
    }

    res.status(201).json({ message: 'Message sent successfully', data: createdMessage });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  } finally {
    await session.close();
  }
};


// Fonction pour récupérer les messages entre deux clients
exports.getMessages = async (req, res) => {
  const session = driver.session();
  const { senderId, receiverId } = req.params;

  try {
    const result = await session.run(
      `
      MATCH (s:Client {id: $senderId})-[:SENT|RECEIVED_BY]-(m:Message)-[:SENT|RECEIVED_BY]-(r:Client {id: $receiverId})
      RETURN m
      ORDER BY m.createdAt
      `,
      { senderId, receiverId }
    );

    const messages = result.records.map(record => record.get('m').properties);
    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Error fetching messages', error });
  } finally {
    await session.close();
  }
};

// Fonction pour rechercher des messages contenant une requête spécifique
exports.searchMessages = async (req, res) => {
  const session = driver.session();
  const { senderId, receiverId, query } = req.params;

  try {
    const result = await session.run(
      `
      MATCH (s:Client {id: $senderId})-[:SENT|RECEIVED_BY]-(m:Message)-[:SENT|RECEIVED_BY]-(r:Client {id: $receiverId})
      WHERE m.content CONTAINS $query
      RETURN m
      ORDER BY m.createdAt
      `,
      { senderId, receiverId, query }
    );

    const messages = result.records.map(record => record.get('m').properties);
    res.status(200).json(messages);
  } catch (error) {
    console.error('Error searching messages:', error);
    res.status(500).json({ message: 'Error searching messages', error: error.message });
  } finally {
    await session.close();
  }
};

// Fonction pour obtenir la liste des clients sauf le client courant
exports.getClients = async (req, res) => {
  const session = driver.session();
  const { clientId } = req.client;

  try {
    const result = await session.run(
      `
      MATCH (c:Client)
      WHERE c.id <> $clientId
      RETURN c.clientname AS clientname, c.email AS email
      `,
      { clientId }
    );

    const clients = result.records.map(record => ({
      clientname: record.get('clientname'),
      email: record.get('email'),
    }));

    res.status(200).json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ message: 'Error fetching clients', error });
  } finally {
    await session.close();
  }
};
