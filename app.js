const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const PORT = 3000;

app.use(express.static('public'));

io.on('connection', (socket) => {
  socket.on('join-room', ({ username, room }) => {
    socket.join(room);
    socket.username = username;
    socket.room = room;
    socket.to(room).emit('chat-msg', { sender: 'System', text: `${username} joined the room.` });
  });

  socket.on('chat-msg', (msg) => {
    io.to(socket.room).emit('chat-msg', {
      sender: socket.username,
      text: msg
    });
  });

  socket.on('disconnect', () => {
    if (socket.username && socket.room) {
      socket.to(socket.room).emit('chat-msg', { sender: 'System', text: `${socket.username} left the room.` });
    }
  });
});

http.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
