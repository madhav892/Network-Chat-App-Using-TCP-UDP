require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const cors = require('cors');
const net = require('net');

const app = express();
const PORT = process.env.PORT || 8000;

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Create user and message schema
const userSchema = new mongoose.Schema({
    username: String,
    email: String,
});

const messageSchema = new mongoose.Schema({
    sender: String,
    content: String,
    timestamp: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);
const Message = mongoose.model('Message', messageSchema);

// Email setup using Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL, // Replace with your frontend URL
    methods: ['GET', 'POST'],
    credentials: true,
}));
app.use(express.json());

// Create HTTP server and integrate socket.io
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: process.env.FRONTEND_URL,
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

// Handle WebSocket connections
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Handle chat messages
    socket.on('send_message', async (data) => {
        try {
            const newMessage = new Message(data);
            await newMessage.save();
            io.emit('receive_message', data);
        } catch (error) {
            console.error('Error saving message:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Set up TCP server for direct TCP communication
const tcpServer = net.createServer((socket) => {
    console.log('New TCP connection:', socket.remoteAddress);

    socket.on('data', (data) => {
        console.log('Received TCP data:', data.toString());
    });

    socket.on('close', () => {
        console.log('TCP connection closed:', socket.remoteAddress);
    });
});

tcpServer.listen(6000, () => {
    console.log('TCP server listening on port 6000');
});

// Endpoint to register a new user and send a welcome email
app.post('/register', async (req, res) => {
    const { username, email } = req.body;

    try {
        const newUser = new User({ username, email });
        await newUser.save();

        const mailOptions = {
            from: 'anujtiwari4454@gmail.com',
            to: email,
            subject: 'Welcome to ChatApp',
            text: `Hello ${username}, welcome to our chat application!`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log('Error sending email:', error);
                return res.status(500).json({ message: 'Error sending email', error });
            }
            res.status(200).json({ message: 'User registered and email sent', info });
        });
    } catch (error) {
        res.status(500).json({ message: 'Error registering user', error });
    }
});

// Start the HTTP server
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
