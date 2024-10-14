// models/message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'client', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'client', required: true },
  content: { type: String },
  file: { type: String },  // URL to the uploaded file/image
  image: { type: String }, // URL to the uploaded image
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);
