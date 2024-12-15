const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { getAsyncTable } = require('../utiles/dbConnect');

// Controller to send a new message
exports.sendMessage = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message data is required' });
    }

    const { content, sender, receiver } = JSON.parse(message);
    let filePath = null;
    let imagePath = null;

    if (req.file) {
      const fileExtension = path.extname(req.file.originalname).toLowerCase();
      const filePathTemp = req.file.path.replace(/\\/g, '/');
      if (fileExtension === '.pdf') {
        filePath = filePathTemp;
      } else if (['.jpg', '.jpeg', '.png'].includes(fileExtension)) {
        imagePath = filePathTemp;
      }
    }

    const messagesTable = await getAsyncTable('messages');
    const messageId = uuidv4();
    const createdAt = new Date().toISOString();

    const messageData = [
      { column: 'info:sender', $: sender },
      { column: 'info:receiver', $: receiver },
      { column: 'info:content', $: content || '' },
      { column: 'info:file', $: filePath || '' },
      { column: 'info:image', $: imagePath || '' },
      { column: 'info:createdAt', $: createdAt },
      { column: 'info:updatedAt', $: createdAt }
    ];

    await messagesTable.put(messageId, messageData);
    res.status(201).json({ message: 'Message sent successfully', data: messageData });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// Controller to get messages between two users
exports.getMessages = async (req, res) => {
  const { senderId, receiverId } = req.params;

  if (!senderId || !receiverId) {
    return res.status(400).json({ error: 'Both senderId and receiverId are required.' });
  }

  try {
    const messagesTable = await getAsyncTable('messages');
    const rows = await messagesTable.scan();

    // Log the rows to understand the structure
    console.log('Scanned Rows:', JSON.stringify(rows, null, 2));

    // Group rows by key
    const groupedMessages = rows.reduce((acc, row) => {
      if (!acc[row.key]) {
        acc[row.key] = { messageId: row.key };
      }
      const columnName = row.column.split(':')[1];
      acc[row.key][columnName] = row.$;
      return acc;
    }, {});

    const messages = Object.values(groupedMessages)
      .filter(message => {
        const sender = message.sender;
        const receiver = message.receiver;
        return (sender === senderId && receiver === receiverId) ||
               (sender === receiverId && receiver === senderId);
      })
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    res.status(200).json(messages);

  } catch (error) {
    console.error('Error fetching messages:', error.message);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};
// Controller to search messages containing a specific query
exports.searchMessages = async (req, res) => {
  const { senderId, receiverId, query } = req.params;

  try {
    const messagesTable = await getAsyncTable('messages');
    const rows = await messagesTable.scan();

    // Use reduce to group rows by message key
    const groupedMessages = rows.reduce((acc, row) => {
      if (!acc[row.key]) {
        acc[row.key] = { messageId: row.key };
      }
      const columnName = row.column.split(':')[1];
      acc[row.key][columnName] = row.$;
      return acc;
    }, {});

    const messages = Object.values(groupedMessages)
      .filter(message => {
        const content = message.content || '';
        const sender = message.sender;
        const receiver = message.receiver;
        return content.includes(query) &&
               ((sender === senderId && receiver === receiverId) ||
                (sender === receiverId && receiver === senderId));
      })
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    res.status(200).json(messages);

  } catch (error) {
    console.error('Error searching messages:', error.message);
    res.status(500).json({ message: 'Error searching messages', error: error.message });
  }
};

// Controller to get all clients except the current one
exports.getClients = async (req, res) => {
  const { clientId } = req.client;
  try {
    const clientsTable = await getAsyncTable('clients');
    const rows = await clientsTable.scan();
  
    const clients = rows
      .filter(row => row.key !== clientId)
      .map(row => ({
        clientname: row.find(col => col.column === 'info:clientname').$,
        email: row.find(col => col.column === 'info:email').$
      }));

    res.status(200).json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ message: 'Error fetching clients', error });
  }
};