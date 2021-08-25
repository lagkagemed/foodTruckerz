let socket = io();

let playerName = '';
let playerCash = 0;

document.getElementById('loginButton').addEventListener('click', function () {
    playerName = document.getElementById('playerNameInput').value;
    socket.emit('playerLoggedIn', playerName);
    document.getElementById("loginPage").style.display = "none";
    document.getElementById("gamePage").style.display = "block";
})

socket.on('connectedUpdate',function(string){
    document.getElementById('connectedInfo').innerHTML = string;
});

socket.on('playerStatus',function(player){
    playerCash = player.cash;
    document.getElementById('moneyInfo').innerHTML = "You currently have " + playerCash + "$";
});