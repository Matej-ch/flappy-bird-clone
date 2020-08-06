document.addEventListener('DOMContentLoaded',() =>{
    const bird = document.querySelector('.bird');
    const container = document.querySelector('.game-container');
    const ground = document.querySelector('.ground');
    let isGameOver = false;

    let birdLeft = 220;
    let birdBottom = 100;

    let gravity = 2;
    let gap = 450;

    function startGame()
    {
        birdBottom -= gravity;
        bird.style.bottom = `${birdBottom}px`;
        bird.style.left = `${birdLeft}px`;
    }


    let gameTimerId = setInterval(startGame,20);

    function control(e)
    {
        if(e.code === 'Space') {
            jump();
        }
    }

    function jump()
    {
        if(birdBottom < 500) birdBottom += 50;
        bird.style.bottom = `${birdBottom}px`;
    }

    document.addEventListener('keyup',control);

    function generateObstacle()
    {
        let obstacleLeft = 500;
        let randomHeight = Math.random() * 60;
        let obstacleBottom = randomHeight;
        const obstacle = document.createElement('div');
        const topObstacle = document.createElement('div');
        if(!isGameOver) {
            obstacle.classList.add('obstacle');
            topObstacle.classList.add('obstacle-top')
        }

        container.appendChild(obstacle);
        container.appendChild(topObstacle);

        obstacle.style.left = `${obstacleLeft}px`;
        obstacle.style.bottom = `${obstacleBottom}px`;

        topObstacle.style.left = `${obstacleLeft}px`;
        topObstacle.style.bottom = `${obstacleBottom + gap}px`;

        function moveObstacle() {
            obstacleLeft -= 2;
            obstacle.style.left = `${obstacleLeft}px`;
            topObstacle.style.left = `${obstacleLeft}px`;
            //whole obstacle must disappears
            if(obstacleLeft === -60) {
                clearInterval(timerId);
                container.removeChild(obstacle);
                container.removeChild(topObstacle);
            }
            if(obstacleLeft> 200 &&
                obstacleLeft < 280 &&
                birdLeft === 220 &&
                (birdBottom < obstacleBottom + 150 || birdBottom > obstacleBottom + gap - 200) || birdBottom === 0) {
                gameOver();
                clearInterval(timerId);
            }
        }
        let timerId = setInterval(moveObstacle,20);

        if(!isGameOver) {
            setTimeout(generateObstacle,3000);
        }
    }

    function gameOver()
    {
        //this is main timer
        clearInterval(gameTimerId);
        isGameOver = true;
        document.removeEventListener('keyup',control);
    }

    generateObstacle();
});