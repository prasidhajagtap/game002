const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const triviaList = [
    "Seamex ensures a seamless HR experience across the employee lifecycle.",
    "Poornata acts as the digital backbone of our HR management system.",
    "Seamex provides 24/7 access to essential employee records.",
    "Our goal is to eliminate paperwork through intelligent automation.",
    "Seamex handles everything from Onboarding to Exit Management."
];

let player, enemies = [], powerups = [], particles = [], gameState = 'START';
let score = 0, level = 1, playerName = "", poornataId = "", bgOffset = 0;
let shieldActive = false, shieldTime = 0, animationId, isPaused = false;

const sounds = {
    lvlUp: new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3'),
    over: new Audio('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3'),
    power: new Audio('https://assets.mixkit.co/active_storage/sfx/1103/1103-preview.mp3'),
    hit: new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3')
};
let isMuted = false;

// 1. GRID BACKGROUND
function drawBackground() {
    ctx.fillStyle = "#f8f9fa";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#e9ecef";
    ctx.lineWidth = 1;
    bgOffset = (bgOffset + 2 + level) % 40;
    for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = bgOffset; y < canvas.height; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }
}

// 2. PARTICLES
class Particle {
    constructor(x, y, color) {
        this.x = x; this.y = y; this.color = color;
        this.size = Math.random() * 5 + 2;
        this.vx = Math.random() * 8 - 4;
        this.vy = Math.random() * 8 - 4;
        this.alpha = 1;
    }
    update() { this.x += this.vx; this.y += this.vy; this.alpha -= 0.02; }
    draw() {
        ctx.save(); ctx.globalAlpha = this.alpha; ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size); ctx.restore();
    }
}

// 3. GAME OBJECTS
class Player {
    constructor() { this.width = 70; this.height = 70; this.x = canvas.width/2-35; this.y = canvas.height-140; }
    draw() {
        if (shieldActive) {
            ctx.strokeStyle = '#0984e3'; ctx.lineWidth = 6; ctx.beginPath();
            ctx.arc(this.x+35, this.y+35, 45, 0, Math.PI*2); ctx.stroke();
        }
        const img = document.getElementById('player-img');
        if (img.complete && img.naturalHeight !== 0) ctx.drawImage(img, this.x, this.y, this.width, this.height);
        else { ctx.fillStyle = '#A01018'; ctx.fillRect(this.x, this.y, this.width, this.height); }
    }
}

class Enemy {
    constructor() {
        this.size = Math.random() * 15 + 25;
        this.x = Math.random() * (canvas.width - this.size);
        this.y = -50;
        this.speed = (Math.random() * 3 + 3) + (level * 0.4);
    }
    update() { this.y += this.speed; }
    draw() { ctx.fillStyle = '#D32F2F'; ctx.beginPath(); ctx.arc(this.x+this.size/2, this.y+this.size/2, this.size/2, 0, Math.PI*2); ctx.fill(); }
}

class PowerUp {
    constructor() {
        this.x = Math.random() * (canvas.width - 30); this.y = -50; this.speed = 3;
    }
    update() { this.y += this.speed; }
    draw() { ctx.font = "24px Arial"; ctx.fillText("🛡️", this.x, this.y); }
}

// 4. CORE ENGINE
function animate() {
    if (gameState !== 'PLAYING' || isPaused) return;
    drawBackground();

    score += 0.15;
    document.getElementById('score').innerText = Math.floor(score);

    if (Math.floor(score) > 0 && Math.floor(score) >= level * 100) { levelUp(); return; }

    if (shieldActive) {
        shieldTime -= 0.016;
        document.getElementById('shield-timer').innerText = Math.ceil(shieldTime);
        if (shieldTime <= 0) { shieldActive = false; document.getElementById('shield-indicator').classList.add('hidden'); }
    }

    player.draw();
    if (Math.random() < 0.03 + (level * 0.005)) enemies.push(new Enemy());
    if (Math.random() < 0.003) powerups.push(new PowerUp()); // Power-up spawning restored

    particles.forEach((p, i) => { p.update(); p.draw(); if (p.alpha <= 0) particles.splice(i, 1); });

    powerups.forEach((pu, i) => {
        pu.update(); pu.draw();
        if (pu.x < player.x+60 && pu.x+30 > player.x && pu.y < player.y+60 && pu.y+30 > player.y) {
            shieldActive = true; shieldTime = 8;
            document.getElementById('shield-indicator').classList.remove('hidden');
            if(!isMuted) sounds.power.play();
            powerups.splice(i, 1);
        }
    });

    enemies.forEach((e, i) => {
        e.update(); e.draw();
        if (e.x < player.x+55 && e.x+e.size > player.x+15 && e.y < player.y+55 && e.y+e.size > player.y+15) {
            if (shieldActive) {
                for(let j=0; j<15; j++) particles.push(new Particle(e.x+e.size/2, e.y+e.size/2, '#D32F2F'));
                if(!isMuted) sounds.hit.play();
                enemies.splice(i, 1);
            } else { gameOver(); }
        }
        if (e.y > canvas.height) enemies.splice(i, 1);
    });

    animationId = requestAnimationFrame(animate);
}

// 5. UI & PERSISTENCE
document.getElementById('pause-btn').addEventListener('click', () => {
    isPaused = !isPaused;
    document.getElementById('pause-btn').innerText = isPaused ? "▶" : "❚❚";
    if (!isPaused) animate();
});

document.getElementById('share-btn').addEventListener('click', () => {
    const msg = `I just dashed ${Math.floor(score)} points on Seamless Dash! 🚀\nDownload the Seamex App: https://seamex.app.link/download`;
    if (navigator.share) {
        navigator.share({ title: 'Seamless Dash Challenge', text: msg });
    } else {
        navigator.clipboard.writeText(msg); alert("Challenge copied to clipboard!");
    }
});

// Rest of validation and start logic remains as established
function checkSession() {
    const session = JSON.parse(localStorage.getItem('seamex_session'));
    if (session && session.expiry > Date.now()) {
        playerName = session.name; poornataId = session.id;
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('returning-user-section').classList.remove('hidden');
        document.getElementById('display-name').innerText = playerName;
        const scores = JSON.parse(localStorage.getItem(`scores_${poornataId}`) || '[]');
        document.getElementById('user-top-scores').innerHTML = scores.slice(0, 3).map(s => `<li>${s} pts</li>`).join('');
    }
}

function levelUp() {
    gameState = 'LEVEL_UP';
    if(!isMuted) sounds.lvlUp.play();
    document.getElementById('level').innerText = ++level;
    document.getElementById('trivia-text').innerText = triviaList[level % triviaList.length];
    document.getElementById('level-modal').classList.remove('hidden');
}

function gameOver() {
    gameState = 'GAME_OVER';
    if(!isMuted) sounds.over.play();
    document.getElementById('game-hud').classList.add('hidden');
    document.getElementById('game-over-screen').classList.remove('hidden');
    document.getElementById('final-score').innerText = Math.floor(score);
    let s = JSON.parse(localStorage.getItem(`scores_${poornataId}`) || '[]');
    s.push(Math.floor(score)); s.sort((a,b)=>b-a);
    localStorage.setItem(`scores_${poornataId}`, JSON.stringify(s.slice(0,5)));
    document.getElementById('best-score').innerText = s[0];
}

function initGame(name, id) {
    playerName = name; poornataId = id;
    localStorage.setItem('seamex_session', JSON.stringify({ name, id, expiry: Date.now() + 7776000000 }));
    gameState = 'PLAYING'; isPaused = false;
    document.querySelectorAll('.screen-box, .overlay-modal').forEach(el => el.classList.add('hidden'));
    document.getElementById('game-hud').classList.remove('hidden');
    score = 0; level = 1; enemies = []; powerups = []; player = new Player();
    animate();
}

document.getElementById('start-btn').addEventListener('click', () => initGame(document.getElementById('player-name').value, document.getElementById('player-id').value));
document.getElementById('quick-start-btn').addEventListener('click', () => initGame(playerName, poornataId));
document.getElementById('restart-btn').addEventListener('click', () => initGame(playerName, poornataId));
document.getElementById('continue-btn').addEventListener('click', () => { document.getElementById('level-modal').classList.add('hidden'); gameState = 'PLAYING'; animate(); });

window.addEventListener('mousemove', (e) => { if(player) player.x = Math.max(0, Math.min(canvas.width-70, e.clientX-35)); });
window.addEventListener('touchmove', (e) => { if(player) { e.preventDefault(); player.x = Math.max(0, Math.min(canvas.width-70, e.touches[0].clientX-35)); } }, { passive: false });

canvas.width = window.innerWidth; canvas.height = window.innerHeight;
checkSession();
