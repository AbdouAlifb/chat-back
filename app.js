require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { dbConnect } = require('./utiles/dbConnect'); // Database connection utility
const app = express();
const http = require('http');
const { Server } = require('socket.io'); // Import Socket.IO for real-time communication
const path = require('path');

// Create HTTP server
const server = http.createServer(app);

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'], // Allowed front-end origins
    credentials: true,
  },
});

// Middleware to parse JSON requests
app.use(express.json());

// CORS configuration for front-end
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'], // Frontend URLs
  credentials: true, // Enable sending cookies and auth tokens
}));

// Connect to MongoDB
dbConnect();

// // Initialize routes for user authentication
const clientauthRoutes = require('./routes/clientauthRoutes');
app.use('/api/client/auth', clientauthRoutes);
app.use('', clientauthRoutes);


// Socket.IO logic for real-time messaging
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Listen for incoming chat messages from clients
  socket.on('chat message', (msg) => {
    // Broadcast the message to all connected clients
    io.emit('chat message', msg);
  });

  // Handle user disconnects
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Server listen port
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
