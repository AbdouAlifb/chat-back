const bcrypt = require('bcryptjs');
const crypto = require('crypto'); 
const { createToken } = require('../utiles/generateToken');
const { validate } = require('deep-email-validator');
const Client = require('../models/client');
// const Token = require('../models/token');
const { getAsyncTable } = require('../utiles/dbConnect');
const ClientToken = require('../models/ClientToken ');
const jwt = require('jsonwebtoken');
const { tableAsync } = require('../utiles/dbConnect');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: process.env.service,
    auth: {
        user: process.env.user, 
        pass: process.env.pass 
    }
});

// const neo4j = require('neo4j-driver');

// Connexion à la base de données Neo4j
// const driver = neo4j.driver(
//   process.env.NEO4J_URI,  // L'URI de votre base de données Neo4j
//   neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)  // Authentification
// );
exports.searchClients = async (req, res) => {
    const { query } = req.query;
    if (!query) return res.status(400).json({ message: 'No search query provided' });
  
    // Instead of MATCH (c:Client)... use a Hive SELECT statement
    // If you have a 'clients' table with 'clientname' and 'email' columns:
    const searchQuery = `SELECT clientname, email FROM clients WHERE clientname LIKE '%${query}%' OR email LIKE '%${query}%'`;
    
    hive.execute(searchQuery, function(err, data) {
      if (err) {
        console.error('Error searching clients:', err);
        return res.status(500).json({ message: 'Error searching clients', error: err.message });
      }
  
      // data will be an array of results
      // each row might come as an array of values depending on the driver used
      // Adjust parsing accordingly
      const clients = data.map(row => ({
        clientname: row.clientname, // or row[0] depending on driver format
        email: row.email           // or row[1]
      }));
      
      return res.status(200).json(clients);
    });
  };
  
  exports.getMe = async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authentication token is missing' });
    }
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const email = decoded.email;
  
      const clientByEmailTable = tableAsync('client_by_email');
      const emailData = await clientByEmailTable.get(email).catch(err => {
        if (err.message.includes('404')) return null; // Not found
        throw err;
      });
  
      if (!emailData) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      const clientId = emailData.columns['info:clientId']?.$;
      if (!clientId) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      const clientsTable = tableAsync('clients');
      const clientData = await clientsTable.get(clientId).catch(err => {
        if (err.message.includes('404')) return null; // Not found
        throw err;
      });
  
      if (!clientData) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      const user = {
        clientId: clientId,
        clientname: clientData.columns['info:clientname']?.$ || '',
        email: clientData.columns['info:email']?.$ || ''
      };
  
      res.status(200).json(user);
    } catch (error) {
      console.error('Error fetching user:', error.message);
      return res.status(401).json({ message: 'Invalid token', error: error.message });
    }
  };
const generatePassword = () => {
    return crypto.randomBytes(8).toString('hex'); 
};
exports.getAllClients = async (req, res) => {
    try {
      const clientsTable = tableAsync('clients');
      const rows = await clientsTable.scan();
  
      const clients = rows.map(row => ({
        clientId: row.key,
        clientname: row.columns['info:clientname']?.$ || '',
        email: row.columns['info:email']?.$ || '',
        createdAt: row.columns['info:createdAt']?.$ || '',
        updatedAt: row.columns['info:updatedAt']?.$ || ''
      })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
      res.status(200).json(clients);
    } catch (error) {
      console.error('Error fetching clients:', error.message);
      res.status(500).json({ message: 'Error fetching clients', error: error.message });
    }
  };

  exports.deleteClientByEmail = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });
  
    try {
      const clientByEmailTable = tableAsync('client_by_email');
      const emailData = await clientByEmailTable.get(email).catch(err => {
        if (err.message.includes('404')) return null; // Not found
        throw err;
      });
  
      if (!emailData) {
        return res.status(404).json({ message: 'Client not found' });
      }
  
      const clientId = emailData.columns['info:clientId']?.$;
      if (!clientId) {
        return res.status(404).json({ message: 'Client not found' });
      }
  
      const clientsTable = tableAsync('clients');
      await clientsTable.del(clientId);
  
      // Delete from 'client_by_email' and 'client_by_clientname'
      await clientByEmailTable.del(email);
  
      const clientByClientnameTable = tableAsync('client_by_clientname');
      const clientname = await clientsTable.get(clientId).then(data => data.columns['info:clientname']?.$).catch(() => null);
      if (clientname) {
        await clientByClientnameTable.del(clientname);
      }
  
      res.status(200).json({ message: 'Client deleted successfully' });
    } catch (error) {
      console.error('Error deleting client:', error.message);
      res.status(500).json({ message: 'Error deleting client', error: error.message });
    }
  };
// Fonction pour enregistrer un nouveau client
function generateAccessToken(email) {
    return jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });
  }
  function generateRefreshToken(email) {
    return jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '7d' });
  }

  exports.register = async (req, res) => {
    const { clientname, email, password } = req.body;
  
    if (!clientname || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
  
    try {
      // Await the async table references
      const clientsTable = await getAsyncTable('clients');
      const clientByEmailTable = await getAsyncTable('client_by_email');
      const clientByClientnameTable = await getAsyncTable('client_by_clientname');
  
      // Check if email already exists
      let existingEmail = null;
      try {
        existingEmail = await clientByEmailTable.get(email);
      } catch (err) {
        // We handle 404 inside getAsyncTable now, so err here is serious
        console.error('Error checking email:', err);
        return res.status(500).json({ message: 'Error checking email uniqueness', error: err.message });
      }
  
      if (existingEmail) {
        return res.status(409).json({ message: 'Email already exists' });
      }
  
      // Check if clientname already exists
      let existingClientname = null;
      try {
        existingClientname = await clientByClientnameTable.get(clientname);
      } catch (err) {
        // Similarly, handle any unexpected errors here
        console.error('Error checking clientname:', err);
        return res.status(500).json({ message: 'Error checking clientname uniqueness', error: err.message });
      }
  
      if (existingClientname) {
        return res.status(409).json({ message: 'Client name already exists' });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
      const timestamp = new Date().toISOString();
      const clientId = crypto.randomBytes(10).toString('hex');
  
      // HBase put requires an array of { column, $: value }
      const clientData = [
        { column: 'info:clientname', $: clientname },
        { column: 'info:email', $: email },
        { column: 'info:password', $: hashedPassword },
        { column: 'info:createdAt', $: timestamp },
        { column: 'info:updatedAt', $: timestamp }
      ];
  
      const emailData = [
        { column: 'info:clientId', $: clientId }
      ];
  
      const clientnameData = [
        { column: 'info:clientId', $: clientId }
      ];
  
      await clientsTable.put(clientId, clientData);
      await clientByEmailTable.put(email, emailData);
      await clientByClientnameTable.put(clientname, clientnameData);
  
      console.log('New client registered successfully');
      return res.status(201).json({ message: 'The new client has been added successfully!' });
  
    } catch (error) {
      console.error('Error during client registration:', error);
      return res.status(500).json({ message: 'Error registering the new client', error: error.message });
    }
  };

  exports.login = async (req, res) => {
    const { email, password } = req.body;
  
    // Input Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Missing email or password' });
    }
  
    console.log(`Login attempt for email: ${email}`);
  
    try {
      // Await the async table references
      const clientByEmailTable = await getAsyncTable('client_by_email');
      const clientsTable = await getAsyncTable('clients');
  
      // Fetch email data
      let emailData;
      try {
        emailData = await clientByEmailTable.get(email);
        console.log('Retrieved email data:', emailData);
      } catch (err) {
        console.error('Error fetching email data:', err);
        return res.status(500).json({ message: 'Error fetching client data', error: err.message });
      }
  
      if (!emailData || emailData.length === 0) {
        console.log('Client not found for email:', email);
        return res.status(404).json({ message: 'Client not found' });
      }
  
      // Extract clientId from emailData array
      const clientIdObj = emailData.find(col => col.column === 'info:clientId');
      const clientId = clientIdObj ? clientIdObj.$ : null;
  
      if (!clientId) {
        console.log('clientId not found for email:', email);
        return res.status(404).json({ message: 'Client not found' });
      }
  
      // Fetch client data using clientId
      let clientData;
      try {
        clientData = await clientsTable.get(clientId);
        console.log('Retrieved client data:', clientData);
      } catch (err) {
        console.error('Error fetching client data:', err);
        return res.status(500).json({ message: 'Error fetching client data', error: err.message });
      }
  
      if (!clientData || clientData.length === 0) {
        console.log('Client data not found for clientId:', clientId);
        return res.status(404).json({ message: 'Client not found' });
      }
  
      // Extract hashed password and clientname from clientData array
      const passwordObj = clientData.find(col => col.column === 'info:password');
      const hashedPassword = passwordObj ? passwordObj.$ : '';
  
      const clientnameObj = clientData.find(col => col.column === 'info:clientname');
      const clientname = clientnameObj ? clientnameObj.$ : '';
  
      // Compare passwords
      const isMatch = await bcrypt.compare(password, hashedPassword);
      if (!isMatch) {
        console.log('Invalid password attempt for email:', email);
        return res.status(401).json({ message: 'Invalid credentials' });
      }
  
      // Generate tokens
      const accessToken = generateAccessToken(email);
      const refreshToken = generateRefreshToken(email);
  
      // Set refresh token as HTTP-only cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'Strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
  
      console.log('Client logged in successfully:', clientname);
      return res.status(200).json({
        accessToken,
        client: {
          clientId,
          clientname,
          email,
        },
        message: 'Logged in successfully',
      });
  
    } catch (error) {
      console.error('Error during login:', error);
      return res.status(500).json({ message: 'Error logging in', error: error.message });
    }
  };
// exports.requestPassword = async (req, res) => {
//     const { email } = req.body;
//     try {
//         const client = await Client.findOne({ email });
//         if (!client) {
//             return res.status(404).json({ message: "Client does not exist" });
//         }
//         let token = await ClientToken.findOne({ clientId: client._id });
//         if (token) await token.deleteOne();

//         let resetToken = crypto.randomBytes(32).toString("hex");
//         const hash = await bcrypt.hash(resetToken, 12);

//         await new ClientToken({
//             clientId: client._id,
//             token: hash,
//             createdAt: Date.now(),
//         }).save();

//         const link = ${process.env.CLIENT_URL}/authentication/reset-password?token=${resetToken}&id=${client._id};
        
//         const mailOptions = {
//             receiverEmail: client.email,
//             subject: "Password Reset",
//             emailText: Hello ${client.clientname},<br><br>Please use the following link to reset your password: <a href="${link}">Reset Password</a><br><br>,
//             isHtml: true, 
//             title: "Password Reset"
//         };
//         setImmediate(() => exports.sendEmail(mailOptions, res));

//     } catch (error) {
//         console.error("Error during client password reset request:", error);
//         res.status(500).json({ message: "Internal server error" });
//     }
// };

// exports.resetPassword = async (req, res) => {
//     const { clientId, token, password } = req.body;
//     console.log(clientId, token, password );
//     try {
//         let passwordResetToken = await ClientToken.findOne({ clientId });

//         if (!passwordResetToken) {
//             return res.status(404).json({ message: 'Invalid or expired password reset token' });
//         }
//         const isValid = await bcrypt.compare(token, passwordResetToken.token);
//         if (!isValid) {
//             return res.status(404).json({ message: 'Invalid or expired password reset token' });
//         }
//         const hash = await bcrypt.hash(password, 12);
//         await Client.updateOne(
//             { _id: clientId },
//             { $set: { password: hash } },
//             { new: true }
//         );
//         await passwordResetToken.deleteOne();
//         const client = await Client.findById(clientId); 

//         const newToken = await createToken({
//             clientId
//         });
//         res.cookie('accessToken', newToken, {
//             httpOnly: true,
//             secure: true,
//             sameSite: 'None',
//             expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
//         });

//         res.status(200).json({ message: 'Password reset successfully', token: newToken,client });
//     } catch (error) {
//         res.status(500).json({ message: 'Error resetting password', error: error.message });
//     }
// };

// Send Email
exports.sendEmail = (mailOptions, res) => {
    const { receiverEmail, subject, emailText, title } = mailOptions;
    const htmlTemplate = `
        <!doctype html>
        <html lang="en">
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
                <title>Notification by Email</title>
                <style media="all" type="text/css">
                    body {
                        background-color: #f6f6f6;
                        font-family: 'Comic Sans MS', cursive, sans-serif;
                        -webkit-font-smoothing: antialiased;
                        font-size: 14px;
                        line-height: 1.6;
                        margin: 0;
                        padding: 0;
                        -ms-text-size-adjust: 100%;
                        -webkit-text-size-adjust: 100%;
                    }
                    table {
                        border-collapse: separate;
                        mso-table-lspace: 0pt;
                        mso-table-rspace: 0pt;
                        width: 100%;
                    }
                    table td {
                        font-family: 'Comic Sans MS', cursive, sans-serif;
                        font-size: 14px;
                        vertical-align: top;
                    }
                    .body {
                        background-color: #f6f6f6;
                        width: 100%;
                    }
                    .container {
                        display: block;
                        margin: 0 auto !important;
                        max-width: 580px;
                        padding: 10px;
                        width: auto !important;
                        width: 580px;
                    }
                    .content {
                        box-sizing: border-box;
                        display: block;
                        margin: 0 auto;
                        max-width: 580px;
                        padding: 10px;
                    }
                    .main {
                        background: #ffffff;
                        border-radius: 3px;
                        width: 100%;
                        border: 1px solid #cbcbcb;
                    }
                    .wrapper {
                        box-sizing: border-box;
                        padding: 20px;
                        text-align: center;
                    }
                    .footer {
                        clear: both;
                        padding-top: 10px;
                        text-align: center;
                        width: 100%;
                    }
                    .footer td, .footer p, .footer span, .footer a {
                        color: #999999;
                        font-size: 12px;
                        text-align: center;
                    }
                    h1 {
                        font-size: 22px;
                        font-weight: bold;
                        color: #333333;
                        text-align: center;
                        text-transform: uppercase;
                    }
                    p, ul, ol {
                        font-family: 'Comic Sans MS', cursive, sans-serif;
                        font-size: 14px;
                        font-weight: normal;
                        margin: 0;
                        margin-bottom: 15px;
                        color: #666666;
                    }
                    a {
                        color: #3498db;
                        text-decoration: underline;
                    }
                    .btn {
                        box-sizing: border-box;
                        width: 100%;
                    }
                    .btn table {
                        width: auto;
                    }
                    .btn table td {
                        background-color: #3498db;
                        border-radius: 5px;
                        text-align: center;
                    }
                    .btn a {
                        background-color: #3498db;
                        border: none;
                        border-radius: 5px;
                        box-sizing: border-box;
                        color: #ffffff;
                        cursor: pointer;
                        display: inline-block;
                        font-size: 14px;
                        font-weight: bold;
                        margin: 0;
                        padding: 12px 25px;
                        text-decoration: none;
                        text-transform: capitalize;
                    }
                    .preheader {
                        color: transparent;
                        display: none;
                        height: 0;
                        max-height: 0;
                        max-width: 0;
                        opacity: 0;
                        overflow: hidden;
                        mso-hide: all;
                        visibility: hidden;
                        width: 0;
                    }
                </style>
            </head>
            <body>
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="body">
                <tr>
                    <td>&nbsp;</td>
                    <td class="container">
                        <div class="content">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="main">
                                <tr>
                                    <td class="wrapper">
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                        
                                            <tr>
                                                <td>
                                                    <h1>${title}</h1>
                                                    <p style="text-align: center;">${emailText}</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                        </div>
                    </td>
                    <td>&nbsp;</td>
                </tr>
            </table>
        </body>
        </html>
    `;

    const emailOptions = {
        to: receiverEmail,
        subject: subject,
        html: htmlTemplate
    };
    
    transporter.sendMail(emailOptions, (error, info) => {
        if (error) {
            console.log(error);
            
            return res.status(500).json({ message: 'Error sending email', error });
     
        }else {
            return res.status(200).json({ message: 'Email sent successfully' });
        }
    });
 
    
};