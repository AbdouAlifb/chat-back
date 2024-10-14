// controllers/chatController.js
const Message = require('../models/message');

// Get chat messages between two users
exports.getMessages = async (req, res) => {
  const { user1, user2 } = req.params;
  try {
    const messages = await Message.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 }
      ]
    }).sort('createdAt');
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching messages' });
  }
};

// Send new message
exports.sendMessage = async (req, res) => {
  const { sender, receiver, content, file, image } = req.body;
  try {
    const newMessage = new Message({
      sender,
      receiver,
      content,
      file,
      image
    });
    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ error: 'Error sending message' });
  }
};
