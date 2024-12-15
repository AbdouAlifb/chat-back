// pseudo-model for structure and default values
// const { v4: uuidv4 } = require('uuid');
class Message {
  constructor({ sender, receiver, content, file, image }) {
    this.id = uuidv4();  // Ensure unique IDs
    this.sender = sender;
    this.receiver = receiver;
    this.content = content || '';
    this.file = file || '';
    this.image = image || '';
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }
}

module.exports = Message;