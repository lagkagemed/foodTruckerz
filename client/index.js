let socket = io();

let playerName = '';
let playerCash = 0;
let playerInventory = [];
let playerKitchen = 0;

let FOOD_ARRAY_GROUPS = [];
let endDate = 0;
let cookFact = 0;

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

function refreshDishStats() {
    let dishStatsDiv = document.getElementById('dishStatsDiv');
    dishStatsDiv.innerHTML = '';
    let avgCost = 0;
    let dishTaste = 0;
    let dishNutrition = 0;
    let dishRecipe = [];

    for (let i = 0; i < playerKitchen; i++) {
        let select = document.getElementById('ingredientSelect' + i);
        if (select.selectedIndex != 0) {
            for (let a = 0; a < playerInventory.length; a++) {
                let selFood = playerInventory[a];
                if (select.value == selFood.name) {
                    avgCost += selFood.price;
                    dishTaste += selFood.taste;
                    dishNutrition += selFood.nutrition;
                    dishRecipe.push(selFood.group);
                }
            }
        }
    }

    if (dishRecipe.length > 0) {
        avgCost = avgCost / dishRecipe.length;
        avgCost = parseFloat(avgCost.toFixed(2));
        dishTaste = dishTaste / dishRecipe.length + ((dishRecipe.length - 1) * cookFact)
        dishTaste = parseFloat(dishTaste.toFixed(2));
        dishNutrition = dishNutrition / dishRecipe.length + ((dishRecipe.length - 1) * cookFact)
        dishNutrition = parseFloat(dishNutrition.toFixed(2));
    }

    dishRecipe.sort();

    let recipeString = '';

    for (let i = 0; i < dishRecipe.length; i++) {
        recipeString += dishRecipe[i] + " | ";
    }
    dishStatsDiv.innerHTML = 'Production cost: ' + avgCost + '<br>' + 'Dish taste: ' + dishTaste + '<br>' + 'Dish Nutrition: ' + dishNutrition + '<br>' + 'Recipe: ' + recipeString + '<br><br>';
}

function updateKitchen() {
    let ingredientsDiv = document.getElementById('ingredientsDiv')
    ingredientsDiv.innerHTML = '';

    for (let i = 0; i < playerKitchen; i++) {
        let select = document.createElement("select");
        select.id = 'ingredientSelect' + i;
        let optGroup = document.createElement("optgroup");
        optGroup.label = 'None';
        let option = document.createElement("option");
        option.innerHTML =  '--- Choose ingredient ' + (i + 1) +' ---';
        optGroup.appendChild(option);
        select.appendChild(optGroup);
        for (let a = 0; a < FOOD_ARRAY_GROUPS.length; a++) {
            let optGroup0 = document.createElement("optgroup");
            optGroup0.label = FOOD_ARRAY_GROUPS[a];
            for (let b = 0; b < playerInventory.length; b++) {
                if (playerInventory[b].group == FOOD_ARRAY_GROUPS[a]) {
                    let option0 = document.createElement("option");
                    option0.innerHTML = playerInventory[b].name;
                    optGroup0.appendChild(option0);
                }
            }
            select.appendChild(optGroup0);
        }
        select.addEventListener('change', refreshDishStats);
        ingredientsDiv.appendChild(select);
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
    endDate = data.endDate;
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

    playerKitchen = player.kitchen;
    updateKitchen();

});

socket.on('initial',function(data){
    FOOD_ARRAY_GROUPS = data.groups;
    cookFact = data.cookFact;
});

setInterval(function () {
    let diffDate = endDate - Date.now();
    let diffMin = Math.floor(diffDate / 60 / 1000);
    let diffSec = Math.floor((diffDate / 1000) - (diffMin * 60));

    document.getElementById('timeInfo').innerHTML = 'The market opens in: ' + diffMin + ' min and ' + diffSec + ' sec'
}, 1000);