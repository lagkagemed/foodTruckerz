//express setup
import express from 'express';
import * as http from 'http';
import { dirname } from 'path';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let app = express();
let serv = http.Server(app);

app.get('/',function(req, res){
    res.sendFile(__dirname + '/client/index.html');
});
app.use('/client',express.static(__dirname + '/client'));

serv.listen(process.env.PORT || 2000);
console.log('Server started.');

let SOCKET_LIST = {}
let PLAYER_LIST = {}

let io = new Server(serv);

function sendConnectedPlayers() {
    let string = "Connected players are: ";

    for (let i in PLAYER_LIST) {
        let player = PLAYER_LIST[i];
        string += player.name + " | ";
    }
    for (let i in SOCKET_LIST) {
        let socket = SOCKET_LIST[i];
        socket.emit('connectedUpdate', string);
    }
}

io.sockets.on('connection', function(socket){
    socket.id = Math.random();

    let player = {};
    player.id = socket.id;

    SOCKET_LIST[socket.id] = socket;
    PLAYER_LIST[player.id] = player;

    player.name = "Unnamed";
    player.cash = 1000;

    sendConnectedPlayers();

    console.log('Socket with id: ' + socket.id + ' connected!');

    socket.on('playerLoggedIn',function(name){
        player.name = name;
        console.log('Socket with id: ' + player.id + ' changed name to: ' + player.name);
        sendConnectedPlayers();
        socket.emit('playerStatus', player);
    });

    socket.on('disconnect',function(){
        delete SOCKET_LIST[socket.id];
        delete PLAYER_LIST[player.id];
        console.log('socket disconnected');
        sendConnectedPlayers();
    });
});

