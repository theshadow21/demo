const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./ul/messages');
const {  userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./ul/users');


const app = express();
const server = http.createServer(app);
const io = socketio(server);

//set static folder
app.use(express.static(path.join(__dirname, 'public')));

const botname = 'Bot';

//run when client connects
io.on('connection', socket => {
    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room);

        socket.join(user.room);
        //Show danh sach room dang co:
        //console.log(socket.adapter.rooms);

        //Welcome current user
        socket.emit('server2client', formatMessage(botname,'Chào mừng bạn đến cuộc vui!'));

        //Broadcast when user connects
        socket.broadcast.to(user.room).emit('server2client', formatMessage(botname,`${user.username} đã tham gia nhậu`));

        //Send users and room in4
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });

    //listen for chatMessage
    socket.on('client2server', (msg) => {
        const user = getCurrentUser(socket.id);

        io.to(user.room).emit('server2client', formatMessage(user.username, msg));
    });

    //Runs when client disconnects
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if(user) {
            io.to(user.room).emit('server2client', formatMessage(botname,`${user.username} đã rời khỏi cuộc vui !`));

            //Send users and room in4
            io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
            });
        }
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
