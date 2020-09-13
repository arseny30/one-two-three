// var app = require('express')();
// var http = require('http').createServer(app);
// var io = require('socket.io')(http);

var fs = require('fs');
var https = require('https');

var express = require('express');
var app = express();

var options = {
    key: fs.readFileSync('./file.pem'),
    cert: fs.readFileSync('./file.crt')
};

var server = https.createServer(options, app);
var io = require('socket.io')(server);


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
        socket.rdtRoomId = msg;
        socket.join(socket.rdtRoomId)
    });

    socket.on('rdt.play.onclick', (msg) => {
        console.log(`received play command on server`, msg)
        io.to(socket.rdtRoomId).emit('rdt.play.onclick', msg);
    });
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});