const envConfig = require('dotenv').config();
const express = require('express');
const ably = require('ably');
const gameChannelName= 'Default';
let gameChannel;
let birdCount = 0;
let gameTicker;
let isGameTickerOn = false;
let gameStateObject;
let birds = {};
let highScore = 0;
let highScoreNickName = 'anonymous';
let birdChannels = {};
let obstacleTimer = 0;

const app = express();
app.use(express.static("public"));

const realtime = new ably.Realtime({
    key: process.env.ABLY_API_KEY,
});

app.get("/",(request,response) => {
    response.sendFile(__dirname + "/index.html");
});

const uniqueId = function () {
    return "id-"+Math.random().toString(36).substr(2,16);
}

app.get('/auth', function (req, res) {
    var tokenParams = {
        clientId: uniqueId(),
    };
    realtime.auth.createTokenRequest(tokenParams, function(err, tokenRequest) {
        if (err) {
            res.status(500).send('Error requesting token: ' + JSON.stringify(err));
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(tokenRequest));
        }
    });
});

const listener = app.listen(process.env.PORT,() => {
    console.log('App listening to port ' + listener.address().port);
});

realtime.connection.once('connected',() => {
    gameChannel =realtime.channels.get(gameChannelName);
    gameChannel.presence.subscribe('enter',(msg) => {
        if(++birdCount === 1 && !isGameTickerOn) {
            gameTicker = setInterval(startGameTick,100);
            isGameTickerOn = true;
        }

        birds[msg.clientId] = {
            id: msg.clientId,
            left: 220,
            bottom: 350,
            isDead: false,
            nickname: msg.data.nickname,
            score:0,
        };
        subscribeToPlayerInput(msg.clientId);
    });

    gameChannel.presence.subscribe('leave',(msg) => {
        if(birds[msg.clientId] != undefined) {
            birdCount--;
            birds[msg.clientId].isDead = true;
            setTimeout(() => {
                delete birds[msg.clientId];
            },500);
            if(birdCount < 1) {
                isGameTickerOn = false;
                clearInterval(gameTicker);
            }
        }
    });
});

function subscribeToPlayerInput(id) {
    birdChannels[id] = realtime.channels.get(`bird-position-${id}`);
    birdChannels[id].subscribe('pos',(msg) => {
        if(birds[id]) {
            birds[id].bottom = msg.data.bottom;
            birds[id].nickname = msg.data.nickname;
            birds[id].score = msg.data.score;
            if(msg.data.score > highScore) {
                highScore = msg.data.score;
                highScoreNickName = msg.data.nickname;
            }
        }
    });
}

function startGameTick() {

    if (obstacleTimer === 0 || obstacleTimer === 3000) {
        obstacleTimer = 0;
        gameStateObject = {
            birds: birds,
            highScore: highScore,
            highScoreNickName: highScoreNickName,
            launchObstacle: true,
            obstacleHeight: Math.random() * 60,
        };
    } else {
        gameStateObject = {
            birds: birds,
            highScore: highScore,
            highScoreNickname: highScoreNickname,
            launchObstacle: false,
            obstacleHeight: "",
        };
    }

    obstacleTimer += 100;
    gameChannel.publish("game-state",gameStateObject);
}