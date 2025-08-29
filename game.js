const canvas = document.getElementById('pong-canvas');
const ctx = canvas.getContext('2d');
const playerScoreElem = document.getElementById('player-score');
const aiScoreElem = document.getElementById('ai-score');
const messageElem = document.getElementById('game-message');
const startBtn = document.getElementById('start-btn');
const hitSound = document.getElementById('hit-sound');
const scoreSound = document.getElementById('score-sound');

const PADDLE_WIDTH = 14;
const PADDLE_HEIGHT = 110;
const BALL_RADIUS = 14;
const PLAYER_X = 34;
const AI_X = canvas.width - 34 - PADDLE_WIDTH;

let playerY = (canvas.height - PADDLE_HEIGHT) / 2;
let aiY = (canvas.height - PADDLE_HEIGHT) / 2;

let ballX = canvas.width / 2;
let ballY = canvas.height / 2;
let ballSpeedX = 6;
let ballSpeedY = 4;

let playerScore = 0;
let aiScore = 0;

const WIN_SCORE = 10;
let gameRunning = false;
let gameOver = false;

canvas.addEventListener('mousemove', function(e) {
    if (!gameRunning) return;
    const rect = canvas.getBoundingClientRect();
    let mouseY = e.clientY - rect.top;
    playerY = mouseY - PADDLE_HEIGHT / 2;
    playerY = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, playerY));
});

startBtn.addEventListener('click', () => {
    if (gameOver) {
        playerScore = 0;
        aiScore = 0;
        playerScoreElem.textContent = "0";
        aiScoreElem.textContent = "0";
        messageElem.textContent = "";
    }
    resetBall();
    gameRunning = true;
    gameOver = false;
    startBtn.style.display = "none";
    messageElem.textContent = "";
    gameLoop();
});

function update() {
    if (!gameRunning) return;

    // Move ball
    ballX += ballSpeedX;
    ballY += ballSpeedY;

    // Wall collision
    if (ballY - BALL_RADIUS < 0) {
        ballY = BALL_RADIUS;
        ballSpeedY *= -1;
        playSound(hitSound);
    }
    if (ballY + BALL_RADIUS > canvas.height) {
        ballY = canvas.height - BALL_RADIUS;
        ballSpeedY *= -1;
        playSound(hitSound);
    }

    // Paddle collision - Player
    if (
        ballX - BALL_RADIUS <= PLAYER_X + PADDLE_WIDTH &&
        ballY + BALL_RADIUS >= playerY &&
        ballY - BALL_RADIUS <= playerY + PADDLE_HEIGHT &&
        ballX > PLAYER_X
    ) {
        ballX = PLAYER_X + PADDLE_WIDTH + BALL_RADIUS;
        ballSpeedX *= -1.12;
        ballSpeedY += (ballY - (playerY + PADDLE_HEIGHT / 2)) * 0.12;
        playSound(hitSound);
        glowBall();
    }

    // Paddle collision - AI
    if (
        ballX + BALL_RADIUS >= AI_X &&
        ballY + BALL_RADIUS >= aiY &&
        ballY - BALL_RADIUS <= aiY + PADDLE_HEIGHT &&
        ballX < AI_X + PADDLE_WIDTH
    ) {
        ballX = AI_X - BALL_RADIUS;
        ballSpeedX *= -1.12;
        ballSpeedY += (ballY - (aiY + PADDLE_HEIGHT / 2)) * 0.12;
        playSound(hitSound);
        glowBall();
    }

    // Score and reset
    if (ballX < -BALL_RADIUS) {
        aiScore++;
        aiScoreElem.textContent = aiScore;
        playSound(scoreSound);
        resetBall('ai');
        checkWin();
    }
    if (ballX > canvas.width + BALL_RADIUS) {
        playerScore++;
        playerScoreElem.textContent = playerScore;
        playSound(scoreSound);
        resetBall('player');
        checkWin();
    }

    // AI movement (simple)
    let aiCenter = aiY + PADDLE_HEIGHT / 2;
    if (aiCenter < ballY - 24) {
        aiY += Math.min(7, ballY - aiCenter);
    } else if (aiCenter > ballY + 24) {
        aiY -= Math.min(7, aiCenter - ballY);
    }
    aiY = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, aiY));
}

function resetBall(scoredBy) {
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    let direction = (scoredBy === 'player') ? 1 : -1;
    ballSpeedX = direction * (6 + Math.random() * 2);
    ballSpeedY = (Math.random() < 0.5 ? 1 : -1) * (3 + Math.random() * 2);
}

function checkWin() {
    if (playerScore >= WIN_SCORE || aiScore >= WIN_SCORE) {
        gameOver = true;
        gameRunning = false;
        if (playerScore > aiScore) {
            messageElem.textContent = "🎉 You Win! 🎉";
        } else {
            messageElem.textContent = "😢 AI Wins! Try Again!";
        }
        startBtn.textContent = "Restart Game";
        startBtn.style.display = "inline-block";
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background animation - subtle moving gradient
    let gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#232526");
    gradient.addColorStop(1, "#16e0bd");
    ctx.fillStyle = gradient;
    ctx.globalAlpha = 0.16;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;

    // Middle dashed line
    ctx.setLineDash([18, 15]);
    ctx.strokeStyle = "#16e0bd";
    ctx.lineWidth = 4;
    ctx.shadowColor = "#16e0bd";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;

    // Draw paddles with glow and gradient
    drawPaddle(PLAYER_X, playerY, "#00fff7", "#16e0bd");
    drawPaddle(AI_X, aiY, "#ff3e7c", "#f8ff50");

    // Draw ball with glow
    drawBall(ballX, ballY);

    // Score is drawn in HTML (top center)
}

function drawPaddle(x, y, color1, color2) {
    let paddleGrad = ctx.createLinearGradient(x, y, x + PADDLE_WIDTH, y + PADDLE_HEIGHT);
    paddleGrad.addColorStop(0, color1);
    paddleGrad.addColorStop(1, color2);
    ctx.save();
    ctx.shadowColor = color2;
    ctx.shadowBlur = 18;
    ctx.fillStyle = paddleGrad;
    ctx.fillRect(x, y, PADDLE_WIDTH, PADDLE_HEIGHT);
    ctx.restore();
}

function drawBall(x, y) {
    ctx.save();
    ctx.shadowColor = "#fff";
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(x, y, BALL_RADIUS, 0, Math.PI * 2);
    let ballGrad = ctx.createRadialGradient(x, y, 3, x, y, BALL_RADIUS);
    ballGrad.addColorStop(0, "#fff");
    ballGrad.addColorStop(0.4, "#ffeb3b");
    ballGrad.addColorStop(1, "#16e0bd");
    ctx.fillStyle = ballGrad;
    ctx.fill();
    ctx.restore();
}

// Ball glow effect when hit
function glowBall() {
    let origRadius = BALL_RADIUS;
    let grow = true;
    let frame = 0;
    function animateGlow() {
        if (frame > 5) return;
        frame++;
        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.arc(ballX, ballY, origRadius + frame * 2, 0, Math.PI * 2);
        ctx.fillStyle = "#FFEB3B";
        ctx.shadowColor = "#FFEB3B";
        ctx.shadowBlur = 20 + frame * 4;
        ctx.fill();
        ctx.restore();
        requestAnimationFrame(animateGlow);
    }
    animateGlow();
}

function playSound(sound) {
    try {
        sound.currentTime = 0;
        sound.play();
    } catch (e) {}
}

function gameLoop() {
    if (!gameRunning) return;
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Initial draw before game starts
draw();
