$(function () {
    var socket = io();
    socket.on('load level', function (classMap) {
        $(".cell").remove();
        for (var c = 0; c < classMap.length; c++) {
            var _class = classMap[c];
            var flexBasis = 100 / Math.sqrt(classMap.length);
            $('#map').append("<div id='" + c + "' class='cell " + _class + "' style='flex-basis:calc(" + flexBasis + "% - 4px);'></div>");
        }
    });

    socket.on('push message', function (msg){
        //alert(msg);
    });

    $('#map').on('click', '.free-neighbor', function(){
        socket.emit('push', $(this).attr('id'));
    });
});