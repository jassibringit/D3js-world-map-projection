var express = require("express");
var app = express();





//sets up to serve files from any statc folder that we choose
app.use(express.static("./public"));
// adding socket io

// server tot http server that get return from app.listen call
var server = app.listen(3000);
//created a socket server that is alos listening on port 3000
var io = require("socket.io").listen(server)

// add a event handler when socket connects
//conecntion ocuurs when socket gets connnected, will be handled with this callback fucnction

// function gets invoked when socket connects 
// and that fucntions gets that socket injected as an argument
io.sockets.on("connection", function(socket) {

function getRandomInRange(from, to, fixed) {
    return (Math.random() * (to - from) + from).toFixed(fixed) * 1;
    // .toFixed() returns string, so ' * 1' is a trick to convert to number
}

var a = getRandomInRange(-180,180,3)

var numString = a.toString()
    //log the id when new socket connects
    setInterval(function() {

        io.emit("draw", {
            "color": "white",
            "p1": ["53.5555501", "-113.7741251"],
            "p2": ["37.3388", "-121.8914"],
            'timeout': 220
        });

         io.emit("draw", {
            "color": "white",
            "p1": ["61.5240", "105.3188"],
            "p2": ["30.5595", "22.9375"],
            'timeout': 220
        });

    }, 4000)


});

console.log("Server is running at localhost:3000");
