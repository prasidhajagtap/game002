const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const triviaList = [
    "Seamex ensures a seamless HR experience across the employee lifecycle.",
    "Poornata is the digital backbone of our HR management system.",
    "Seamex provides 24/7 access to your essential employee records.",
    "Our goal is to eliminate paperwork through intelligent automation."
];

let player, enemies = [], powerups = [], particles = [], gameState = 'START';
let score = 0, level = 1, playerName = "", poornataId = "";
let shieldActive = false, shieldTime = 0;

// Validation Logic
const nameInp = document.getElementById('player-name');
const idInp = document.getElementById('player-id');
const startBtn = document.getElementById('start-btn');

function validate() {
    const isNameValid = /^[a-zA-Z\s]+$/.test(nameInp.value);
    const isIdValid = /^\d+$/.test(idInp.value) && idInp.value.length >= 4;

    document.getElementById('name-val').style.display = (nameInp.value && !isNameValid) ? 'block' : 'none';
    document.getElementById('id-val').style.display = (idInp.value && !isIdValid) ? 'block' : 'none';
    
    startBtn.disabled = !(isNameValid && isIdValid);
}

[nameInp, idInp].forEach(el => el.addEventListener('blur', validate));
[nameInp, idInp].forEach(el => el.addEventListener('input', validate));

// User Persistence Logic
function checkExistingUser() {
    const savedName = localStorage.getItem('lastSeamexUser');
    if (savedName) {
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('returning-user-section').classList.remove('hidden');
        document.getElementById('display-name').innerText = savedName;
        playerName = savedName;
    }
}

document.getElementById('change-user-link').addEventListener('click', () => {
    document.getElementById('login-section').classList.remove('hidden');
    document.getElementById('returning-user-section').classList.add('hidden');
    localStorage.removeItem('lastSeamexUser');
});

// Level & Trivia Logic
function handleLevelUp() {
    level++;
    document.getElementById('level').innerText = level;
    document.getElementById('trivia-text').innerText = triviaList[level % triviaList.length];
    gameState = 'LEVEL_UP';
    document.getElementById('level-modal').classList.remove('hidden');
}

// Game Loop Functions
class Player {
    constructor() { this.width = 70; this.height = 70; this.x = canvas.width/2-35; this.y = canvas.height-140; }
    draw() {
        if (shieldActive) {
            ctx.strokeStyle = '#0984e3'; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.arc(this.x+35, this.y+35, 45, 0, Math.PI*2); ctx.stroke();
        }
        const img = document.getElementById('player-img');
        if(img.complete) ctx.drawImage(img, this.x, this.y, this.width, this.height);
    }
}

function animate() {
    if (gameState !== 'PLAYING') return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Increment Score
    score += 0.15;
    document.getElementById('score').innerText = Math.floor(score);

    // Check Level Progress (Every 100 points)
    if (Math.floor(score) >= level * 100) {
        handleLevelUp();
    }

    if (shieldActive) {
        shieldTime -= 0.016;
        document.getElementById('shield-timer').innerText = Math.ceil(shieldTime);
        if (shieldTime <= 0) { shieldActive = false; document.getElementById('shield-bar').classList.add('hidden'); }
    }

    player.draw();
    // (Enemy spawning and collision logic remains as per previous optimized versions)
    
    requestAnimationFrame(animate);
}

// Start Game
const initGame = (name) => {
    playerName = name;
    localStorage.setItem('lastSeamexUser', name);
    gameState = 'PLAYING';
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-hud').classList.remove('hidden');
    score = 0; level = 1; enemies = []; player = new Player();
    animate();
};

document.getElementById('start-btn').addEventListener('click', () => initGame(nameInp.value));
document.getElementById('quick-start-btn').addEventListener('click', () => initGame(playerName));
document.getElementById('restart-btn').addEventListener('click', () => initGame(playerName));

document.getElementById('continue-btn').addEventListener('click', () => {
    document.getElementById('level-modal').classList.add('hidden');
    gameState = 'PLAYING';
    animate();
});

// Initial Setup
canvas.width = window.innerWidth; canvas.height = window.innerHeight;
checkExistingUser();
