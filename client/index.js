let socket = io();

let playerName = '';
let playerCash = 0;
let playerInventory = [];

let selectedFarmer = -1;
let selectedFood = -1;
let foodDiv = document.getElementById("foodDetailDiv");

let FARMER_ARRAY = [];

function updateItem(item) {
    if (selectedFood != -1) {
        foodDiv.innerHTML = '';
        let newHead = document.createElement("h3");
        newHead.innerHTML = item.name;
        foodDiv.appendChild(newHead);
        let p = document.createElement("p");
        p.innerHTML = "Description: " + item.description;
        foodDiv.appendChild(p);
        let p0 = document.createElement("p");
        p0.innerHTML = "Group: " + item.group;
        foodDiv.appendChild(p0);
        let p1 = document.createElement("p");
        p1.innerHTML = "Price: " + item.price;
        foodDiv.appendChild(p1);
        let p2 = document.createElement("p");
        p2.innerHTML = "Taste: " + item.taste;
        foodDiv.appendChild(p2);
        let p3 = document.createElement("p");
        p3.innerHTML = "Nutrition: " + item.nutrition;
        foodDiv.appendChild(p3);
        let text = document.createElement("input");
        text.type = "text";
        foodDiv.appendChild(text);
        let btn3 = document.createElement("button");
        btn3.innerHTML = 'Buy!';
        btn3.addEventListener('click', function () {
            let pack = {};
            pack.buyQuant = text.value;
            pack.farmer = selectedFarmer;
            pack.item = selectedFood;
            socket.emit('buyRequest', pack);
        })
        foodDiv.appendChild(btn3);
    }
}

function updateFarmer(farmer) {
    if (selectedFarmer != -1) {
        document.getElementById("firstLeftMenu").style.display = "none";
        document.getElementById("farmerDetailDiv").style.display = "block";
        foodDiv.innerHTML = '';
        document.getElementById('farmerTitle').innerHTML = farmer.name + "'s farm";
        let farmerInv = document.getElementById('farmerInventory');
        farmerInv.innerHTML = '';

        for (let i = 0; i < farmer.items.length; i++) {
            let curItem = farmer.items[i];
            if (curItem.quantity > 0) {
                let btn2 = document.createElement("button");
                btn2.innerHTML = curItem.name + ": " + curItem.quantity;
                btn2.addEventListener('click', function () {
                    selectedFood = i;
                    updateItem(curItem);
                })
                farmerInv.appendChild(btn2);
            }
        }
    }
}

function updateFarmers() {
    if (selectedFarmer == -1) {
        document.getElementById("firstLeftMenu").style.display = "block";
        document.getElementById("farmerDetailDiv").style.display = "none";
        let curDiv = document.getElementById("farmersSelectDiv");
        curDiv.innerHTML = '';
        
        for (let i = 0; i < FARMER_ARRAY.length; i++) {
            let curFarmer = FARMER_ARRAY[i];
            let btn = document.createElement("button");
            btn.innerHTML = curFarmer.name + "'s farm";
            btn.addEventListener('click', function () {
                selectedFarmer = i;
                updateFarmer(curFarmer);
            })
            curDiv.appendChild(btn);
        }
    } else {
        updateFarmer(FARMER_ARRAY[selectedFarmer]);
    }
}

document.getElementById('backToFirstLeftMenuBtn').addEventListener('click', function () {
    document.getElementById("firstLeftMenu").style.display = "block";
    document.getElementById("farmerDetailDiv").style.display = "none";
    selectedFarmer = -1;
    selectedFood = -1;
    updateFarmers();
})

document.getElementById('loginButton').addEventListener('click', function () {
    playerName = document.getElementById('playerNameInput').value;
    socket.emit('playerLoggedIn', playerName);
    document.getElementById("loginPage").style.display = "none";
    document.getElementById("gamePage").style.display = "block";
})

socket.on('gameStatus',function(data){
    document.getElementById('connectedInfo').innerHTML = data.connected;
    FARMER_ARRAY = data.farmers;
    updateFarmers();
});

socket.on('playerStatus',function(player){
    playerCash = player.cash;
    document.getElementById('moneyInfo').innerHTML = "You currently have " + playerCash + "$";

    playerInventory = player.inventory;
    if (playerInventory.length == 0) {
        document.getElementById('inventoryInfo').innerHTML = "Your Inventory is empty!";
    } else {
        let string = "In your inventory you have: ";
        for (let i = 0; i < playerInventory.length; i++) {
            string += playerInventory[i].name + ": " + playerInventory[i].quantity + " | ";
        }
        document.getElementById('inventoryInfo').innerHTML = string;
    }

});