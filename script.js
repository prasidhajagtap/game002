const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const triviaList = [
    "Seamex provides a single point of contact for the entire employee lifecycle.",
    "Poornata acts as the core HRMS platform for the entire group.",
    "Seamex aims for a 'Seamless Experience Always' in HR services.",
    "Level up is achieved every 100 points in Seamless Dash!",
    "Seamex automates onboarding, payroll, and exit management."
];

// Game Variables
let player, enemies = [], powerups = [], particles = [], gameState = 'START';
let score = 0, level = 1, playerName = "", poornataId = "";
let shieldActive = false, shieldTime = 0;
let animationId;

// Sound Setup
const sounds = {
    lvlUp: new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3'),
    over: new Audio('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3'),
    power: new Audio('https://assets.mixkit.co/active_storage/sfx/1103/1103-preview.mp3')
};
let isMuted = false;

// UI Elements
const nameInp = document.getElementById('player-name');
const idInp = document.getElementById('player-id');
const startBtn = document.getElementById('start-btn');

// Validation Logic
function validate() {
    const isNameValid = /^[a-zA-Z\s]+$/.test(nameInp.value);
    const isIdValid = /^\d+$/.test(idInp.value);

    document.getElementById('name-val').style.display = (nameInp.value && !isNameValid) ? 'block' : 'none';
    document.getElementById('id-val').style.display = (idInp.value && !isIdValid) ? 'block' : 'none';
    
    startBtn.disabled = !(isNameValid && isIdValid && nameInp.value.length > 2);
}

nameInp.addEventListener('blur', validate);
idInp.addEventListener('blur', validate);
nameInp.addEventListener('input', validate);
idInp.addEventListener('input', validate);

// Sticky Session
function checkUser() {
    const saved = localStorage.getItem('lastSeamexUser');
    if (saved) {
        playerName = saved;
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('returning-user-section').classList.remove('hidden');
        document.getElementById('display-name').innerText = saved;
    }
}

document.getElementById('change-user-link').addEventListener('click', () => {
    localStorage.removeItem('lastSeamexUser');
    document.getElementById('login-section').classList.remove('hidden');
    document.getElementById('returning-user-section').classList.add('hidden');
});

// Game Logic
class Player {
    constructor() {
        this.width = 70; this.height = 70;
        this.x = canvas.width/2 - 35; this.y = canvas.height - 140;
    }
    draw() {
        if (shieldActive) {
            ctx.strokeStyle = '#0984e3'; ctx.lineWidth = 5;
            ctx.beginPath(); ctx.arc(this.x + 35, this.y + 35, 45, 0, Math.PI * 2); ctx.stroke();
        }
        const img = document.getElementById('player-img');
        if (img.complete) ctx.drawImage(img, this.x, this.y, this.width, this.height);
        else { ctx.fillStyle = '#A01018'; ctx.fillRect(this.x, this.y, this.width, this.height); }
    }
    update(x) { this.x = Math.max(0, Math.min(canvas.width - this.width, x - this.width/2)); }
}

class Enemy {
    constructor() {
        this.size = Math.random() * 20 + 30;
        this.x = Math.random() * (canvas.width - this.size);
        this.y = -60;
        this.speed = (Math.random() * 2 + 3) + (level * 0.5);
    }
    update() { this.y += this.speed; }
    draw() {
        ctx.fillStyle = '#D32F2F';
        ctx.beginPath(); ctx.arc(this.x+this.size/2, this.y+this.size/2, this.size/2, 0, Math.PI*2); ctx.fill();
    }
}

class PowerUp {
    constructor() { this.x = Math.random() * (canvas.width - 30); this.y = -50; this.speed = 3; }
    update() { this.y += this.speed; }
    draw() { ctx.font = "25px Arial"; ctx.fillText("🛡️", this.x, this.y); }
}

function animate() {
    if (gameState !== 'PLAYING') return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    score += 0.15;
    const currentScore = Math.floor(score);
    document.getElementById('score').innerText = currentScore;

    // Level Up Logic (Every 100 points)
    if (currentScore > 0 && currentScore >= level * 100) {
        gameState = 'LEVEL_UP';
        level++;
        document.getElementById('level').innerText = level;
        document.getElementById('trivia-text').innerText = triviaList[level % triviaList.length];
        document.getElementById('level-modal').classList.remove('hidden');
        if (!isMuted) sounds.lvlUp.play();
        return;
    }

    if (shieldActive) {
        shieldTime -= 0.016;
        document.getElementById('shield-timer').innerText = Math.ceil(shieldTime);
        if (shieldTime <= 0) {
            shieldActive = false;
            document.getElementById('shield-indicator').classList.add('hidden');
        }
    }

    player.draw();

    if (Math.random() < 0.03 + (level * 0.01)) enemies.push(new Enemy());
    if (Math.random() < 0.002) powerups.push(new PowerUp());

    powerups.forEach((p, i) => {
        p.update(); p.draw();
        if (p.x < player.x+70 && p.x+30 > player.x && p.y < player.y+70 && p.y+30 > player.y) {
            shieldActive = true; shieldTime = 8;
            document.getElementById('shield-indicator').classList.remove('hidden');
            if (!isMuted) sounds.power.play();
            powerups.splice(i, 1);
        }
    });

    enemies.forEach((e, i) => {
        e.update(); e.draw();
        if (e.x < player.x+55 && e.x+e.size > player.x+15 && e.y < player.y+55 && e.y+e.size > player.y+15) {
            if (shieldActive) {
                enemies.splice(i, 1);
            } else {
                gameOver();
            }
        }
        if (e.y > canvas.height) enemies.splice(i, 1);
    });

    animationId = requestAnimationFrame(animate);
}

function gameOver() {
    gameState = 'GAME_OVER';
    cancelAnimationFrame(animationId);
    if (!isMuted) sounds.over.play();
    document.getElementById('game-hud').classList.add('hidden');
    document.getElementById('game-over-screen').classList.remove('hidden');
    document.getElementById('final-score').innerText = Math.floor(score);
    
    let scores = JSON.parse(localStorage.getItem('seamexScores') || '[]');
    scores.push({ name: playerName, score: Math.floor(score) });
    scores.sort((a,b) => b.score - a.score);
    localStorage.setItem('seamexScores', JSON.stringify(scores.slice(0, 3)));
    document.getElementById('best-score').innerText = scores[0].score;
}

function start() {
    localStorage.setItem('lastSeamexUser', playerName);
    gameState = 'PLAYING';
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('game-hud').classList.remove('hidden');
    score = 0; level = 1; enemies = []; powerups = [];
    player = new Player();
    animate();
}

// Event Listeners
document.getElementById('start-btn').addEventListener('click', () => { playerName = nameInp.value; start(); });
document.getElementById('quick-start-btn').addEventListener('click', start);
document.getElementById('restart-btn').addEventListener('click', start);
document.getElementById('continue-btn').addEventListener('click', () => {
    document.getElementById('level-modal').classList.add('hidden');
    gameState = 'PLAYING';
    animate();
});

window.addEventListener('mousemove', (e) => { if(player) player.update(e.clientX); });
window.addEventListener('touchmove', (e) => { if(player) { e.preventDefault(); player.update(e.touches[0].clientX); } }, { passive: false });

document.getElementById('music-toggle').addEventListener('click', function() {
    isMuted = !isMuted;
    this.innerText = isMuted ? "🔇" : "🔊";
});

// Load High Scores
function loadScores() {
    const scores = JSON.parse(localStorage.getItem('seamexScores') || '[]');
    document.getElementById('score-body').innerHTML = scores.map((s, i) => `<tr><td>${i+1}</td><td>${s.name}</td><td>${s.score}</td></tr>`).join('');
}

canvas.width = window.innerWidth; canvas.height = window.innerHeight;
loadScores();
checkUser();
