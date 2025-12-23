const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- UI Elements ---
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

// --- Game Assets ---
const playerImg = document.getElementById('player-img');

// --- Game State ---
let gameState = 'START';
let score = 0;
let level = 1;
let frameCount = 0;
let playerName = "";
let speedMultiplier = 1;
let nextLevelScore = 100;
let animationId;

// --- Trivia Data (Source: Aditya Birla Group / Seamex) ---
const triviaFacts = [
    "Seamex was established in 2017 to provide a seamless HR experience.",
    "Seamex is powered by 'Poornata', the Group's HRMS software.",
    "Seamex acts as a single point of contact for the entire employee lifecycle.",
    "Seamex handles everything from Onboarding to Exit Management.",
    "Core Value: 'Respect for all' is a key work ethic at Seamex.",
    "Seamex uses 'Cornerstone on Demand' for employee learning.",
    "Seamex is located in Airoli, Navi Mumbai."
];

// --- High Score Logic ---
function getHighScores() {
    const stored = localStorage.getItem('seamexScores');
    return stored ? JSON.parse(stored) : [];
}

function saveHighScore(newScore, name) {
    let scores = getHighScores();
    scores.push({ score: Math.floor(newScore), name: name });
    scores.sort((a, b) => b.score - a.score);
    scores = scores.slice(0, 3);
    localStorage.setItem('seamexScores', JSON.stringify(scores));
    updateHighScoreDisplay();
}

function updateHighScoreDisplay() {
    const scores = getHighScores();
    highScoreList.innerHTML = scores.length 
        ? scores.map(s => `<li>${s.score} - ${s.name}</li>`).join('') 
        : '<li>No scores yet</li>';
}

updateHighScoreDisplay();

// --- RESIZE HANDLING (FIXED) ---
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // FIX: Only access player IF it has been initialized
    if (typeof player !== 'undefined' && player !== null) {
        player.fixPosition();
    }
}
window.addEventListener('resize', resize);
resize();

// --- VALIDATION ---
nameInput.addEventListener('input', () => {
    nameInput.value = nameInput.value.replace(/[^a-zA-Z\s]/g, '');
});

idInput.addEventListener('input', () => {
    idInput.value = idInput.value.replace(/[^0-9]/g, '');
});

document.getElementById('start-btn').addEventListener('click', () => {
    const nameVal = nameInput.value.trim();
    const idVal = idInput.value.trim();
    
    if (!nameVal || /[^a-zA-Z\s]/.test(nameVal)) {
        nameError.style.display = 'block';
        return;
    } else { nameError.style.display = 'none'; }

    if (!idVal || !/^\d+$/.test(idVal)) {
        idError.style.display = 'block';
        return;
    } else { idError.style.display = 'none'; }

    playerName = nameVal;
    startGame();
});

// --- CLASSES ---
class Player {
    constructor() {
        this.width = 60;
        this.height = 60;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height - this.height - 40;
    }
    fixPosition() {
        this.y = canvas.height - this.height - 40;
        if (this.x > canvas.width - this.width) this.x = canvas.width - this.width;
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
        this.size = Math.random() * 25 + 25;
        this.x = Math.random() * (canvas.width - this.size);
        this.y = -this.size;
        this.speed = (Math.random() * 2 + 3) * speedMultiplier;
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
        this.size = Math.random() * 7 + 4;
        this.speedY = Math.random() * 3 + 2;
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

let player = null;
let enemies = [];
let confettis = [];

function startGame() {
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    hud.classList.remove('hidden');
    pauseMenu.classList.add('hidden');
    
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

function levelUp() {
    gameState = 'LEVEL_UP';
    level++;
    nextLevelScore += 100;
    speedMultiplier += 0.2;
    triviaText.innerText = triviaFacts[(level - 2) % triviaFacts.length];
    confettis = Array.from({ length: 100 }, () => new Confetti());
    levelModal.classList.remove('hidden');
}

document.getElementById('continue-btn').addEventListener('click', () => {
    levelModal.classList.add('hidden');
    gameState = 'PLAYING';
    confettis = [];
});

document.getElementById('pause-btn').addEventListener('click', () => {
    if (gameState === 'PLAYING') {
        gameState = 'PAUSED';
        pauseMenu.classList.remove('hidden');
    }
});

document.getElementById('resume-btn').addEventListener('click', () => {
    gameState = 'PLAYING';
    pauseMenu.classList.add('hidden');
    animate();
});

document.getElementById('restart-btn').addEventListener('click', startGame);

function endGame() {
    gameState = 'GAME_OVER';
    hud.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');
    document.getElementById('final-name').innerText = playerName;
    const fs = Math.floor(score);
    finalScoreEl.innerText = fs;
    saveHighScore(fs, playerName);
    bestScoreEl.innerText = getHighScores()[0].score;
}

function animate() {
    if (gameState === 'PAUSED' || gameState === 'GAME_OVER') return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'LEVEL_UP') {
        player.draw();
        enemies.forEach(e => e.draw());
        confettis.forEach(c => { c.update(); c.draw(); });
    } else {
        score += 0.1;
        updateHUD();
        if (score >= nextLevelScore) { levelUp(); }

        player.draw();
        if (Math.random() < 0.03) enemies.push(new Enemy());

        for (let i = enemies.length - 1; i >= 0; i--) {
            enemies[i].update();
            enemies[i].draw();

            // Collision
            const e = enemies[i];
            const p = player;
            if (e.x < p.x + p.width && e.x + e.size > p.x && e.y < p.y + p.height && e.y + e.size > p.y) {
                endGame();
                return;
            }
            if (e.y > canvas.height) enemies.splice(i, 1);
        }
    }
    animationId = requestAnimationFrame(animate);
}

// --- CONTROLS ---
const handleInput = (x) => { if (player && (gameState === 'PLAYING' || gameState === 'LEVEL_UP')) player.moveTo(x); };
window.addEventListener('mousemove', (e) => handleInput(e.clientX));
window.addEventListener('touchmove', (e) => { e.preventDefault(); handleInput(e.touches[0].clientX); }, { passive: false });
