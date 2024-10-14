// controllers/messageController.js

const Message = require('../models/Message');
const Client = require('../models/client');

// Send a message
exports.sendMessage = async (req, res) => {
    const { receiverId, content } = req.body;
    const senderId = req.client.id;
    console.log('req.client:', req.client); 

  try {
    const receiver = await Client.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    const message = new Message({
      sender: senderId,
      receiver: receiverId,
      content,
    });

    await message.save();

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Error sending message', error });
  }
};

// Get messages between two clients
exports.getMessages = async (req, res) => {
  const { clientId } = req.client;
  const { otherClientId } = req.params;

  try {
    const messages = await Message.find({
      $or: [
        { sender: clientId, receiver: otherClientId },
        { sender: otherClientId, receiver: clientId },
      ],
    }).sort({ createdAt: 1 }); // Sort messages by creation time

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Error fetching messages', error });
  }
};

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
