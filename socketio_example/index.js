var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    console.log('a user connected');
    io.emit('new user connected', socket.id);

    socket.on('abcd', (msg) => {
        console.log('message: ' + msg);
        socket.emit('pong', 'pong!');
    });
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

io.on('connection', (socket) => {
    socket.on('chat message', (msg) => {
        console.log('message: ' + msg);
        socket.broadcast.emit('chat message', {'id': socket.id, 'msg': msg});
        console.log('here!!!!')
    });
});

http.listen(3000, () => {
    console.log('listening on *:3000');
});
