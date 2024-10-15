// controllers/messageController.js

const Message = require('../models/Message');
const Client = require('../models/client');

exports.sendMessage = async (req, res) => {
  try {
    const { receiver, content,sender } = req.body;

    // Assuming the sender is the logged-in user
    // const sender = req.sender;

    console.log('Sender (client ID):', sender); // Log sender ID
    console.log('Receiver (selectedUser ID):', receiver); // Log receiver ID
    console.log('Message content:', content); // Log message content

    if (!sender) {
      return res.status(400).json({ error: 'Sender is required' });
    }

    if (!receiver || !content) {
      return res.status(400).json({ error: 'Receiver and content are required' });
    }

    const newMessage = new Message({
      sender,
      receiver,
      content,
    });

    await newMessage.save();

    res.status(201).json({ message: 'Message sent successfully', data: newMessage });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Server error' });
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
