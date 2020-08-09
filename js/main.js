let obstacleTimers = [];
let gameStarted = false;
let gameTimerId;
let myScore = 0;
let highScore = 0;
let highScoreNickname = 'Anonymous panda';
let myNickName = 'Anonymous';

if(localStorage.getItem('flappy-nickname')) {
    myNickName = localStorage.getItem('flappy-nickname');
} else {
    localStorage.setItem('flappy-nickname',myNickName);
}

document.addEventListener('DOMContentLoaded',() =>{
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
    let gap = 450;

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

    gameDisplay.onclick = function () {
        if(!gameStarted) {
            gameStarted = true;
            document.addEventListener('keydown',control);
            gameTimerId = setInterval(startGame,20);
            generateObstacle();
        }
    }

    function startGame()
    {
        birdBottom -= gravity;
        bird.style.bottom = `${birdBottom}px`;
        bird.style.left = `${birdLeft}px`;
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
                    isGameOver = true;
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
    }
});