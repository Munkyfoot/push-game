var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

var history = [];

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/client/index.html');
});

app.get('/style', function (req, res) {
    res.sendFile(__dirname + '/client/style/stylesheet.css');
});

app.get('/script', function (req, res) {
    res.sendFile(__dirname + '/client/scripts/main.js');
});

app.get('/jquery', function (req, res) {
    res.sendFile(__dirname + '/jquery-3.4.1.min.js');
});

http.listen(8000, function () {
    console.log('Server running at http://localhost:8000');
});