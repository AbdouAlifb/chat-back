// routes/messageRoutes.js
const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticateToken } = require('../middleware/authMiddleware');
const upload = require('../middleware/multerConfig'); 

// Make sure all paths and middleware are correct
router.post('/send', upload.single('file'), messageController.sendMessage);
router.get('/clients', messageController.getClients);
router.get('/:senderId/:receiverId', messageController.getMessages);
router.get('/search/:senderId/:receiverId/:query', messageController.searchMessages);

module.exports = router;
// Get messages between two clients
// router.get('/:otherClientId', messageController.getMessages);


// routes/messageRoutes.js

// Search messages with pagination
// router.get('/search/:senderId/:receiverId', messageController.searchMessages);
// Dans routes/messageRoutes.js

// Serve the uploads folder
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



