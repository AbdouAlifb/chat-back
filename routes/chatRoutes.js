// routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const { getMessages, sendMessage } = require('../controllers/chatController');

// Fetch all messages between two users
router.get('/messages/:user1/:user2', getMessages);

// Send a new message
router.post('/message', sendMessage);

module.exports = router;
