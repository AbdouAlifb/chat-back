
const express = require('express');
const router = express.Router();
const { register, login, requestPassword, resetPassword ,getAllClients,deleteClientByEmail} = require('../controllers/clientauthController');

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', requestPassword);
router.post('/reset-password', resetPassword);
router.get('/users', getAllClients);
router.delete('/users/delete', deleteClientByEmail);

module.exports = router;
