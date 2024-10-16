// routes/messageRoutes.js

const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Get all clients (for user list)
router.get('/clients',authenticateToken , messageController.getClients);

// Send a message
router.post('/send', authenticateToken, messageController.sendMessage);

// Get messages between two clients
router.get('/:otherClientId',authenticateToken, messageController.getMessages);

module.exports = router;
