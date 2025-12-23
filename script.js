const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Expanded Trivia
const triviaList = [
    "Seamex provides a single point of contact for the entire employee lifecycle.",
    "Poornata is the core HRMS platform for the entire Aditya Birla Group.",
    "Seamex enables digital onboarding for a paperless experience.",
    "The Seamex platform integrates payroll and benefits administration.",
    "Poornata's mobile app allows HR tasks to be completed on the go.",
    "Seamex aims for a 'Seamless Experience Always' in HR service delivery."
];

let player, enemies = [], powerups = [], particles = [], gameState = 'START';
let score = 0, level = 1, playerName = "", poornataId = "", bgOffset = 0;
let shieldActive = false, shieldTime = 0, isPaused = false;

// SOUNDS - Using high-quality web-hosted assets
const sounds = {
    power: new Audio('https://assets.mixkit.co/active_storage/sfx/1103/1103-preview.mp3'),
    hit: new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'),
    lvl: new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3'),
    over: new Audio('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3')
};
let isMuted = false;

// UNLOCK AUDIO for Mobile Browsers
function unlockAudio() {
    Object.values(sounds).forEach(sound => {
        sound.play().then(() => {
            sound.pause();
            sound.currentTime = 0;
        }).catch(() => {/* Silent catch for pre-interaction */});
    });
}

// 1. IMPROVED GRID BACKGROUND
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

class Player {
    constructor() { 
        this.w = 70; this.h = 70;
        this.x = canvas.width / 2 - 35; 
        this.y = canvas.height - 140; 
    }
    draw() {
        ctx.save();
        if (shieldActive) {
            ctx.strokeStyle = '#0984e3';
            ctx.lineWidth = 6;
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#0984e3';
            ctx.beginPath();
            ctx.arc(this.x + 35, this.y + 35, 48, 0, Math.PI * 2);
            ctx.stroke();
        }
        const img = document.getElementById('player-img');
        if (img.complete && img.naturalWidth !== 0) {
            ctx.drawImage(img, this.x, this.y, this.w, this.h);
        } else {
            ctx.fillStyle = '#A01018';
            ctx.fillRect(this.x, this.y, this.w, this.h);
        }
        ctx.restore();
    }
}

// 2. MAIN GAME LOOP
function animate() {
    if (gameState !== 'PLAYING' || isPaused) return;
    drawBackground();

    score += 0.15;
    document.getElementById('score').innerText = Math.floor(score);

    // Level Up Logic
    if (Math.floor(score) > 0 && Math.floor(score) >= level * 100) {
        levelUp(); return;
    }

    // Shield Timer Logic
    if (shieldActive) {
        shieldTime -= 0.016;
        document.getElementById('shield-timer').innerText = Math.ceil(shieldTime);
        if (shieldTime <= 0) {
            shieldActive = false;
            document.getElementById('shield-indicator').classList.add('hidden');
        }
    }

    player.draw();

    // Spawning Logic (Increased rates)
    if (Math.random() < 0.03 + (level * 0.005)) {
        enemies.push({ x: Math.random() * (canvas.width - 30), y: -50, s: 30, spd: 3 + (level * 0.5) });
    }
    // Power-up chance increased to 0.5% for better playability
    if (Math.random() < 0.005) {
        powerups.push({ x: Math.random() * (canvas.width - 30), y: -50 });
    }

    // Process Power-ups
    powerups.forEach((p, i) => {
        p.y += 3;
        ctx.font = "30px Arial";
        ctx.fillText("🛡️", p.x, p.y);
        // Collision
        if (p.x < player.x + 60 && p.x + 30 > player.x && p.y < player.y + 60 && p.y + 30 > player.y) {
            shieldActive = true;
            shieldTime = 8;
            if (!isMuted) sounds.power.play();
            document.getElementById('shield-indicator').classList.remove('hidden');
            powerups.splice(i, 1);
        }
        if (p.y > canvas.height) powerups.splice(i, 1);
    });

    // Process Enemies
    enemies.forEach((e, i) => {
        e.y += e.spd;
        ctx.fillStyle = '#D32F2F';
        ctx.beginPath();
        ctx.arc(e.x + 15, e.y + 15, 15, 0, Math.PI * 2);
        ctx.fill();

        if (e.x < player.x + 55 && e.x + 30 > player.x + 15 && e.y < player.y + 55 && e.y + 30 > player.y + 15) {
            if (shieldActive) {
                if (!isMuted) sounds.hit.play();
                enemies.splice(i, 1);
            } else {
                gameOver();
            }
        }
        if (e.y > canvas.height) enemies.splice(i, 1);
    });

    requestAnimationFrame(animate);
}

function levelUp() {
    gameState = 'LEVEL_UP';
    level++;
    if (!isMuted) sounds.lvl.play();
    document.getElementById('level').innerText = level;
    document.getElementById('trivia-text').innerText = triviaList[level % triviaList.length];
    document.getElementById('level-modal').classList.remove('hidden');
}

function gameOver() {
    gameState = 'OVER';
    if (!isMuted) sounds.over.play();
    document.getElementById('game-hud').classList.add('hidden');
    document.getElementById('game-over-screen').classList.remove('hidden');
    document.getElementById('final-score').innerText = Math.floor(score);
    
    let scores = JSON.parse(localStorage.getItem(`s_${poornataId}`) || '[]');
    scores.push(Math.floor(score));
    scores.sort((a, b) => b - a);
    localStorage.setItem(`s_${poornataId}`, JSON.stringify(scores.slice(0, 5)));
    document.getElementById('best-score').innerText = scores[0];
}

// 3. INITIALIZATION & UI
function start(n, id) {
    unlockAudio(); // Critical for sound
    playerName = n; poornataId = id;
    localStorage.setItem('seamex_session', JSON.stringify({ n, id, exp: Date.now() + 7776000000 }));
    
    gameState = 'PLAYING'; isPaused = false;
    document.querySelectorAll('.screen-box, .overlay-modal').forEach(e => e.classList.add('hidden'));
    document.getElementById('game-hud').classList.remove('hidden');
    document.getElementById('hud-name').innerText = n;
    
    score = 0; level = 1; enemies = []; powerups = []; 
    document.getElementById('level').innerText = "1";
    player = new Player();
    animate();
}

// Validation Logic
const nameInp = document.getElementById('player-name');
const idInp = document.getElementById('player-id');
const startBtn = document.getElementById('start-btn');

function validate() {
    const isNameValid = /^[a-zA-Z\s]+$/.test(nameInp.value) && nameInp.value.length >= 3;
    const isIdValid = /^\d+$/.test(idInp.value) && idInp.value.length >= 4;
    document.getElementById('name-val').style.display = (nameInp.value && !isNameValid) ? 'block' : 'none';
    document.getElementById('id-val').style.display = (idInp.value && !isIdValid) ? 'block' : 'none';
    startBtn.disabled = !(isNameValid && isIdValid);
}

[nameInp, idInp].forEach(el => {
    el.addEventListener('input', validate);
    el.addEventListener('blur', validate);
});

// Controls
document.getElementById('pause-btn').addEventListener('click', () => { 
    isPaused = true; 
    document.getElementById('pause-overlay').classList.remove('hidden'); 
});
document.getElementById('resume-btn').addEventListener('click', () => { 
    isPaused = false; 
    document.getElementById('pause-overlay').classList.add('hidden'); 
    animate(); 
});
document.getElementById('start-btn').addEventListener('click', () => start(nameInp.value, idInp.value));
document.getElementById('quick-start-btn').addEventListener('click', () => start(playerName, poornataId));
document.getElementById('restart-btn').addEventListener('click', () => start(playerName, poornataId));
document.getElementById('menu-btn').addEventListener('click', () => location.reload());
document.getElementById('continue-btn').addEventListener('click', () => { 
    document.getElementById('level-modal').classList.add('hidden'); 
    gameState = 'PLAYING'; 
    animate(); 
});

window.addEventListener('touchmove', (e) => { 
    if(player) player.x = Math.max(0, Math.min(canvas.width - 70, e.touches[0].clientX - 35)); 
}, { passive: false });
window.addEventListener('mousemove', (e) => { 
    if(player) player.x = Math.max(0, Math.min(canvas.width - 70, e.clientX - 35)); 
});

// Restore Session
const sess = JSON.parse(localStorage.getItem('seamex_session'));
if (sess && sess.exp > Date.now()) {
    playerName = sess.n; poornataId = sess.id;
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('returning-user-section').classList.remove('hidden');
    document.getElementById('display-name').innerText = playerName;
}

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
