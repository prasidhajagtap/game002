const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const triviaList = [
    "Seamex ensures a seamless HR experience across the employee lifecycle.",
    "Poornata acts as the digital backbone of our HR management system.",
    "Seamex provides 24/7 access to essential employee records.",
    "Our goal is to eliminate paperwork through intelligent automation.",
    "Seamex handles everything from Onboarding to Exit Management."
];

// Core Game Variables
let player, enemies = [], powerups = [], particles = [], gameState = 'START';
let score = 0, level = 1, playerName = "", poornataId = "";
let shieldActive = false, shieldTime = 0, animationId;

// Audio Setup
const sounds = {
    lvlUp: new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3'),
    over: new Audio('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3'),
    power: new Audio('https://assets.mixkit.co/active_storage/sfx/1103/1103-preview.mp3'),
    hit: new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3')
};
let isMuted = false;

// 1. STICKY SESSION LOGIC (90 Days)
function checkSession() {
    const session = JSON.parse(localStorage.getItem('seamex_session'));
    if (session && session.expiry > Date.now()) {
        playerName = session.name;
        poornataId = session.id;
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('returning-user-section').classList.remove('hidden');
        document.getElementById('display-name').innerText = playerName;
        loadUserScores();
    }
}

function loadUserScores() {
    const scores = JSON.parse(localStorage.getItem(`scores_${poornataId}`) || '[]');
    document.getElementById('user-top-scores').innerHTML = scores.slice(0, 3).map(s => `<li>${s} pts</li>`).join('') || '<li>No scores yet</li>';
}

// 2. VALIDATION LOGIC
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
[nameInp, idInp].forEach(el => { el.addEventListener('input', validate); el.addEventListener('blur', validate); });

// 3. GAME OBJECTS
class Player {
    constructor() { this.width = 70; this.height = 70; this.x = canvas.width/2 - 35; this.y = canvas.height - 150; }
    draw() {
        if (shieldActive) {
            ctx.strokeStyle = '#0984e3'; ctx.lineWidth = 5; ctx.beginPath();
            ctx.arc(this.x + 35, this.y + 35, 48, 0, Math.PI * 2); ctx.stroke();
        }
        const img = document.getElementById('player-img');
        if (img.complete && img.naturalWidth !== 0) ctx.drawImage(img, this.x, this.y, this.width, this.height);
        else { ctx.fillStyle = '#A01018'; ctx.fillRect(this.x, this.y, this.width, this.height); }
    }
}

class Enemy {
    constructor() {
        this.size = Math.random() * 20 + 30;
        this.x = Math.random() * (canvas.width - this.size);
        this.y = -60;
        this.speed = (Math.random() * 2 + 3) + (level * 0.5);
    }
    update() { this.y += this.speed; }
    draw() { ctx.fillStyle = '#D32F2F'; ctx.beginPath(); ctx.arc(this.x+this.size/2, this.y+this.size/2, this.size/2, 0, Math.PI*2); ctx.fill(); }
}

class Particle {
    constructor(x, y) {
        this.x = x; this.y = y; this.size = Math.random() * 4 + 2;
        this.vx = Math.random() * 6 - 3; this.vy = Math.random() * 6 - 3; this.alpha = 1;
    }
    update() { this.x += this.vx; this.y += this.vy; this.alpha -= 0.02; }
    draw() { ctx.globalAlpha = this.alpha; ctx.fillStyle = '#D32F2F'; ctx.fillRect(this.x, this.y, this.size, this.size); ctx.globalAlpha = 1; }
}

// 4. MAIN ENGINE
function animate() {
    if (gameState !== 'PLAYING') return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    score += 0.15;
    document.getElementById('score').innerText = Math.floor(score);

    if (Math.floor(score) > 0 && Math.floor(score) >= level * 100) {
        levelUp(); return;
    }

    if (shieldActive) {
        shieldTime -= 0.016;
        document.getElementById('shield-timer').innerText = Math.ceil(shieldTime);
        if (shieldTime <= 0) { shieldActive = false; document.getElementById('shield-indicator').classList.add('hidden'); }
    }

    player.draw();
    if (Math.random() < 0.03 + (level * 0.005)) enemies.push(new Enemy());

    particles.forEach((p, i) => { p.update(); p.draw(); if (p.alpha <= 0) particles.splice(i, 1); });

    enemies.forEach((e, i) => {
        e.update(); e.draw();
        if (e.x < player.x+60 && e.x+e.size > player.x+10 && e.y < player.y+60 && e.y+e.size > player.y+10) {
            if (shieldActive) {
                for(let j=0; j<10; j++) particles.push(new Particle(e.x+e.size/2, e.y+e.size/2));
                if(!isMuted) sounds.hit.play();
                enemies.splice(i, 1);
            } else { endGame(); }
        }
        if (e.y > canvas.height) enemies.splice(i, 1);
    });

    animationId = requestAnimationFrame(animate);
}

function levelUp() {
    gameState = 'LEVEL_UP';
    if (!isMuted) sounds.lvlUp.play();
    document.getElementById('level').innerText = ++level;
    document.getElementById('trivia-text').innerText = triviaList[level % triviaList.length];
    document.getElementById('level-modal').classList.remove('hidden');
}

function endGame() {
    gameState = 'GAME_OVER';
    if (!isMuted) sounds.over.play();
    document.getElementById('game-hud').classList.add('hidden');
    document.getElementById('game-over-screen').classList.remove('hidden');
    document.getElementById('final-score').innerText = Math.floor(score);
    
    let userScores = JSON.parse(localStorage.getItem(`scores_${poornataId}`) || '[]');
    userScores.push(Math.floor(score));
    userScores.sort((a,b) => b-a);
    localStorage.setItem(`scores_${poornataId}`, JSON.stringify(userScores.slice(0, 5)));
    document.getElementById('best-score').innerText = userScores[0];
}

// 5. INITIALIZATION
function init(name, id) {
    playerName = name; poornataId = id;
    const expiry = Date.now() + (90 * 24 * 60 * 60 * 1000);
    localStorage.setItem('seamex_session', JSON.stringify({ name, id, expiry }));
    
    gameState = 'PLAYING';
    document.querySelectorAll('.screen-box, .overlay-modal').forEach(el => el.classList.add('hidden'));
    document.getElementById('game-hud').classList.remove('hidden');
    score = 0; level = 1; enemies = []; player = new Player();
    animate();
}

document.getElementById('start-btn').addEventListener('click', () => init(nameInp.value, idInp.value));
document.getElementById('quick-start-btn').addEventListener('click', () => init(playerName, poornataId));
document.getElementById('continue-btn').addEventListener('click', () => { document.getElementById('level-modal').classList.add('hidden'); gameState = 'PLAYING'; animate(); });
document.getElementById('restart-btn').addEventListener('click', () => init(playerName, poornataId));
document.getElementById('change-user-link').addEventListener('click', () => { localStorage.removeItem('seamex_session'); location.reload(); });
document.getElementById('music-toggle').addEventListener('click', function() { isMuted = !isMuted; this.innerText = isMuted ? "🔇 Sound Off" : "🔊 Sound On"; Object.values(sounds).forEach(s => s.muted = isMuted); });

// 6. CONTROLS
const handleMove = (x) => { if(player) player.x = Math.max(0, Math.min(canvas.width - 70, x - 35)); };
window.addEventListener('mousemove', (e) => handleMove(e.clientX));
window.addEventListener('touchmove', (e) => { e.preventDefault(); handleMove(e.touches[0].clientX); }, { passive: false });

canvas.width = window.innerWidth; canvas.height = window.innerHeight;
checkSession();
