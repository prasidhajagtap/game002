const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const triviaList = [
    "Seamex provides a single point of contact for the entire employee lifecycle.",
    "Poornata acts as the core HRMS platform for the entire group.",
    "Seamex aims for a 'Seamless Experience Always' in HR services.",
    "Level up is achieved every 100 points in Seamless Dash!",
    "Seamex automates onboarding, payroll, and exit management."
];

let player, enemies = [], powerups = [], particles = [], gameState = 'START';
let score = 0, level = 1, playerName = "", bgY = 0;
let shieldActive = false, shieldTime = 0;

// Corrected Audio Implementation
const sounds = {
    lvlUp: new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3'),
    over: new Audio('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3'),
    power: new Audio('https://assets.mixkit.co/active_storage/sfx/1103/1103-preview.mp3'),
    hit: new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3')
};
let isMuted = false;

// Audio Toggle Logic
document.getElementById('music-toggle').addEventListener('click', function() {
    isMuted = !isMuted;
    this.innerText = isMuted ? "🔇 Sound Off" : "🔊 Sound On";
    Object.values(sounds).forEach(s => s.muted = isMuted);
});

// Particle Class for Collision Animation
class Particle {
    constructor(x, y, color) {
        this.x = x; this.y = y; this.color = color;
        this.size = Math.random() * 4 + 2;
        this.vx = Math.random() * 6 - 3;
        this.vy = Math.random() * 6 - 3;
        this.alpha = 1;
    }
    update() { this.x += this.vx; this.y += this.vy; this.alpha -= 0.03; }
    draw() {
        ctx.save(); ctx.globalAlpha = this.alpha; ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size); ctx.restore();
    }
}

class Player {
    constructor() { this.width = 70; this.height = 70; this.x = canvas.width/2 - 35; this.y = canvas.height - 150; }
    draw() {
        if (shieldActive) {
            ctx.strokeStyle = '#0984e3'; ctx.lineWidth = 6; ctx.beginPath();
            ctx.arc(this.x + 35, this.y + 35, 48, 0, Math.PI * 2); ctx.stroke();
        }
        const img = document.getElementById('player-img');
        if (img.complete) ctx.drawImage(img, this.x, this.y, this.width, this.height);
    }
}

class Enemy {
    constructor() {
        this.size = Math.random() * 20 + 30;
        this.x = Math.random() * (canvas.width - this.size);
        this.y = -60;
        this.speed = (Math.random() * 2 + 3) + (level * 0.4);
    }
    update() { this.y += this.speed; }
    draw() {
        ctx.fillStyle = '#D32F2F'; ctx.beginPath();
        ctx.arc(this.x+this.size/2, this.y+this.size/2, this.size/2, 0, Math.PI*2); ctx.fill();
    }
}

function drawBackground() {
    // Seamless moving background grid
    ctx.strokeStyle = '#f0f0f0'; ctx.lineWidth = 1;
    bgY = (bgY + (2 + level)) % 50;
    for (let x = 0; x <= canvas.width; x += 50) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = bgY; y <= canvas.height; y += 50) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }
}

function animate() {
    if (gameState !== 'PLAYING') return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();

    score += 0.15;
    const currentScore = Math.floor(score);
    document.getElementById('score').innerText = currentScore;

    // Level Up every 100 points
    if (currentScore > 0 && currentScore >= level * 100) {
        gameState = 'LEVEL_UP'; level++;
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
    if (Math.random() < 0.03 + (level * 0.005)) enemies.push(new Enemy());

    particles.forEach((p, i) => { p.update(); p.draw(); if (p.alpha <= 0) particles.splice(i, 1); });

    enemies.forEach((e, i) => {
        e.update(); e.draw();
        // Collision logic
        if (e.x < player.x+60 && e.x+e.size > player.x+10 && e.y < player.y+60 && e.y+e.size > player.y+10) {
            if (shieldActive) {
                // Trigger destruction animation
                for(let j=0; j<12; j++) particles.push(new Particle(e.x+e.size/2, e.y+e.size/2, '#D32F2F'));
                if (!isMuted) sounds.hit.play();
                enemies.splice(i, 1);
            } else {
                gameOver();
            }
        }
    });
    requestAnimationFrame(animate);
}

function gameOver() {
    gameState = 'GAME_OVER';
    if (!isMuted) sounds.over.play();
    document.getElementById('game-hud').classList.add('hidden');
    document.getElementById('game-over-screen').classList.remove('hidden');
    document.getElementById('final-score').innerText = Math.floor(score);
    
    let scores = JSON.parse(localStorage.getItem('seamexScores') || '[]');
    scores.push({ name: playerName, score: Math.floor(score) });
    scores.sort((a,b) => b.score - a.score);
    localStorage.setItem('seamexScores', JSON.stringify(scores.slice(0, 3)));
}

// Input Validation Logic
function validate() {
    const n = document.getElementById('player-name').value;
    const id = document.getElementById('player-id').value;
    const isNameValid = /^[a-zA-Z\s]+$/.test(n);
    const isIdValid = /^\d+$/.test(id);
    document.getElementById('start-btn').disabled = !(isNameValid && isIdValid && n.length > 2);
}
document.getElementById('player-name').addEventListener('input', validate);
document.getElementById('player-id').addEventListener('input', validate);

document.getElementById('start-btn').addEventListener('click', () => { 
    playerName = document.getElementById('player-name').value; 
    start(); 
});
document.getElementById('quick-start-btn').addEventListener('click', start);
document.getElementById('restart-btn').addEventListener('click', () => location.reload());
document.getElementById('continue-btn').addEventListener('click', () => {
    document.getElementById('level-modal').classList.add('hidden');
    gameState = 'PLAYING'; animate();
});

function start() {
    gameState = 'PLAYING';
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-hud').classList.remove('hidden');
    player = new Player(); animate();
}

window.addEventListener('mousemove', (e) => { if(player) player.x = Math.max(0, Math.min(canvas.width - 70, e.clientX - 35)); });
window.addEventListener('touchmove', (e) => { if(player) { e.preventDefault(); player.x = Math.max(0, Math.min(canvas.width - 70, e.touches[0].clientX - 35)); } }, { passive: false });

canvas.width = window.innerWidth; canvas.height = window.innerHeight;
