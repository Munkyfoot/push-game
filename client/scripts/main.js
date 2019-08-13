$(function () {
    var socket = io();
    socket.on('load level', function (classMap) {
        $(".cell").remove();
        for (var c = 0; c < classMap.length; c++) {
            var _class = classMap[c];
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

    socket.on('push message', function (msg, type) {
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