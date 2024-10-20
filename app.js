require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { dbConnect } = require('./utiles/dbConnect');
const app = express();
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');  
const jwt = require('jsonwebtoken');

const server = http.createServer(app);

app.use(express.json());

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001',

  ],
  credentials: true 
}));

app.get('/', (req, res) => {
  res.send('Hello World!');
});
app.use(express.json({ limit: '50mb' })); // Increase the limit
app.use(express.urlencoded({ limit: '50mb', extended: true })); 

dbConnect();

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


const io = socketIO(server, {
  cors: {
    origin: ['http://localhost:3000'], // Your frontend URL
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  },
});
// Map to store connected clients
const onlineClients = new Map();

// Socket.IO Authentication Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));

  jwt.verify(token, process.env.JWT_SECRET, (err, client) => {
    if (err) return next(new Error('Authentication error'));
    socket.clientData = client;
    next();
  });
});

io.on('connection', (socket) => {
  const clientId = socket.clientData.clientId;
  onlineClients.set(clientId, socket.id);
  console.log(`Client connected: ${clientId}`);

  socket.on('disconnect', () => {
    onlineClients.delete(clientId);
    console.log(`Client disconnected: ${clientId}`);
  });

  socket.on('chat message', (msg) => {
    const receiverSocketId = onlineClients.get(msg.receiver);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('chat message', msg);
    }
  });
});
const clientauthRoutes = require('./routes/clientauthRoutes');
app.use('/api/client/auth', clientauthRoutes);

const profileRoutes = require('./routes/profileRoutes');
app.use('/api/client', profileRoutes);


const messageRoutes = require('./routes/messageRoutes');
app.use('/api/messages', messageRoutes);
