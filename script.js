// 1. SELECT UI ELEMENTS
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('start-screen');
const hud = document.getElementById('game-hud');
const levelModal = document.getElementById('level-modal');
const gameOverScreen = document.getElementById('game-over-screen');
const pauseMenu = document.getElementById('pause-menu');
const nameInput = document.getElementById('player-name');
const idInput = document.getElementById('player-id');
const nameError = document.getElementById('name-error');
const idError = document.getElementById('id-error');
const highScoreList = document.getElementById('high-score-list');
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const triviaText = document.getElementById('trivia-text');
const finalScoreEl = document.getElementById('final-score');
const bestScoreEl = document.getElementById('best-score');
const playerImg = document.getElementById('player-img');
const pauseBtn = document.getElementById('pause-btn');

// 2. GLOBAL GAME STATE
let player = null;
let enemies = [];
let confettis = [];
let gameState = 'START';
let score = 0;
let level = 1;
let speedMultiplier = 1;
let nextLevelScore = 100;
let animationId = null;
let playerName = "";

const triviaFacts = [
    "Seamex was established in 2017 to provide a seamless HR experience.",
    "Seamex is powered by 'Poornata', the Group's HRMS software.",
    "Seamex acts as a single point of contact for the entire employee lifecycle.",
    "Seamex handles everything from Onboarding to Exit Management.",
    "Core Value: 'Respect for all' is a key work ethic at Seamex.",
    "Seamex uses 'Cornerstone on Demand' for employee learning.",
    "Seamex is located in Airoli, Navi Mumbai."
];

// 3. UI & HUD HELPERS (Defined before use)
function updateHUD() {
    scoreEl.innerText = Math.floor(score);
    levelEl.innerText = level;
}

function getHighScores() {
    const stored = localStorage.getItem('seamexScores');
    return stored ? JSON.parse(stored) : [];
}

function updateHighScoreDisplay() {
    const scores = getHighScores();
    highScoreList.innerHTML = scores.length 
        ? scores.map(s => `<li>${s.score} - ${s.name}</li>`).join('') 
        : '<li>No scores yet</li>';
}

function saveHighScore(newScore, name) {
    let scores = getHighScores();
    scores.push({ score: Math.floor(newScore), name: name });
    scores.sort((a, b) => b.score - a.score);
    localStorage.setItem('seamexScores', JSON.stringify(scores.slice(0, 3)));
    updateHighScoreDisplay();
}

// 4. GAME CLASSES
class Player {
    constructor() {
        this.width = 60;
        this.height = 60;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height - this.height - 50;
    }
    fixPosition() {
        this.y = canvas.height - this.height - 50;
    }
    draw() {
        if (playerImg.complete && playerImg.naturalWidth !== 0) {
            ctx.drawImage(playerImg, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = '#FFC107'; // Seamex Amber
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
    moveTo(x) {
        this.x = x - this.width / 2;
        if (this.x < 0) this.x = 0;
        if (this.x > canvas.width - this.width) this.x = canvas.width - this.width;
    }
}

class Enemy {
    constructor() {
        this.size = Math.random() * 20 + 30;
        this.x = Math.random() * (canvas.width - this.size);
        this.y = -this.size;
        this.speed = (Math.random() * 2 + 3.5) * speedMultiplier;
    }
    update() { this.y += this.speed; }
    draw() {
        ctx.fillStyle = '#D32F2F'; // Seamex Red
        ctx.beginPath();
        ctx.arc(this.x + this.size/2, this.y + this.size/2, this.size/2, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Confetti {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * -canvas.height;
        this.color = ['#FFC107', '#D32F2F', '#A01018', '#00C853'][Math.floor(Math.random() * 4)];
        this.size = Math.random() * 6 + 4;
        this.speedY = Math.random() * 4 + 2;
        this.speedX = Math.random() * 2 - 1;
    }
    update() {
        this.y += this.speedY;
        this.x += this.speedX;
        if (this.y > canvas.height) this.y = -20;
    }
    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }
}

// 5. CORE GAME ENGINE
function animate() {
    if (gameState === 'PAUSED' || gameState === 'GAME_OVER') return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'LEVEL_UP') {
        player.draw();
        enemies.forEach(e => e.draw());
        confettis.forEach(c => { c.update(); c.draw(); });
    } else {
        score += 0.15;
        updateHUD();
        
        if (score >= nextLevelScore) {
            gameState = 'LEVEL_UP';
            level++;
            nextLevelScore += 100;
            speedMultiplier += 0.15;
            triviaText.innerText = triviaFacts[(level - 2) % triviaFacts.length];
            confettis = Array.from({ length: 100 }, () => new Confetti());
            levelModal.classList.remove('hidden');
        }

        player.draw();
        if (Math.random() < 0.04) enemies.push(new Enemy());

        for (let i = enemies.length - 1; i >= 0; i--) {
            enemies[i].update();
            enemies[i].draw();

            const e = enemies[i];
            const p = player;
           // Collision with Padding: Obstacle must penetrate deeper into the character
if (e.x + e.size > p.x + p.hitPadding && 
    e.x < p.x + p.width - p.hitPadding && 
    e.y + e.size > p.y + p.hitPadding && 
    e.y < p.y + p.height - p.hitPadding) {
    
    gameState = 'GAME_OVER';
    showGameOver(); // Calling a helper to handle the new screen
    return;
}
            }
            if (e.y > canvas.height) enemies.splice(i, 1);
        }
    }
    animationId = requestAnimationFrame(animate);
}

function startGame() {
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    pauseMenu.classList.add('hidden');
    levelModal.classList.add('hidden');
    hud.classList.remove('hidden');
    
    gameState = 'PLAYING';
    score = 0;
    level = 1;
    speedMultiplier = 1;
    nextLevelScore = 100;
    enemies = [];
    confettis = [];
    player = new Player();
    
    updateHUD();
    if (animationId) cancelAnimationFrame(animationId);
    animate();
}

function showGameOver() {
    hud.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');
    document.getElementById('final-name').innerText = playerName;
    finalScoreEl.innerText = Math.floor(score);
    saveHighScore(score, playerName);
    
    const best = getHighScores()[0].score;
    bestScoreEl.innerText = best;

    // Add Share Button dynamically if it doesn't exist
    if (!document.getElementById('share-btn')) {
        const shareBtn = document.createElement('button');
        shareBtn.id = 'share-btn';
        shareBtn.className = 'share-btn';
        shareBtn.innerText = 'CHALLENGE FRIENDS';
        shareBtn.onclick = shareScore;
        gameOverScreen.appendChild(shareBtn);
    }
}

function shareScore() {
    const text = `I just scored ${Math.floor(score)} on Seamless Dash! Can you beat my high score on the Poornata App? 🚀`;
    if (navigator.share) {
        navigator.share({ title: 'Seamless Dash', text: text, url: window.location.href });
    } else {
        alert("Challenge Copied: " + text);
    }
}

// 6. EVENT LISTENERS
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (player) player.fixPosition();
}
window.addEventListener('resize', resize);
resize();

document.getElementById('start-btn').addEventListener('click', () => {
    const nameVal = nameInput.value.trim();
    const idVal = idInput.value.trim();
    
    if (!nameVal || /[^a-zA-Z\s]/.test(nameVal)) {
        nameError.style.display = 'block';
        return;
    }
    if (!idVal || !/^\d+$/.test(idVal)) {
        idError.style.display = 'block';
        return;
    }

    nameError.style.display = 'none';
    idError.style.display = 'none';
    playerName = nameVal;
    startGame();
});

const handleInput = (x) => {
    if (player && (gameState === 'PLAYING' || gameState === 'LEVEL_UP')) {
        player.moveTo(x);
    }
};

window.addEventListener('mousemove', (e) => handleInput(e.clientX));
window.addEventListener('touchmove', (e) => {
    e.preventDefault();
    handleInput(e.touches[0].clientX);
}, { passive: false });

document.getElementById('continue-btn').addEventListener('click', () => {
    levelModal.classList.add('hidden');
    gameState = 'PLAYING';
    confettis = [];
    animate();
});

pauseBtn.addEventListener('click', () => {
    if (gameState === 'PLAYING') {
        gameState = 'PAUSED';
        pauseBtn.innerText = '▶'; // Change to Play icon
        pauseMenu.classList.remove('hidden');
    } else if (gameState === 'PAUSED') {
        resumeGame();
    }
});
function resumeGame() {
    gameState = 'PLAYING';
    pauseBtn.innerText = '❚❚'; // Change back to Pause icon
    pauseMenu.classList.add('hidden');
    animate();
}

document.getElementById('resume-btn').addEventListener('click', resumeGame);

document.getElementById('resume-btn').addEventListener('click', () => {
    gameState = 'PLAYING';
    pauseMenu.classList.add('hidden');
    animate();
});

document.getElementById('restart-btn').addEventListener('click', startGame);

// Init High Scores on load
updateHighScoreDisplay();
