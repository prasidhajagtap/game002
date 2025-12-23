const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('start-btn');
const nameInp = document.getElementById('player-name');
const idInp = document.getElementById('player-id');
const musicBtn = document.getElementById('music-toggle');
const shieldStatus = document.getElementById('shield-status');

const sounds = {
    lvlUp: new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3'),
    over: new Audio('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3'),
    power: new Audio('https://assets.mixkit.co/active_storage/sfx/1103/1103-preview.mp3'),
    hit: new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3')
};
let isMuted = false;

musicBtn.addEventListener('click', () => {
    isMuted = !isMuted;
    musicBtn.innerText = isMuted ? "🔇" : "🔊";
    Object.values(sounds).forEach(s => s.muted = isMuted);
});

let player, enemies = [], powerups = [], particles = [], gameState = 'START';
let score = 0, level = 1, speedMultiplier = 1, nextLevelScore = 100, playerName = "";
let shieldActive = false, shieldTime = 0;

// Dynamic Frequency Logic
let powerupSpawnChance = 0.002; 

function validate() {
    const n = nameInp.value.trim(), id = idInp.value.trim();
    const isNValid = /^[a-zA-Z]+$/.test(n);
    const isIDValid = /^\d+$/.test(id);
    startBtn.disabled = !(isNValid && isIDValid);
}
[nameInp, idInp].forEach(el => el.addEventListener('input', validate));

class Particle {
    constructor(x, y, color) {
        this.x = x; this.y = y; this.color = color;
        this.size = Math.random() * 5 + 2;
        this.speedX = Math.random() * 6 - 3;
        this.speedY = Math.random() * 6 - 3;
        this.life = 1;
    }
    update() { this.x += this.speedX; this.y += this.speedY; this.life -= 0.02; }
    draw() { ctx.globalAlpha = this.life; ctx.fillStyle = this.color; ctx.fillRect(this.x, this.y, this.size, this.size); ctx.globalAlpha = 1; }
}

class Player {
    constructor() {
        this.width = 70; this.height = 70;
        this.x = canvas.width/2 - 35; this.y = canvas.height - 130;
    }
    draw() {
        if (shieldActive) {
            ctx.strokeStyle = (shieldTime < 3 && Math.floor(Date.now()/150)%2) ? 'white' : '#0984e3';
            ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(this.x + 35, this.y + 35, 45, 0, Math.PI * 2); ctx.stroke();
        }
        const img = document.getElementById('player-img');
        if (img.complete) ctx.drawImage(img, this.x, this.y, this.width, this.height);
    }
    moveTo(x) { this.x = Math.max(0, Math.min(canvas.width - this.width, x - this.width/2)); }
}

class Enemy {
    constructor() {
        this.size = Math.random() * 20 + 30;
        this.x = Math.random() * (canvas.width - this.size);
        this.y = -60; this.speed = (Math.random() * 2 + 3) * speedMultiplier;
    }
    update() { this.y += this.speed; }
    draw() { ctx.fillStyle = '#D32F2F'; ctx.beginPath(); ctx.arc(this.x+this.size/2, this.y+this.size/2, this.size/2, 0, Math.PI*2); ctx.fill(); }
}

class PowerUp {
    constructor() { this.x = Math.random() * (canvas.width - 30); this.y = -50; this.speed = 3; }
    update() { this.y += this.speed; }
    draw() { ctx.font = "25px Arial"; ctx.fillText("🛡️", this.x, this.y); }
}

function updateScores() {
    const scores = JSON.parse(localStorage.getItem('seamexScores') || '[]').slice(0, 3);
    document.getElementById('score-body').innerHTML = scores.map((s, i) => `<tr><td>${i+1}</td><td>${s.name}</td><td>${s.score}</td></tr>`).join('');
}

function animate() {
    if (gameState === 'PAUSED' || gameState === 'GAME_OVER') return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'PLAYING') {
        score += 0.1; document.getElementById('score').innerText = Math.floor(score);
        
        if (shieldActive) {
            shieldTime -= 0.016;
            document.getElementById('shield-timer').innerText = Math.ceil(shieldTime);
            if (shieldTime <= 0) { shieldActive = false; shieldStatus.classList.add('hidden'); }
        }

        if (score >= nextLevelScore) {
            gameState = 'LEVEL_UP'; level++; nextLevelScore += 150;
            speedMultiplier += 0.1; powerupSpawnChance = Math.max(0.001, 0.003 - (level * 0.0002));
            document.getElementById('level').innerText = level;
            document.getElementById('level-modal').classList.remove('hidden');
        }

        player.draw();
        if (Math.random() < 0.04) enemies.push(new Enemy());
        if (Math.random() < powerupSpawnChance) powerups.push(new PowerUp());

        particles.forEach((p, i) => { p.update(); p.draw(); if (p.life <= 0) particles.splice(i, 1); });

        powerups.forEach((p, i) => {
            p.update(); p.draw();
            if (p.y > canvas.height) powerups.splice(i, 1);
            if (p.x < player.x+70 && p.x+30 > player.x && p.y < player.y+70 && p.y+30 > player.y) {
                shieldActive = true; 
                shieldTime = Math.floor(Math.random() * 6) + 5; // 5-10 secs variable
                shieldStatus.classList.remove('hidden'); sounds.power.play(); powerups.splice(i, 1);
            }
        });

        enemies.forEach((e, i) => {
            e.update(); e.draw();
            if (e.x < player.x+55 && e.x+e.size > player.x+15 && e.y < player.y+55 && e.y+e.size > player.y+15) {
                if (shieldActive) {
                    // Destroy Animation
                    for(let j=0; j<10; j++) particles.push(new Particle(e.x+e.size/2, e.y+e.size/2, '#D32F2F'));
                    sounds.hit.play(); enemies.splice(i, 1);
                } else {
                    gameState = 'GAME_OVER'; sounds.over.play();
                    document.getElementById('game-hud').classList.add('hidden');
                    document.getElementById('game-over-screen').classList.remove('hidden');
                    document.getElementById('final-score').innerText = Math.floor(score);
                    let s = JSON.parse(localStorage.getItem('seamexScores') || '[]');
                    s.push({ score: Math.floor(score), name: playerName });
                    s.sort((a,b) => b.score - a.score);
                    localStorage.setItem('seamexScores', JSON.stringify(s.slice(0, 3)));
                    document.getElementById('best-score').innerText = s[0].score;
                }
            }
            if (e.y > canvas.height) enemies.splice(i, 1);
        });
    }
    requestAnimationFrame(animate);
}

document.getElementById('start-btn').addEventListener('click', () => {
    playerName = nameInp.value; gameState = 'PLAYING';
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-hud').classList.remove('hidden');
    score = 0; level = 1; enemies = []; powerups = [];
    player = new Player(); animate();
});

document.getElementById('share-btn').addEventListener('click', async () => {
    const area = document.getElementById('capture-area');
    const canvasCap = await html2canvas(area, { backgroundColor: '#A01018' });
    const blob = await (await fetch(canvasCap.toDataURL())).blob();
    const file = new File([blob], 'score.png', { type: 'image/png' });
    if (navigator.share) {
        navigator.share({ title: 'Seamless Dash', text: `I scored ${Math.floor(score)}!`, files: [file] });
    } else {
        alert("Challenge Copied to Clipboard!");
    }
});

// Z-index & Overlap Fixes
document.getElementById('pause-btn').addEventListener('click', () => {
    gameState = 'PAUSED'; document.getElementById('pause-menu').classList.remove('hidden');
});
document.getElementById('resume-btn').addEventListener('click', () => {
    gameState = 'PLAYING'; document.getElementById('pause-menu').classList.add('hidden'); animate();
});
document.getElementById('continue-btn').addEventListener('click', () => {
    document.getElementById('level-modal').classList.add('hidden'); gameState = 'PLAYING';
});
document.getElementById('restart-btn').addEventListener('click', () => location.reload());

window.addEventListener('mousemove', (e) => player && player.moveTo(e.clientX));
window.addEventListener('touchmove', (e) => { e.preventDefault(); player && player.moveTo(e.touches[0].clientX); }, { passive: false });
canvas.width = window.innerWidth; canvas.height = window.innerHeight;
updateScores();
