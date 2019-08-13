var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

var chatLog = [];
var pushLog = {};

var legend = [
    "open",
    "blocked",
    "orange",
    "green",
    "stone"
]

var map = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0,
    0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0,
    0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0,
    0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0,
    0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0,
    2, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 3,
    2, 0, 1, 0, 1, 0, 1, 0, 4, 0, 1, 0, 1, 0, 1, 0, 3,
    2, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 3,
    0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0,
    0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0,
    0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0,
    0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0,
    0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
]

var neighborOffsets = [
    -17,
    -1, 1,
    17
]

function GenerateClassMap() {
    var classMap = [];
    for (var i = 0; i < map.length; i++) {
        var _class = legend[map[i]];
        for (var n = 0; n < neighborOffsets.length; n++) {
            if (i + neighborOffsets[n] < 0 || i + neighborOffsets[n] > map.length - 1) {
                continue;
            }
            if (map[i + neighborOffsets[n]] == 4 && map[i] == 0) {
                _class += " free-neighbor";
                break;
            }
        }
        classMap.push(_class);
    }
    return classMap;
}

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

io.on('connection', function (socket) {
    var id = socket.id;
    var ip = socket.conn.remoteAddress;
    var team = parseInt(ip.replace(/\D/g,'')) % 2;
    console.log("user connected - " + ip + " on team " + team);
    io.to(id).emit('set team', team);
    io.to(id).emit('load level', GenerateClassMap())

    socket.on('chat message', function(name, msg){
        var teamClass = ['orange', 'green'][team];
        io.emit('chat message', teamClass, name, msg);
    });

    socket.on('push', function (toId) {
        var time = Date.now();

        var canPush = true;
        var pushMessage = "Moved stone to cell #" + toId + ". Please wait 10 seconds for your next push.";
        var classMap = GenerateClassMap();

        if (!classMap[toId].includes('free-neighbor')) {
            canPush = false;
            pushMessage = "Invalid destination. Refresh page if issue persists.";
        }
        else {
            if (ip in pushLog) {
                _time = pushLog[ip][1];
                if (time - _time < 10000) {
                    canPush = false;
                    var timeLeft = Math.ceil((10000 - (time - _time)) * 0.001);
                    pushMessage = "Too close to last push. Next push unlocked in " + timeLeft + " seconds.";
                }
            }
        }

        if (canPush) {
            var curStonePos = map.indexOf(4);
            map[curStonePos] = 0;
            map[toId] = 4;

            io.emit('load level', GenerateClassMap());

            pushLog[ip] = [toId, time];
        }

        var messageType = 'success';
        if(!canPush){
            messageType = 'warning';
        }
        io.to(id).emit('push message', pushMessage, messageType);
    });

    socket.on('disconnect', function () {
        console.log('user disconnected');
    });
});