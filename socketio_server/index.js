var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    console.log('new connection');

    socket.on('my_ping', (msg) => {
        console.log('message: ' + msg);
        socket.emit('my_pong', 'pong!');
    });

    socket.on('setRoomId', (msg) => {
        console.log('setRoomId', msg);
    });

    socket.on('rdt.play.onclick', (msg) => {
        console.log(`received play command on server`, msg)
        io.emit('rdt.play.onclick', msg);
    });
});

http.listen(3000, () => {
    console.log('listening on *:3000');
});