require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { dbConnect } = require('./utiles/dbConnect');
const app = express();
const http = require('http');
const path = require('path');


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


dbConnect();

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

