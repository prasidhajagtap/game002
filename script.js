const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('start-screen');
const hud = document.getElementById('game-hud');
const levelModal = document.getElementById('level-modal');
const gameOverScreen = document.getElementById('game-over-screen');
const pauseMenu = document.getElementById('pause-menu');
const playerImg = document.getElementById('player-img');
const nameInput = document.getElementById('player-name');
const idInput = document.getElementById('player-id');
const nameError = document.getElementById('name-error');
const idError = document.getElementById('id-error');
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const triviaText = document.getElementById('trivia-text');
const finalScoreEl = document.getElementById('final-score');
const bestScoreEl = document.getElementById('best-score');

// Game State
let player = null, enemies = [], confettis = [], gameState = 'START';
let score = 0, level = 1, speedMultiplier = 1, nextLevelScore = 100, animationId = null, playerName = "";

const triviaFacts = [
    "Seamex was established in 2017 to provide a seamless HR experience.",
    "Seamex is powered by 'Poornata', the Group's HRMS software.",
    "Seamex acts as a single point of contact for the entire employee lifecycle.",
    "Seamex handles everything from Onboarding to Exit Management.",
    "Core Value: 'Respect for all' is a key work ethic at Seamex.",
    "Seamex uses 'Cornerstone on Demand' for employee learning.",
    "Seamex is located in Airoli, Navi Mumbai."
];

// Classes
class Player {
    constructor() {
        this.width = 80; this.height = 80; // Larger size
        this.x = canvas.width / 2 - 40;
        this.y = canvas.height - 140;
        this.hitPadding = 22; // Forgiving collision
    }
    draw() {
        if (playerImg.complete && playerImg.naturalWidth !== 0) {
            ctx.drawImage(playerImg, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = '#FFC107'; ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
    moveTo(x) {
        this.x = x - this.width / 2;
        this.x = Math.max(0, Math.min(canvas.width - this.width, this.x));
    }
}

class Enemy {
    constructor() {
        this.size = Math.random() * 20 + 30;
        this.x = Math.random() * (canvas.width - this.size);
        this.y = -50;
        this.speed = (Math.random() * 2 + 3.5) * speedMultiplier;
    }
    update() { this.y += this.speed; }
    draw() {
        ctx.fillStyle = '#D32F2F';
        ctx.beginPath(); ctx.arc(this.x + this.size/2, this.y + this.size/2, this.size/2, 0, Math.PI*2); ctx.fill();
    }
}

class Confetti {
    constructor() {
        this.x = Math.random() * canvas.width; this.y = Math.random() * -canvas.height;
        this.color = ['#FFC107', '#D32F2F', '#A01018', '#00C853'][Math.floor(Math.random() * 4)];
        this.size = Math.random() * 6 + 4; this.speedY = Math.random() * 4 + 2;
    }
    update() { this.y += this.speedY; if (this.y > canvas.height) this.y = -20; }
    draw() { ctx.fillStyle = this.color; ctx.fillRect(this.x, this.y, this.size, this.size); }
}

// Helpers
function updateHUD() { scoreEl.innerText = Math.floor(score); levelEl.innerText = level; }

function getHighScores() {
    const s = localStorage.getItem('seamexScores');
    return s ? JSON.parse(s) : [];
}

function updateHighScoreDisplay() {
    const scores = getHighScores();
    const list = document.getElementById('high-score-list');
    list.innerHTML = scores.length ? scores.map(s => `<li>${s.score} - ${s.name}</li>`).join('') : '<li>-</li>';
}

function startGame() {
    document.body.classList.add('game-active');
    startScreen.classList.add('hidden'); gameOverScreen.classList.add('hidden');
    hud.classList.remove('hidden');
    gameState = 'PLAYING'; score = 0; level = 1; speedMultiplier = 1; nextLevelScore = 100;
    enemies = []; confettis = []; player = new Player();
    updateHUD(); if (animationId) cancelAnimationFrame(animationId);
    animate();
}

function endGame() {
    gameState = 'GAME_OVER';
    document.body.classList.remove('game-active');
    hud.classList.add('hidden'); gameOverScreen.classList.remove('hidden');
    document.getElementById('final-name').innerText = playerName;
    finalScoreEl.innerText = Math.floor(score);
    
    let scores = getHighScores();
    scores.push({ score: Math.floor(score), name: playerName });
    scores.sort((a,b) => b.score - a.score);
    localStorage.setItem('seamexScores', JSON.stringify(scores.slice(0, 3)));
    
    bestScoreEl.innerText = scores[0].score;
    updateHighScoreDisplay();
}

function animate() {
    if (gameState === 'PAUSED' || gameState === 'GAME_OVER') return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'LEVEL_UP') {
        player.draw(); enemies.forEach(e => { e.draw(); });
        confettis.forEach(c => { c.update(); c.draw(); });
    } else {
        score += 0.15; updateHUD();
        if (score >= nextLevelScore) {
            gameState = 'LEVEL_UP'; level++; nextLevelScore += 100; speedMultiplier += 0.12;
            triviaText.innerText = triviaFacts[(level - 2) % triviaFacts.length];
            confettis = Array.from({ length: 80 }, () => new Confetti());
            levelModal.classList.remove('hidden');
        }
        player.draw();
        if (Math.random() < 0.04) enemies.push(new Enemy());
        for (let i = enemies.length - 1; i >= 0; i--) {
            let e = enemies[i]; e.update(); e.draw();
            if (e.x + e.size > player.x + player.hitPadding && e.x < player.x + player.width - player.hitPadding &&
                e.y + e.size > player.y + player.hitPadding && e.y < player.y + player.height - player.hitPadding) {
                endGame(); return;
            }
            if (e.y > canvas.height) enemies.splice(i, 1);
        }
    }
    animationId = requestAnimationFrame(animate);
}

// Listeners
window.addEventListener('resize', () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; if(player) player.y = canvas.height - 140; });
canvas.width = window.innerWidth; canvas.height = window.innerHeight;

document.getElementById('start-btn').addEventListener('click', () => {
    const n = nameInput.value.trim(), id = idInput.value.trim();
    if (!n || /[^a-zA-Z\s]/.test(n)) { nameError.style.display = 'block'; return; }
    if (!id || !/^\d+$/.test(id)) { idError.style.display = 'block'; return; }
    playerName = n; nameError.style.display = 'none'; idError.style.display = 'none';
    startGame();
});

const handleInput = (x) => { if (player && (gameState === 'PLAYING' || gameState === 'LEVEL_UP')) player.moveTo(x); };
window.addEventListener('mousemove', (e) => handleInput(e.clientX));
window.addEventListener('touchmove', (e) => { e.preventDefault(); handleInput(e.touches[0].clientX); }, { passive: false });

document.getElementById('pause-btn').addEventListener('click', () => {
    if (gameState === 'PLAYING') {
        gameState = 'PAUSED'; document.getElementById('pause-btn').innerText = '▶'; pauseMenu.classList.remove('hidden');
    } else if (gameState === 'PAUSED') {
        gameState = 'PLAYING'; document.getElementById('pause-btn').innerText = '❚❚'; pauseMenu.classList.add('hidden'); animate();
    }
});

document.getElementById('share-btn').addEventListener('click', () => {
    const msg = `I scored ${Math.floor(score)} on Seamless Dash! I challenge you to beat it on your Poornata App! 🚀`;
    if (navigator.share) {
        navigator.share({ title: 'Seamless Dash Challenge', text: msg, url: window.location.href });
    } else {
        navigator.clipboard.writeText(msg); alert("Challenge copied to clipboard! Share it with your colleagues.");
    }
});

document.getElementById('continue-btn').addEventListener('click', () => { levelModal.classList.add('hidden'); gameState = 'PLAYING'; confettis = []; animate(); });
document.getElementById('resume-btn').addEventListener('click', () => { gameState = 'PLAYING'; document.getElementById('pause-btn').innerText = '❚❚'; pauseMenu.classList.add('hidden'); animate(); });
document.getElementById('restart-btn').addEventListener('click', startGame);
updateHighScoreDisplay();
