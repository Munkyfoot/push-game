$(function () {
    var size = 17;
    var cells = [,]

    for (var y = 0; y < size; y++) {
        for (var x = 0; x < size; x++) {
            var type = "open";
            if((x % 4 + y % 4 == 0) && (x != Math.floor(size / 2) && y != Math.floor(size / 2))){
                type = "blocked";
            }
            cells[x, y] = type;

            var flexBasis = 100 / size;
            $('#map').append("<div id='r" + y + "c" + x + "' class='cell " + type + "' style='flex-basis:calc(" + flexBasis + "% - 2px);'></div>");
        }
    }
});