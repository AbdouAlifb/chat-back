const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'client', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'client', required: true },
    content: { type: String, required: false },
    file: { type: String, required: false  }, 
    image: { type: String, required: false } 
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);
