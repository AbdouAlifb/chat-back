const bcrypt = require('bcryptjs');
const crypto = require('crypto'); 
const { createToken } = require('../utiles/generateToken');
const { validate } = require('deep-email-validator');
const Client = require('../models/client');
// const Token = require('../models/token');
const ClientToken = require('../models/ClientToken ');

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: process.env.service,
    auth: {
        user: process.env.user, 
        pass: process.env.pass 
    }
});

exports.getMe = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1]; // Get token from the header
  
    if (!token) {
      return res.status(401).json({ message: 'Authentication token is missing' });
    }
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET); // Decode the token to get the user ID
      const user = await Client.findById(decoded._id); // Find user by ID
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Return the authenticated user's information
      res.status(200).json(user);
    } catch (error) {
      res.status(401).json({ message: 'Invalid token' });
    }
  };

const generatePassword = () => {
    return crypto.randomBytes(8).toString('hex'); 
};
exports.getAllClients = async (req, res) => {
    try {
        const clients = await Client.find().sort({ createdAt: -1 });
        res.status(200).json(clients);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching clients', error: error.message });
    }
};
exports.deleteClientByEmail = async (req, res) => {
    const { email } = req.body;
    try {
        const client = await Client.findOneAndDelete({ email });
        if (!client) {
            return res.status(404).json({ message: 'client not found' });
        }
        res.status(200).json({ message: 'client deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting client', error: error.message });
    }
};
exports.register = async (req, res) => {

    const { clientname, email, password } = req.body;  // Include password in the body
    console.log("Registering new client with email:", email ,clientname , password ); 
    try {
        const clientExists = await Client.findOne({ email });
        if (clientExists) {
            return res.status(409).json({ message: 'Email already exists' });
        }
        const clientExistsByClientname = await Client.findOne({ clientname });
        if (clientExistsByClientname) {
            return res.status(401).json({ message: 'Client name already exists' });
        }
        // const validationResult = await validate(email);
        // if (!validationResult.valid) {
        //     return res.status(400).json({ message: 'Email is not valid. Please try again!' });
        // }
        
        const client = new Client({
            clientname,
            email,
            password,  // Use the hashed password
        });        
        await client.save();
        res.status(200).json({ message: 'The new Client has been added successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Error registering the new client', error: error.message });
    }
};


exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const client = await Client.findOne({ email });
        if (!client) {
            console.log('Login attempt failed - client not found:', email);
            return res.status(404).json({ message: 'client not found' });
        }

        const isMatch = await bcrypt.compare(password, client.password);
        if (!isMatch) {
            console.log('Login attempt failed - invalid credentials:', email);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = await createToken({
            clientId: client._id,
        });
        // const token = jwt.sign(
        //     { id: client._id },
        //     process.env.JWT_SECRET,
        //     { expiresIn: '1h' }
        //   );

        res.cookie('accessToken', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'None',
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });
        console.log('Client logged in successfully:', client.clientname);
        res.status(200).json({
            token,
            client: {
                clientId: client._id,
                clientname: client.clientname,
                email: client.email,
            },
            message: 'Logged in successfully'
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
};

exports.requestPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const client = await Client.findOne({ email });
        if (!client) {
            return res.status(404).json({ message: "Client does not exist" });
        }
        let token = await ClientToken.findOne({ clientId: client._id });
        if (token) await token.deleteOne();

        let resetToken = crypto.randomBytes(32).toString("hex");
        const hash = await bcrypt.hash(resetToken, 12);

        await new ClientToken({
            clientId: client._id,
            token: hash,
            createdAt: Date.now(),
        }).save();

        const link = `${process.env.CLIENT_URL}/authentication/reset-password?token=${resetToken}&id=${client._id}`;
        
        const mailOptions = {
            receiverEmail: client.email,
            subject: "Password Reset",
            emailText: `Hello ${client.clientname},<br><br>Please use the following link to reset your password: <a href="${link}">Reset Password</a><br><br>`,
            isHtml: true, 
            title: "Password Reset"
        };
        setImmediate(() => exports.sendEmail(mailOptions, res));

    } catch (error) {
        console.error("Error during client password reset request:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.resetPassword = async (req, res) => {
    const { clientId, token, password } = req.body;
    console.log(clientId, token, password );
    try {
        let passwordResetToken = await ClientToken.findOne({ clientId });

        if (!passwordResetToken) {
            return res.status(404).json({ message: 'Invalid or expired password reset token' });
        }
        const isValid = await bcrypt.compare(token, passwordResetToken.token);
        if (!isValid) {
            return res.status(404).json({ message: 'Invalid or expired password reset token' });
        }
        const hash = await bcrypt.hash(password, 12);
        await Client.updateOne(
            { _id: clientId },
            { $set: { password: hash } },
            { new: true }
        );
        await passwordResetToken.deleteOne();
        const client = await Client.findById(clientId); 

        const newToken = await createToken({
            clientId
        });
        res.cookie('accessToken', newToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'None',
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });

        res.status(200).json({ message: 'Password reset successfully', token: newToken,client });
    } catch (error) {
        res.status(500).json({ message: 'Error resetting password', error: error.message });
    }
};

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
