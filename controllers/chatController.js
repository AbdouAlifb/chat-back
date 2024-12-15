const { client, getAsyncTable } = require('../utiles/dbConnect');
exports.getMessages = async (req, res) => {
  const { user1, user2 } = req.params;
  try {
    const messagesTable = await getAsyncTable('messages');
    const rows = await messagesTable.scan();

    const messages = rows
      .filter(row => {
        const columnsByKey = {
          sender: row.find(col => col.column === 'info:sender').$,
          receiver: row.find(col => col.column === 'info:receiver').$,
        };
        return (
          (columnsByKey.sender === user1 && columnsByKey.receiver === user2) ||
          (columnsByKey.sender === user2 && columnsByKey.receiver === user1)
        );
      })
      .map(row => {
        return {
          messageID: row.key,
          sender: row.find(col => col.column === 'info:sender').$,
          receiver: row.find(col => col.column === 'info:receiver').$,
          content: row.find(col => col.column === 'info:content').$ || '',
          file: row.find(col => col.column === 'info:file').$ || '',
          image: row.find(col => col.column === 'info:image').$ || '',
          createdAt: row.find(col => col.column === 'info:createdAt').$,
        };
      })
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error.message);
    res.status(500).json({ error: 'Error fetching messages' });
  }
};

exports.sendMessage = async (req, res) => {
  const { sender, receiver, content, file, image } = req.body;
  try {
    const messagesTable = await getAsyncTable('messages');
    const newMessage = new Message({ sender, receiver, content, file, image });

    const messageId = newMessage.id;  // Use unique ID for row key
    const messageData = [
      { column: 'info:sender', $: newMessage.sender },
      { column: 'info:receiver', $: newMessage.receiver },
      { column: 'info:content', $: newMessage.content },
      { column: 'info:file', $: newMessage.file },
      { column: 'info:image', $: newMessage.image },
      { column: 'info:createdAt', $: newMessage.createdAt },
      { column: 'info:updatedAt', $: newMessage.updatedAt },
    ];

    await messagesTable.put(messageId, messageData);

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error sending message:', error.message);
    res.status(500).json({ error: 'Error sending message' });
  }
};