const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');


// Route to get a client's profile
router.get('/profile/:clientId', profileController.getProfile);

// Route to create or update a client's profile
router.post('/profile/:clientId',  profileController.upsertProfile);

// Additional routes can be added here for delete or other operations

module.exports = router;
