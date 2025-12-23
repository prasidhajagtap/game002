const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('start-screen');
const hud = document.getElementById('game-hud');
const levelModal = document.getElementById('level-modal');
const gameOverScreen = document.getElementById('game-over-screen');
const playerImg = document.getElementById('player-img');
const nameInput = document.getElementById('player-name');
const idInput = document.getElementById('player-id');
const musicToggle = document.getElementById('music-toggle');

const sounds = {
    lvlUp: new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3'),
    over: new Audio('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3'),
    power: new Audio('https://assets.mixkit.co/active_storage/sfx/1103/1103-preview.mp3')
};
let isMuted = false;

musicToggle.addEventListener('click', () => {
    isMuted = !isMuted;
    musicToggle.innerText = isMuted ? "🔇" : "🔊";
    Object.values(sounds).forEach(s => s.muted = isMuted);
});

let player = null, enemies = [], powerups = [], gameState = 'START';
let score = 0, level = 1, speedMultiplier = 1, nextLevelScore = 100, playerName = "";
let shieldActive = false, shieldTimeRemaining = 0;

const triviaFacts = [
    "Seamex acts as a single point of contact for the employee lifecycle.",
    "Seamex is powered by 'Poornata', the Group's HRMS software.",
    "Seamex handles everything from Onboarding to Exit Management.",
    "Core Value: 'Respect for all' is a key work ethic at Seamex."
];

class Player {
    constructor() {
        this.width = 80; this.height = 80;
        this.x = canvas.width/2 - 40; this.y = canvas.height - 135;
    }
    draw() {
        if (shieldActive) {
            ctx.strokeStyle = (shieldTimeRemaining < 5 && Math.floor(Date.now()/200)%2) ? '#D32F2F' : '#0984e3';
            ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(this.x + 40, this.y + 40, 52, 0, Math.PI * 2); ctx.stroke();
        }
        if (playerImg.complete) ctx.drawImage(playerImg, this.x, this.y, this.width, this.height);
        else { ctx.fillStyle = '#FFC107'; ctx.fillRect(this.x, this.y, this.width, this.height); }
    }
    moveTo(x) { this.x = Math.max(0, Math.min(canvas.width - this.width, x - this.width/2)); }
}

class Enemy {
    constructor() {
        this.size = Math.random() * 20 + 30;
        this.x = Math.random() * (canvas.width - this.size);
        this.y = -60; this.speed = (Math.random() * 2 + 3.2) * speedMultiplier;
    }
    update() { this.y += this.speed; }
    draw() { ctx.fillStyle = '#D32F2F'; ctx.beginPath(); ctx.arc(this.x+this.size/2, this.y+this.size/2, this.size/2, 0, Math.PI*2); ctx.fill(); }
}

class PowerUp {
    constructor() { this.size = 35; this.x = Math.random() * (canvas.width - 35); this.y = -50; this.speed = 3; }
    update() { this.y += this.speed; }
    draw() { ctx.font = "28px Arial"; ctx.fillText("🛡️", this.x, this.y + 25); }
}

function updateHighScoreDisplay() {
    const scores = JSON.parse(localStorage.getItem('seamexScores') || '[]').filter(s => !s.expiry || s.expiry > Date.now());
    document.getElementById('high-score-list').innerHTML = scores.length ? scores.map(s => `<li>${s.score} - ${s.name}</li>`).join('') : '<li>-</li>';
}

function animate() {
    if (gameState === 'PAUSED' || gameState === 'GAME_OVER') return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'PLAYING') {
        score += 0.12; document.getElementById('score').innerText = Math.floor(score);
        if (shieldActive) {
            shieldTimeRemaining -= 0.016;
            document.getElementById('shield-timer').innerText = Math.ceil(shieldTimeRemaining);
            if (shieldTimeRemaining <= 0) { shieldActive = false; document.getElementById('shield-status').classList.add('hidden'); }
        }
        if (score >= nextLevelScore) {
            gameState = 'LEVEL_UP'; level++; nextLevelScore += 120;
            speedMultiplier += (level <= 5) ? 0.05 : 0.15;
            document.getElementById('trivia-text').innerText = triviaFacts[level%triviaFacts.length];
            sounds.lvlUp.play(); levelModal.classList.remove('hidden');
        }

        player.draw();
        if (Math.random() < ((level > 5) ? 0.06 : 0.038)) enemies.push(new Enemy());
        if (Math.random() < 0.003) powerups.push(new PowerUp());

        powerups.forEach((p, i) => {
            p.update(); p.draw();
            if (p.x < player.x+80 && p.x+35 > player.x && p.y < player.y+80 && p.y+35 > player.y) {
                shieldActive = true; shieldTimeRemaining = 30; sounds.power.play();
                document.getElementById('shield-status').classList.remove('hidden'); powerups.splice(i,1);
            }
        });

        enemies.forEach((e, i) => {
            e.update(); e.draw();
            if (!shieldActive && e.x+e.size > player.x+22 && e.x < player.x+58 && e.y+e.size > player.y+22 && e.y < player.y+58) {
                gameState = 'GAME_OVER'; sounds.over.play();
                document.body.classList.replace('game-active', 'game-over');
                hud.classList.add('hidden'); gameOverScreen.classList.remove('hidden');
                document.getElementById('final-score').innerText = Math.floor(score);
                const expiry = Date.now() + (90 * 24 * 60 * 60 * 1000);
                let s = JSON.parse(localStorage.getItem('seamexScores') || '[]');
                s.push({ score: Math.floor(score), name: playerName, expiry });
                s.sort((a,b) => b.score - a.score);
                localStorage.setItem('seamexScores', JSON.stringify(s.slice(0, 3)));
            }
            if (e.y > canvas.height) enemies.splice(i, 1);
        });
    } else { player.draw(); enemies.forEach(e => e.draw()); }
    requestAnimationFrame(animate);
}

document.getElementById('start-btn').addEventListener('click', () => {
    const n = nameInput.value.trim(), id = idInput.value.trim();
    if (!n || !/^[a-zA-Z\s]+$/.test(n) || !/^\d+$/.test(id)) return;
    playerName = n; gameState = 'PLAYING';
    document.body.classList.add('game-active');
    startScreen.classList.add('hidden'); hud.classList.remove('hidden');
    score = 0; level = 1; speedMultiplier = 1; nextLevelScore = 100;
    enemies = []; powerups = []; shieldActive = false;
    player = new Player(); animate();
});

document.getElementById('continue-btn').addEventListener('click', () => { levelModal.classList.add('hidden'); gameState = 'PLAYING'; });
document.getElementById('restart-btn').addEventListener('click', () => location.reload());
window.addEventListener('mousemove', (e) => player && player.moveTo(e.clientX));
window.addEventListener('touchmove', (e) => { e.preventDefault(); player && player.moveTo(e.touches[0].clientX); }, { passive: false });
canvas.width = window.innerWidth; canvas.height = window.innerHeight;
updateHighScoreDisplay();
