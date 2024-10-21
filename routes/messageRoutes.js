// routes/messageRoutes.js

const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticateToken } = require('../middleware/authMiddleware');
const upload = require('../middleware/multerConfig'); 
// Get all clients (for user list)
router.get('/clients' , messageController.getClients);

// Send a message
router.post('/send', upload.single('file'), messageController.sendMessage);
router.get('/:senderId/:receiverId', messageController.getMessages);
// Get messages between two clients
// router.get('/:otherClientId', messageController.getMessages);


module.exports = router;
