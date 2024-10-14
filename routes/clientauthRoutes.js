
const express = require('express');
const router = express.Router();

// Define /me route to get current user info
const { register, login,getMe, requestPassword, resetPassword ,getAllClients,deleteClientByEmail} = require('../controllers/clientauthController');

router.post('/register', register);
router.post('/login', login);
router.get('/me', getMe);

router.post('/forgot-password', requestPassword);
router.post('/reset-password', resetPassword);
router.get('/users', getAllClients);
router.delete('/users/delete', deleteClientByEmail);

module.exports = router;
