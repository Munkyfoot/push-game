$(function () {
    var waiting = false;
    var neighbors = [];
    var socket = io();
    socket.on('load level', function (classMap) {
        neighbors = [];
        $(".cell").remove();
        for (var c = 0; c < classMap.length; c++) {
            var _class = classMap[c];
            if (waiting && _class.includes('free-neighbor')) {
                _class = 'open';
                neighbors.push(c);
            }

            var flexBasis = 100 / Math.sqrt(classMap.length);
            $('#map').append("<div id='" + c + "' title='" + c + "' class='cell " + _class + "' style='flex-basis:calc(" + flexBasis + "% - 4px);'></div>");
        }
    });

    socket.on('set team', function (team) {
        if (team == 0) {
            $("#chat_name").addClass("orange");
        }
        else {
            $("#chat_name").addClass("green");
        }
    });

    socket.on('sync score', function (oscore, gscore) {
        $("#ui_orange > div").text(oscore);
        $("#ui_green > div").text(gscore);
    })

    socket.on('push message', function (msg, type) {
        if (type == 'success') {
            waiting = true;

            $("#ui_timer > small").text("WAIT");
            $("#ui_timer > div").text(10);

            neighbors = [];

            $('.free-neighbor').each(function () {
                neighbors.push($(this).attr('id'));
                $(this).removeClass('free-neighbor');
            });

            var timer = 10;
            var tick = setInterval(function () {
                timer -= 1;
                if (timer > 0) {
                    $("#ui_timer > div").text(timer);
                }
                else {
                    $("#ui_timer > small").text("PUSH");
                    $("#ui_timer > div").text('GO');

                    for (var i = 0; i < neighbors.length; i++) {
                        var n = neighbors[i];
                        $("#" + n).addClass("free-neighbor");
                    }

                    waiting = false;
                    clearInterval(tick);
                }
            }, 1000);
        }

        $('#chat_output').prepend("<div class='message'><span class='name " + type + "'></span>" + msg + "</div>");
    });

    $('#map').on('click', '.free-neighbor', function () {
        socket.emit('push', $(this).attr('id'));
    });

    $("form").submit(function (e) {
        e.preventDefault();
        var name = $("#chat_name").val();
        var msg = $("#chat_input").val();
        socket.emit("chat message", name, msg);
        $("#chat_input").val("");
    });

    socket.on('chat message', function (team, name, msg) {
        $('#chat_output').prepend("<div class='message'><span class='name " + team + "'>" + name + "</span>" + msg + "</div>");
    });
});