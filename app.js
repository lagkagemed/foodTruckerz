//express setup
import express from 'express';
import * as http from 'http';
import { dirname } from 'path';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';

import { NAMES_ARRAY } from './server/names.js'
import { FOOD_ARRAY } from './server/foods.js'
import { Farmer } from './server/farmer.js'
import { Food } from './server/farmer.js'


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
let FARMER_ARRAY = []

let numFarmers = 4 + (Math.random() * 6);

for (let i = 0; i < numFarmers; i++) {
    let pickRand = Math.random() * NAMES_ARRAY.length;
    let fName = NAMES_ARRAY.splice(pickRand, 1);
    let foodArray = [];
    let difFoods = 5 + (Math.random() * 5)

    for (let i = 0; i < difFoods; i++) {
        pickRand = Math.random() * FOOD_ARRAY.length;
        let newFoodArr = FOOD_ARRAY.splice(pickRand, 1);
        let quantity = 10 + (Math.random() * 20);
        quantity = parseFloat(quantity.toFixed(0));
        let price = 2 + (Math.random() * 6);
        price = parseFloat(price.toFixed(2));
        let taste = 0.5 + Math.random();
        taste = parseFloat(taste.toFixed(2));
        let nutrition = 0.5 + Math.random();
        nutrition = parseFloat(nutrition.toFixed(2));
        let newFood = Food(newFoodArr[0].name, newFoodArr[0].group, newFoodArr[0].description, quantity, price, taste, nutrition);
        foodArray.push(newFood);
    }

    FARMER_ARRAY.push(Farmer(fName, foodArray));
}



let io = new Server(serv);

function sendGameStatus() {
    let pack = {};

    let string = "Connected players are: ";
    for (let i in PLAYER_LIST) {
        let player = PLAYER_LIST[i];
        string += player.name + " | ";
    }
    pack.connected = string;
    pack.farmers = FARMER_ARRAY;


    for (let i in SOCKET_LIST) {
        let socket = SOCKET_LIST[i];
        socket.emit('gameStatus', pack);
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
    player.inventory = [];

    sendGameStatus();

    console.log('Socket with id: ' + socket.id + ' connected!');

    socket.on('playerLoggedIn',function(name){
        player.name = name;
        console.log('Socket with id: ' + player.id + ' changed name to: ' + player.name);
        sendGameStatus();
        socket.emit('playerStatus', player);
    });

    socket.on('buyRequest',function(data){
        let buyQuant = Math.floor(data.buyQuant)
        if (isNaN(data.buyQuant)) {
            console.log(data.buyQuant);
        } else if (buyQuant > 0) {
            let buyItem = FARMER_ARRAY[data.farmer].items[data.item];
            let buyPrice = buyQuant * buyItem.price;
            if (player.cash >= buyPrice && buyItem.quantity >= buyQuant) {
                player.cash -= buyPrice;
                player.cash = player.cash.toFixed(2);
                let doesExist = false;
                for (let i = 0; i < player.inventory.length; i++) {
                    let curFood = player.inventory[i];
                    if (curFood.name == buyItem.name) {
                        doesExist = true;
                        let foodA = parseFloat(curFood.quantity)
                        let foodB = parseFloat(buyQuant);
                        let foodC = foodA + foodB;
                        curFood.quantity = foodC;
                    }
                }
                if (!doesExist) {
                    let newFood = Food(buyItem.name, buyItem.group, buyItem.description, buyQuant, buyItem.price, buyItem.taste, buyItem.nutrition);
                    player.inventory.push(newFood);
                }
                socket.emit('playerStatus', player);
                buyItem.quantity -= buyQuant;
                sendGameStatus();
            }
        }
    });

    socket.on('disconnect',function(){
        delete SOCKET_LIST[socket.id];
        delete PLAYER_LIST[player.id];
        console.log('socket disconnected');
        sendGameStatus();
    });
});

