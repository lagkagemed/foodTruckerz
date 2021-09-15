//express setup
import express from 'express';
import * as http from 'http';
import { dirname } from 'path';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';

import { NAMES_ARRAY } from './server/names.js'
import { FOOD_ARRAY } from './server/foods.js'
import { FOOD_ARRAY_GROUPS } from './server/foods.js'
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

let totalTime = 1;
let startDate = Date.now();
let endDate = startDate + (totalTime * 60 * 1000)
let cookFact = 0.5;
let recipes = [];
let priceFact = 1;

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
    pack.endDate = endDate;
    pack.recipes = recipes;
    pack.priceFact = priceFact;


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
    player.cookedFood = [];
    player.kitchen = 2;

    sendGameStatus();

    function sendInitial() {
        let pack = {};
    
        pack.groups = FOOD_ARRAY_GROUPS;
        pack.cookFact = cookFact;
    
        socket.emit('initial', pack);
    }

    sendInitial();

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
            let buyPrice = (buyQuant * buyItem.price * priceFact).toFixed(2);
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

    socket.on('cookRequest',function(data){
        let cookIt = true;
        if (data.ingredients.length > player.kitchen) cookIt = false;

        let avgCost = 0;
        let dishTaste = 0;
        let dishNutrition = 0;
        let dishRecipe = [];

        for (let i = 0; i < data.ingredients.length; i++) {
            let doesExist = false
            for (let a = 0; a < player.inventory.length; a++) {
                if (data.ingredients[i] == player.inventory[a].name) {
                    if (player.inventory[a].quantity > 0) {
                        let selFood = player.inventory[a];
                        doesExist = true;
                        avgCost += selFood.price;
                        dishTaste += selFood.taste;
                        dishNutrition += selFood.nutrition;
                        dishRecipe.push(selFood.group);
                    }
                }
            }
            if (!doesExist) cookIt = false;
        }

        let recipeName = data.dishName;

        if (dishRecipe.length > 0) {
            avgCost = avgCost / dishRecipe.length;
            avgCost = parseFloat(avgCost.toFixed(2));
            dishTaste = dishTaste / dishRecipe.length + ((dishRecipe.length - 1) * cookFact)
            dishTaste = parseFloat(dishTaste.toFixed(2));
            dishNutrition = dishNutrition / dishRecipe.length + ((dishRecipe.length - 1) * cookFact)
            dishNutrition = parseFloat(dishNutrition.toFixed(2));
        }

        dishRecipe.sort();
        
        let recipeDoesExist = false

        for (let i = 0; i < recipes.length; i++) {
            if (JSON.stringify(recipes[i].ingredients) == JSON.stringify(dishRecipe)) {
                recipeDoesExist = true;
                recipeName = recipes[i].dishName;
                console.log('same')
            }
        }

        if (!recipeDoesExist) {
            let newRecipe = {}
            newRecipe.dishName = recipeName;
            newRecipe.ingredients = dishRecipe;
            recipes.push(newRecipe);
            console.log('not same')
        }

        let recipeString = '';

        for (let i = 0; i < dishRecipe.length; i++) {
            recipeString += dishRecipe[i] + " | ";
        }

        if (cookIt) {
            let doesDishExist = false;
            for (let i= 0; i < player.cookedFood.length; i++) {
                if (player.cookedFood[i].description == recipeString) {
                    doesDishExist = true;
                    player.cookedFood[i].quantity += data.ingredients.length;
                }
            }
            if (!doesDishExist) {
                let newFood = Food(recipeName, 'Cooked Food', recipeString, data.ingredients.length, avgCost, dishTaste, dishNutrition);
                player.cookedFood.push(newFood);
            }
            for (let i = 0; i < data.ingredients.length; i++) {
                for (let a = 0; a < player.inventory.length; a++) {
                    if (data.ingredients[i] == player.inventory[a].name) {
                        player.inventory[a].quantity--;
                    }
                }
            }
            socket.emit('playerStatus', player);
            sendGameStatus();

        }
    })

    socket.on('disconnect',function(){
        delete SOCKET_LIST[socket.id];
        delete PLAYER_LIST[player.id];
        console.log('socket disconnected');
        sendGameStatus();
    });
});

setTimeout(function(){
    priceFact = 0.7;
    sendGameStatus();
}, (totalTime * 60 * 1000 / 2))

setTimeout(function(){
    priceFact = 0.5;
    sendGameStatus();
}, (totalTime * 60 * 1000 / 4 * 3))