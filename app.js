var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

var chatLog = [];
var pushLog = {};

var inGame = true;

var orangeScore = 0;
var greenScore = 0;

var legend = [
    "open",
    "blocked",
    "orange",
    "green",
    "stone"
]

const mapBase = [
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

var map = [...mapBase];

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
            if (i % 17 == 0 && neighborOffsets[n] == -1) {
                continue;
            }
            if (i % 17 == 16 && neighborOffsets[n] == 1) {
                continue;
            }
            if (map[i + neighborOffsets[n]] == 4 && map[i] != 1) {
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
    var ipHash = '';
    for (var i = 0; i < ip.length; i++) {
        ipHash += '' + (ip.charCodeAt(i) % 9);
    }

    var team = parseInt(ipHash[0]) % 2;
    console.log("user connected - " + id + " @ " + ipHash + " on team " + ['orange', 'green'][team]);
    io.to(id).emit('set team', team);
    io.to(id).emit('load level', GenerateClassMap());
    io.emit('sync score', orangeScore, greenScore);

    var logLength = Math.min(chatLog.length, 8);
    for (var i = 0; i < logLength; i++) {
        var log = chatLog[chatLog.length - logLength + i];
        io.to(id).emit('chat message', log[0], log[1], log[2]);
    }
    io.to(id).emit('push message', "Welcome to 'Push', a game of patience, comeradery, and determination. The goal is to push the 'stone' into your team's goal. You can see your team color at the bottom of the screen where you can set your name. Each player can only push the stone once every 10 seconds so you'll have to work with your team mates to secure a victory.", 'info');
    if (inGame) {
        pushLog[id] = [map.indexOf(4), Date.now()];
    }
    else {
        io.to(id).emit('push message', "This game session recently ended. A new match will be starting very soon.", "info");
    }

    socket.on('chat message', function (name, msg) {
        var teamClass = ['orange', 'green'][team];
        chatLog.push([teamClass, name, msg]);
        io.emit('chat message', teamClass, name, msg);
    });

    socket.on('push', function (toId) {
        if (!inGame) {
            io.to(id).emit('push message', "This game session recently ended. A new match will be starting very soon.", "warning");
            return;
        }

        var time = Date.now();

        var canPush = true;
        var pushMessage = "Moved stone to cell #" + toId + ". Please wait 10 seconds for your next push.";
        var classMap = GenerateClassMap();

        if (!classMap[toId].includes('free-neighbor')) {
            canPush = false;
            pushMessage = "Invalid destination. Refresh page if issue persists.";
        }
        else {
            if (id in pushLog) {
                _time = pushLog[id][1];
                if (time - _time < 10000) {
                    canPush = false;
                    var timeLeft = Math.ceil((10000 - (time - _time)) * 0.001);
                    pushMessage = "Too close to last push. Next push unlocked in " + timeLeft + " seconds.";
                }
            }
        }

        var destType = map[toId];
        if (canPush) {
            var curStonePos = map.indexOf(4);
            map[curStonePos] = 0;
            map[toId] = 4;

            io.emit('load level', GenerateClassMap());
            socket.broadcast.emit('push message', "Stone moved to cell #" + toId + ".", 'info');

            pushLog[id] = [toId, time];
        }

        var messageType = 'success';
        if (!canPush) {
            messageType = 'warning';
        }
        io.to(id).emit('push message', pushMessage, messageType);

        if (canPush && (destType == 2 || destType == 3)) {
            pushLog = {};
            var winner = ['Orange', 'Green'][destType - 2];

            if (destType == 2) {
                orangeScore += 1;
            }
            else {
                greenScore += 1;
            }
            io.emit('sync score', orangeScore, greenScore);
            io.emit('push message', winner + " team wins! New match starting soon.", winner.toLowerCase());
            inGame = false;
            setTimeout(function () {
                map = [...mapBase];
                io.emit('load level', GenerateClassMap());
                inGame = true;
            }, 10000);
        }
    });

    socket.on('disconnect', function () {
        console.log('user disconnected');
    });
});