const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const secret = 'your-secret-key';  // Ganti dengan key yang lebih aman

// MongoDB setup
mongoose.connect('mongodb://localhost:27017/hackerverse', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB...'))
  .catch((err) => console.error('Could not connect to MongoDB...', err));

// Buat model User
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});

const User = mongoose.model('User', userSchema);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// API Register
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;
  
  const existingUser = await User.findOne({ username });
  if (existingUser) return res.status(400).json({ msg: 'Username already exists' });
  
  const user = new User({ username, password });
  await user.save();
  res.json({ msg: 'Registered successfully' });
});

// API Login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  const user = await User.findOne({ username, password });
  if (!user) return res.status(401).json({ msg: 'Invalid credentials' });
  
  const token = jwt.sign({ username: user.username }, secret, { expiresIn: '1h' });
  res.json({ msg: 'Login successful', token });
});

// Middleware untuk verifikasi JWT
function verifyToken(req, res, next) {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ msg: 'Access denied' });

  jwt.verify(token, secret, (err, decoded) => {
    if (err) return res.status(400).json({ msg: 'Invalid token' });
    req.user = decoded;
    next();
  });
}

// Socket.IO Logic (Multiple Rooms)
const rooms = {}; // Menyimpan room yang ada

io.on('connection', (socket) => {
  socket.on('joinRoom', (username, room) => {
    socket.join(room);
    console.log(`${username} joined room: ${room}`);
    io.to(room).emit('chat', { user: 'System', msg: `${username} has joined the room!` });
  });

  socket.on('chat', (data) => {
    io.to(data.room).emit('chat', data);
  });
});

// Jalankan Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
``

