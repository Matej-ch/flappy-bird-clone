let obstacleTimers = [];
let gameStarted = false;
let gameTimerId;
let myScore = 0;
let highScore = 0;
let highScoreNickname = 'Anonymous panda';
let myNickName = 'Anonymous';
let myClientId;
let myPublishChannel;
let gameChannel;
let gameChannelName = 'Default';
let allBirds;

if(localStorage.getItem('flappy-nickname')) {
    myNickName = localStorage.getItem('flappy-nickname');
} else {
    localStorage.setItem('flappy-nickname',myNickName);
}

const realtime = new Ably.Realtime({
    authUrl: "/auth",

})

document.addEventListener('DOMContentLoaded',() =>{
    const sky = document.querySelector('.sky');
    const bird = document.querySelector('.bird');
    const gameDisplay = document.querySelector('.game-container');
    const ground = document.querySelector('.ground');
    let nickNameInput = document.getElementById('nickname-input');
    let updateNicknameBtn = document.getElementById('update-nickname');
    let scoreLabel = document.getElementById('score-label');
    let topScoreLabel = document.getElementById('top-label');
    let scoreList = document.getElementById('score-list');

    let isGameOver = false;
    let birdLeft = 220;
    let birdBottom = 100;
    let gravity = 2;
    let gap = 440;

    topScoreLabel.innerHTML = `Top score - ${highScore}pts by ${highScoreNickname}`;
    nickNameInput.value = myNickName;

    updateNicknameBtn.addEventListener('click',() => {
        myNickName = nickNameInput.value;
        localStorage.setItem('flappy-nickname',myNickName)
    });

    window.addEventListener('keydown',function (e) {
        if(e.code === 'Space' && e.target == document.body) {
            e.preventDefault();
        }
    });

    realtime.connection.once("connected",() => {
        myClientId = realtime.auth.clientId;
        myPublishChannel = realtime.channels.get(`bird-position-${myClientId}`);
        gameChannel = realtime.channels.get(gameChannelName);

        gameDisplay.onclick = function () {
            if(!gameStarted) {
                gameStarted = true;
                gameChannel.presence.enter({
                    myNickName: myNickName,
                });
                sendPositionUpdates();
                showOtherBirds();
                document.addEventListener('keydown',control);
                gameTimerId = setInterval(startGame,20);
                generateObstacle();
            }
        }
    });

    function startGame()
    {
        birdBottom -= gravity;
        bird.style.bottom = `${birdBottom}px`;
        bird.style.left = `${birdLeft}px`;
        for (let item in allBirds) {
            if (allBirds[item].targetBottom) {
                let tempBottom = parseInt(allBirds[item].el.style.bottom);
                tempBottom += (allBirds[item].targetBottom - tempBottom) * 0.5;
                allBirds[item].el.style.bottom = `${tempBottom}px`;
            }
        }
    }

    function control(e)
    {
        if(e.code === 'Space' && !isGameOver) {
            jump();
        }
    }

    function jump()
    {
        if(birdBottom < 500) birdBottom += 50;
        bird.style.bottom = `${birdBottom}px`;
    }


    function generateObstacle(randomHeight)
    {
        if(!isGameOver) {
            let obstacleLeft = 500;
            let obstacleBottom = Math.random() * 60;
            const obstacle = document.createElement('div');
            const topObstacle = document.createElement('div');
            obstacle.classList.add('obstacle');
            topObstacle.classList.add('obstacle-top');
            gameDisplay.appendChild(obstacle);
            gameDisplay.appendChild(topObstacle);

            obstacle.style.left = `${obstacleLeft}px`;
            obstacle.style.bottom = `${obstacleBottom}px`;

            topObstacle.style.left = `${obstacleLeft}px`;
            topObstacle.style.bottom = `${obstacleBottom + gap}px`;

            let timerId = setInterval(moveObstacle,20);

            obstacleTimers.push(timerId);

            function moveObstacle() {
                obstacleLeft -= 2;
                obstacle.style.left = `${obstacleLeft}px`;
                topObstacle.style.left = `${obstacleLeft}px`;

                if(obstacleLeft === 220) {
                    myScore++;
                    setTimeout(() => {
                        sortLeaderboard();
                    },250);
                    scoreLabel.innerHTML = `Score: ${myScore}`;
                }
                //whole obstacle must disappears
                if(obstacleLeft === -50) {
                    clearInterval(timerId);
                    gameDisplay.removeChild(obstacle);
                    gameDisplay.removeChild(topObstacle);
                }

                if(obstacleLeft> 200 &&
                    obstacleLeft < 280 &&
                    birdLeft === 220 &&
                    (birdBottom < obstacleBottom + 150 ||
                        birdBottom > obstacleBottom + gap - 200) ||
                    birdBottom === 0) {
                    for (let timer in obstacleTimers) {
                        clearInterval(obstacleTimers[timer]);
                    }
                    gameOver();
                    sortLeaderboard();
                }
            }
            setTimeout(generateObstacle,3000);
        }
    }

    function gameOver()
    {
        scoreLabel.innerHTML += ' | Game Over';
        //this is main timer
        clearInterval(gameTimerId);
        isGameOver = true;
        document.removeEventListener('keydown',control);
        //document.removeEventListener('keyup',control);
        ground.classList.add('ground');
        ground.classList.remove('ground-moving');
        realtime.connection.close();
    }

    function sendPositionUpdates() {
        let publishTimer = setInterval(() => {
            myPublishChannel.publish('pos',{
                bottom: parseInt(bird.style.bottom),
                nickname: myNickName,
                score: myScore,
            });
            if(isGameOver) {
                clearInterval(publishTimer);
                myPublishChannel.detach();
            }
        },100);
    }

    function showOtherBirds() {
        gameChannel.subscribe('game-state',(msg) => {
            for (let item in msg.data.birds) {
                if(item != myClientId) {
                    let newBottom = msg.data.birds[item].bottom;
                    let newLeft = msg.data.birds[item].left;
                    let isDead = msg.data.birds[item].isDead;

                    if(allBirds[item] && !isDead) {
                        allBirds[item].targetBottom = newBottom;
                        allBirds[item].left = newLeft;
                        allBirds[item].isDead = msg.data.birds[item].isDead;
                        allBirds[item].nickname = msg.data.birds[item].nickname;
                        allBirds[item].score = msg.data.birds[item].score;
                    } else if(allBirds[item] && isDead) {
                        sky.removeChild(allBirds[item].el);
                        delete allBirds[item];
                    } else {
                        if(!isGameOver && !isDead) {
                            allBirds[item] = {};
                            allBirds[item].el = document.createElement('div');
                            allBirds[item].el.classList.add('other-bird');
                            sky.appendChild(allBirds[item].el);
                            allBirds[item].el.style.bottom = `${newBottom}px`;
                            allBirds[item].el.style.left = `${newLeft}px`;
                            allBirds[item].isDead = msg.data.birds[item].isDead;
                            allBirds[item].nickname = msg.data.birds[item].nickname;
                            allBirds[item].score = msg.data.birds[item].score;
                        }
                    }
                } else if(item == myClientId) {
                    allBirds[item] = msg.data.birds[item];
                }
            }
            if(msg.data.highScore > highScore) {
                highScore = msg.data.highScore;
                highScoreNickname = msg.data.highScoreNickName;
                topScoreLabel.innerHTML = `Top score - ${highScore}pts by ${highScoreNickname}`;
            }
        });
    }

    function sortLeaderboard() {
        scoreLabel.innerHTML = "Score: " + myScore;
        let listItems = "";
        let leaderBoard = [];
        for (let item in allBirds) {
            leaderBoard.push({
                nickname: allBirds[item].nickname,
                score: allBirds[item].score,
            });
        }
        leaderBoard.sort((a, b) => {
            b.score - a.score;
        });
        leaderBoard.forEach((bird) => {
            listItems +=
                "<li class='score-item'><span class='name'>" +
                bird.nickname +
                "</span><span class='points'>" +
                bird.score +
                "pts</span></li>";
        });
        scoreList.innerHTML = listItems;
    }
});