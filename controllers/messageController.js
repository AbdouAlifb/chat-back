// controllers/messageController.js

const Message = require('../models/Message');
const Client = require('../models/client');
const path = require('path');


exports.sendMessage = async (req, res) => {
  try {
    // Récupération du corps de la requête
    const { message } = req.body;

    // Vérifiez si le message est présent
    if (!message) {
      return res.status(400).json({ error: 'Message data is required' });
    }

    // Parse le corps du message pour extraire les informations
    const {content, sender, receiver } = JSON.parse(message);

    // Création d'un nouvel objet de message
    const newMessageData = {
      sender,
      receiver,
      
    };
    
    if (content && content.trim()) {
      newMessageData.content = content.trim(); // Ajoute uniquement si le contenu est valide
    }
    // Vérification des fichiers envoyés
    if (req.file) {
      const fileExtension = path.extname(req.file.originalname).toLowerCase(); // Obtenir l'extension du fichier
      const filePath = req.file.path.replace(/\\/g, '/'); // Remplacez le séparateur de chemin pour la compatibilité

      if (fileExtension === '.pdf') {
        newMessageData.file = filePath; // Stocker le PDF dans le champ 'file'
      } else if (fileExtension === '.jpg' || fileExtension === '.jpeg' || fileExtension === '.png') {
        newMessageData.image = filePath; // Stocker l'image dans le champ 'image'
      }
    }

    // Création et enregistrement du nouveau message
    const newMessage = new Message(newMessageData);
    await newMessage.save();

    // Réponse réussie
    res.status(201).json({ message: 'Message sent successfully', data: newMessage });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// Fonction pour récupérer les messages entre deux clients
exports.getMessages = async (req, res) => {
  const { senderId, receiverId } = req.params;

  try {
    const messages = await Message.find({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId }
      ]
    }).sort({ createdAt: 1 }); // Trier par date croissante

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Error fetching messages', error });
  }
};



// Get messages between two clients
// exports.getMessages = async (req, res) => {
//   const { clientId } = req.client;
//   const { otherClientId } = req.params;


//   try {
//     const messages = await Message.find({
//       $or: [
//         { sender: clientId, receiver: otherClientId },
//         { sender: otherClientId, receiver: clientId },
//       ],
//     }).sort({ createdAt: 1 }); // Sort messages by creation time

//     res.status(200).json(messages);
//   } catch (error) {
//     console.error('Error fetching messages:', error);
//     res.status(500).json({ message: 'Error fetching messages', error });
//   }
// };

// Get list of all clients except the current one
exports.getClients = async (req, res) => {
  const { clientId } = req.client;

  try {
    const clients = await Client.find({ _id: { $ne: clientId } }).select('clientname email');
    res.status(200).json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ message: 'Error fetching clients', error });
  }
};


// Ajoutez cette nouvelle fonction dans messageController.js
exports.searchMessages = async (req, res) => {
  try {
    const { senderId, receiverId, query } = req.params;
    
    // Validate parameters
    if (!senderId || !receiverId || !query) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }

    const messages = await Message.find({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId }
      ],
      content: { $regex: query, $options: 'i' }
    })
    .sort({ createdAt: 1 })
    .populate('sender', 'clientname')
    .populate('receiver', 'clientname');

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error searching messages:', error);
    res.status(500).json({ message: 'Error searching messages', error: error.message });
  }
};