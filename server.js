const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {
    userJoin,
    getCurrentUser,
    userLeav,
    getRoomUsers
} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

const botName = 'CahtCore Bot';

// Run when client connect
io.on('connection', socket => {
    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room);

        socket.join(user.room);
        
        // Welcome message
        socket.emit('message', formatMessage(botName, 'Welcome to charoom!'));

        // Broadcast when user connect
        socket.broadcast
            .to(user.room)
            .emit(
                'message', 
                formatMessage(botName, `${user.username} has joined to chat`)
            );

        // Send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });

    // Listen chat message
    socket.on('chatMessage', (msg) => {
        const user = getCurrentUser(socket.id);

        io.emit('message', formatMessage(user.username, msg)); 
    });

    // Runs when client disconnect
    socket.on('disconnect', () => {
        const user = userLeav(socket.id);

        if (user) {
            io.to(user.room).emit(
                'message', 
                formatMessage(botName, `${user.username} has left the caht`)
            );

            // Send users and room info
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
        }
    });
});

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));