const canvas = document.getElementById('pong-canvas');
const ctx = canvas.getContext('2d');

// Game settings
const PADDLE_WIDTH = 12;
const PADDLE_HEIGHT = 100;
const BALL_RADIUS = 12;
const PLAYER_X = 30;
const AI_X = canvas.width - 30 - PADDLE_WIDTH;

// Entities
let playerY = (canvas.height - PADDLE_HEIGHT) / 2;
let aiY = (canvas.height - PADDLE_HEIGHT) / 2;

let ballX = canvas.width / 2;
let ballY = canvas.height / 2;
let ballSpeedX = 5;
let ballSpeedY = 3;

// Track mouse movement for player paddle
canvas.addEventListener('mousemove', function(e) {
    const rect = canvas.getBoundingClientRect();
    let mouseY = e.clientY - rect.top;
    playerY = mouseY - PADDLE_HEIGHT / 2;

    // Clamp within canvas
    playerY = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, playerY));
});

// Game loop
function update() {
    // Move ball
    ballX += ballSpeedX;
    ballY += ballSpeedY;

    // Wall collision (top/bottom)
    if (ballY - BALL_RADIUS < 0) {
        ballY = BALL_RADIUS;
        ballSpeedY *= -1;
    }
    if (ballY + BALL_RADIUS > canvas.height) {
        ballY = canvas.height - BALL_RADIUS;
        ballSpeedY *= -1;
    }

    // Paddle collision - Player
    if (
        ballX - BALL_RADIUS <= PLAYER_X + PADDLE_WIDTH &&
        ballY + BALL_RADIUS >= playerY &&
        ballY - BALL_RADIUS <= playerY + PADDLE_HEIGHT &&
        ballX > PLAYER_X
    ) {
        ballX = PLAYER_X + PADDLE_WIDTH + BALL_RADIUS;
        ballSpeedX *= -1.1; // Speed up after hit
        ballSpeedY += (ballY - (playerY + PADDLE_HEIGHT / 2)) * 0.08;
    }

    // Paddle collision - AI
    if (
        ballX + BALL_RADIUS >= AI_X &&
        ballY + BALL_RADIUS >= aiY &&
        ballY - BALL_RADIUS <= aiY + PADDLE_HEIGHT &&
        ballX < AI_X + PADDLE_WIDTH
    ) {
        ballX = AI_X - BALL_RADIUS;
        ballSpeedX *= -1.1; // Speed up after hit
        ballSpeedY += (ballY - (aiY + PADDLE_HEIGHT / 2)) * 0.08;
    }

    // Score: reset if ball goes off left/right
    if (ballX < 0 || ballX > canvas.width) {
        resetBall();
    }

    // AI paddle movement: simple follow ball
    if (aiY + PADDLE_HEIGHT / 2 < ballY - 20) {
        aiY += Math.min(6, ballY - (aiY + PADDLE_HEIGHT / 2));
    } else if (aiY + PADDLE_HEIGHT / 2 > ballY + 20) {
        aiY -= Math.min(6, (aiY + PADDLE_HEIGHT / 2) - ballY);
    }

    // Clamp AI paddle within canvas
    aiY = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, aiY));
}

function resetBall() {
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    ballSpeedX = (Math.random() < 0.5 ? 1 : -1) * 5;
    ballSpeedY = (Math.random() < 0.5 ? 1 : -1) * (2 + Math.random() * 2);
}

function draw() {
    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Middle dashed line
    ctx.setLineDash([15, 15]);
    ctx.strokeStyle = "#aaa";
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw paddles
    ctx.fillStyle = "#fff";
    ctx.fillRect(PLAYER_X, playerY, PADDLE_WIDTH, PADDLE_HEIGHT); // Player
    ctx.fillRect(AI_X, aiY, PADDLE_WIDTH, PADDLE_HEIGHT); // AI

    // Draw ball
    ctx.beginPath();
    ctx.arc(ballX, ballY, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = "#FFEB3B";
    ctx.fill();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

resetBall();
gameLoop();