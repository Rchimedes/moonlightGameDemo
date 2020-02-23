const express = require('express');
const app = express();
const server = require('http').Server(app)
const io = require('socket.io').listen(server)

var players = {};
var redCount = 0;
var blueCount = 0;
var star = {
    x: Math.floor(Math.random() * 700) + 50,
    y: Math.floor(Math.random() * 500) + 50
};
var scores = {
    blue: 0,
    red: 0
};
var blueWinner = "Blue team wins!"
var redWinner = "Red team wins!"


app.use(express.static(__dirname + '/public'));

app.get('/', function (_req, res) {
    res.sendFile(__dirname + '/index.html')
});

io.on('connection', function (socket) {
    console.log('a user connected', socket.id);
    // create a new player and add it to our players object
    players[socket.id] = {
        rotation: 0,
        x: Math.floor(Math.random() * 700) + 50,
        y: Math.floor(Math.random() * 500) + 50,
        playerId: socket.id,
        team:  redCount < blueCount ? 'red' : 'blue'
    };
    redCount < blueCount ? redCount++ : blueCount++;
    // send the players object to the new player
    socket.emit('currentPlayers', players);
    // update all other players of the new player

    // send the star object to the new player
    socket.emit('starLocation', star);
    // send the current scores
    socket.emit('scoreUpdate', scores);


    socket.broadcast.emit('newPlayer', players[socket.id]);

    // when a player disconnects, remove them from our players object
    socket.on('disconnect', function () {
        console.log('user disconnected', socket.id);
        players[socket.id].team == "red" ? redCount-- : blueCount--;
        // remove this player from our players object
        delete players[socket.id];
        // emit a message to all players to remove this player
        io.emit('disconnect', socket.id);
    });

    // when a player moves, update the player data
    socket.on('playerMovement', function (movementData) {
        players[socket.id].x = movementData.x;
        players[socket.id].y = movementData.y;
        players[socket.id].rotation = movementData.rotation;
        // emit a message to all players about the player that moved
        socket.broadcast.emit('playerMoved', players[socket.id]);
    });

    socket.on('starCollected', function () {
        if (players[socket.id].team === 'red') {
            scores.red += 10;
        } else {
            scores.blue += 10;
        }
        if (scores.red >= 510){
            io.emit('gameover', redWinner)
            console.log('red wins')
        }
        else if (scores.blue >= 510) {
            io.emit('gameover', blueWinner)
            console.log('blue wins')
        }
        else {star.x = Math.floor(Math.random() * 700) + 50;
        star.y = Math.floor(Math.random() * 500) + 50;
        io.emit('starLocation', star);
        io.emit('scoreUpdate', scores);
        }
    });
});

server.listen(8000, function () {
    console.log(`The party has started on port ${server.address().port}`); //used ` instead of ' 
})

