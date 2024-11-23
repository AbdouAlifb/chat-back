const { v4: uuidv4 } = require('uuid');

class Message {
  constructor({ sender, receiver, content = null, file = null, image = null }) {
    this.id = uuidv4(); // Generate a unique ID for the message
    this.sender = sender;
    this.receiver = receiver;
    this.content = content;
    this.file = file;
    this.image = image;
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }
}

module.exports = Message;
