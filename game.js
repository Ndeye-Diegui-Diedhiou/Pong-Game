const canvas = document.getElementById('pong-canvas');
const ctx = canvas.getContext('2d');
const playerScoreElem = document.getElementById('player-score');
const aiScoreElem = document.getElementById('ai-score');
const messageElem = document.getElementById('game-message');
const startBtn = document.getElementById('start-btn');
const hitSound = document.getElementById('hit-sound');
const scoreSound = document.getElementById('score-sound');

// Options elements
const ballSpeedSlider = document.getElementById('ball-speed');
const aiDifficultySelect = document.getElementById('ai-difficulty');
const paddleSizeSlider = document.getElementById('paddle-size');
const themeSelect = document.getElementById('theme');
const applyBtn = document.getElementById('apply-btn');

let PADDLE_WIDTH = 14;
let PADDLE_HEIGHT = parseInt(paddleSizeSlider.value);
const BALL_RADIUS = 14;
const PLAYER_X = 34;
let AI_X = canvas.width - 34 - PADDLE_WIDTH;

let playerY = (canvas.height - PADDLE_HEIGHT) / 2;
let aiY = (canvas.height - PADDLE_HEIGHT) / 2;

let ballX = canvas.width / 2;
let ballY = canvas.height / 2;
let baseBallSpeed = parseInt(ballSpeedSlider.value);
let ballSpeedX = baseBallSpeed;
let ballSpeedY = baseBallSpeed * 0.7;

let playerScore = 0;
let aiScore = 0;

const WIN_SCORE = 10;
let gameRunning = false;
let gameOver = false;

// Theme colors
let themeColors = {
    default: { primary: "#16e0bd", secondary: "#1f8ef1", ball: "#ffeb3b" },
    red: { primary: "#ff3e7c", secondary: "#ff0000", ball: "#ff9999" },
    green: { primary: "#00ff99", secondary: "#00cc66", ball: "#ccffcc" },
    purple: { primary: "#bb86fc", secondary: "#6200ea", ball: "#e0b0ff" }
};
let currentTheme = "default";

// Écouteur d'événement pour le bouton Appliquer
applyBtn.addEventListener('click', applySettings);

function applySettings() {
    console.log("Application des paramètres...");
    
    // Update paddle size
    PADDLE_HEIGHT = parseInt(paddleSizeSlider.value);
    console.log("Taille des raquettes:", PADDLE_HEIGHT);
    
    // Update ball speed
    baseBallSpeed = parseInt(ballSpeedSlider.value);
    console.log("Vitesse de la balle:", baseBallSpeed);
    
    // Update theme
    currentTheme = themeSelect.value;
    console.log("Thème sélectionné:", currentTheme);
    
    // Recalculer la position de l'IA
    AI_X = canvas.width - 34 - PADDLE_WIDTH;
    
    // Reset positions
    playerY = (canvas.height - PADDLE_HEIGHT) / 2;
    aiY = (canvas.height - PADDLE_HEIGHT) / 2;
    
    // Redraw with new settings
    draw();
    
    messageElem.textContent = "Paramètres appliqués!";
    setTimeout(() => {
        if (!gameRunning) messageElem.textContent = "";
    }, 2000);
}

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

    // AI movement based on difficulty
    let aiCenter = aiY + PADDLE_HEIGHT / 2;
    let aiSpeed;
    
    switch(aiDifficultySelect.value) {
        case 'easy':
            aiSpeed = 4;
            break;
        case 'medium':
            aiSpeed = 5;
            break;
        case 'hard':
            aiSpeed = 6;
            break;
        case 'impossible':
            aiSpeed = 7;
            break;
        default:
            aiSpeed = 5;
    }
    
    if (aiCenter < ballY - 24) {
        aiY += Math.min(aiSpeed, ballY - aiCenter);
    } else if (aiCenter > ballY + 24) {
        aiY -= Math.min(aiSpeed, aiCenter - ballY);
    }
    aiY = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, aiY));
}

function resetBall(scoredBy) {
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    let direction = (scoredBy === 'player') ? 1 : -1;
    ballSpeedX = direction * (baseBallSpeed + Math.random() * 2);
    ballSpeedY = (Math.random() < 0.5 ? 1 : -1) * (baseBallSpeed * 0.7 + Math.random() * 2);
}

function checkWin() {
    if (playerScore >= WIN_SCORE || aiScore >= WIN_SCORE) {
        gameOver = true;
        gameRunning = false;
        if (playerScore > aiScore) {
            messageElem.textContent = "🎉 Vous avez gagné! 🎉";
        } else {
            messageElem.textContent = "😢 L'IA a gagné! Essayez encore!";
        }
        startBtn.textContent = "Rejouer";
        startBtn.style.display = "inline-block";
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background animation - subtle moving gradient
    let gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#232526");
    gradient.addColorStop(1, themeColors[currentTheme].primary);
    ctx.fillStyle = gradient;
    ctx.globalAlpha = 0.16;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;

    // Middle dashed line
    ctx.setLineDash([18, 15]);
    ctx.strokeStyle = themeColors[currentTheme].primary;
    ctx.lineWidth = 4;
    ctx.shadowColor = themeColors[currentTheme].primary;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;

    // Draw paddles with glow and gradient
    drawPaddle(PLAYER_X, playerY, themeColors[currentTheme].primary, themeColors[currentTheme].secondary);
    drawPaddle(AI_X, aiY, themeColors[currentTheme].secondary, themeColors[currentTheme].primary);

    // Draw ball with glow
    drawBall(ballX, ballY);
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
    ctx.shadowColor = themeColors[currentTheme].ball;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(x, y, BALL_RADIUS, 0, Math.PI * 2);
    let ballGrad = ctx.createRadialGradient(x, y, 3, x, y, BALL_RADIUS);
    ballGrad.addColorStop(0, "#fff");
    ballGrad.addColorStop(0.4, themeColors[currentTheme].ball);
    ballGrad.addColorStop(1, themeColors[currentTheme].primary);
    ctx.fillStyle = ballGrad;
    ctx.fill();
    ctx.restore();
}

// Ball glow effect when hit
function glowBall() {
    let origRadius = BALL_RADIUS;
    let frame = 0;
    function animateGlow() {
        if (frame > 5) return;
        frame++;
        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.arc(ballX, ballY, origRadius + frame * 2, 0, Math.PI * 2);
        ctx.fillStyle = themeColors[currentTheme].ball;
        ctx.shadowColor = themeColors[currentTheme].ball;
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
