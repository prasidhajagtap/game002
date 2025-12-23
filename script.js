const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const triviaList = [
    "Seamex provides a single point of contact for the entire employee lifecycle.",
    "Poornata is the core HRMS platform for the entire Aditya Birla Group.",
    "Seamex enables digital onboarding for a paperless experience.",
    "The Seamex platform integrates payroll and benefits administration.",
    "Poornata allows employees to manage performance goals globally.",
    "Seamex aims for a 'Seamless Experience Always' in HR service delivery.",
    "Over 100,000 group employees use Poornata for HR self-service.",
    "Seamex uses automation to speed up exit clearance processes.",
    "Poornata's mobile app allows HR tasks to be completed on the go.",
    "Seamex support centers operate with high-efficiency SLA standards.",
    "Poornata stores employee data securely with advanced encryption.",
    "Seamex streamlines medical insurance and claim reimbursements.",
    "Poornata helps in succession planning across group companies.",
    "Seamex provides real-time HR analytics to business leaders.",
    "The Seamex 'Helpdesk' uses AI to answer common HR queries."
];

let player, enemies = [], powerups = [], particles = [], gameState = 'START';
let score = 0, level = 1, playerName = "", poornataId = "", bgOffset = 0;
let shieldActive = false, shieldTime = 0, animationId, isPaused = false;

// SOUNDS
const sounds = {
    power: new Audio('https://assets.mixkit.co/active_storage/sfx/1103/1103-preview.mp3'),
    hit: new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'),
    lvl: new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3'),
    over: new Audio('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3')
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

// 2. GAME CLASSES
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
        this.size = 30; this.x = Math.random() * (canvas.width - 30); this.y = -50;
        this.speed = (Math.random() * 2 + 3) + (level * 0.5);
    }
    update() { this.y += this.speed; }
    draw() { ctx.fillStyle = '#D32F2F'; ctx.beginPath(); ctx.arc(this.x+15, this.y+15, 15, 0, Math.PI*2); ctx.fill(); }
}

class PowerUp {
    constructor() { this.x = Math.random() * (canvas.width - 30); this.y = -50; this.speed = 3; }
    update() { this.y += this.speed; }
    draw() { ctx.font = "24px Arial"; ctx.fillText("🛡️", this.x, this.y); }
}

// 3. ENGINE
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
    if (Math.random() < 0.002) powerups.push(new PowerUp());

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
        if (e.x < player.x+55 && e.x+30 > player.x+15 && e.y < player.y+55 && e.y+30 > player.y+15) {
            if (shieldActive) { if(!isMuted) sounds.hit.play(); enemies.splice(i, 1); }
            else { endGame(); }
        }
        if (e.y > canvas.height) enemies.splice(i, 1);
    });

    animationId = requestAnimationFrame(animate);
}

function levelUp() {
    gameState = 'LEVEL_UP';
    if(!isMuted) sounds.lvl.play();
    level++;
    document.getElementById('level').innerText = level;
    document.getElementById('trivia-text').innerText = triviaList[level % triviaList.length];
    document.getElementById('level-modal').classList.remove('hidden');
}

function endGame() {
    gameState = 'GAME_OVER';
    if(!isMuted) sounds.over.play();
    document.getElementById('game-hud').classList.add('hidden');
    document.getElementById('game-over-screen').classList.remove('hidden');
    document.getElementById('final-score').innerText = Math.floor(score);
    
    let userScores = JSON.parse(localStorage.getItem(`scores_${poornataId}`) || '[]');
    userScores.push(Math.floor(score));
    userScores.sort((a,b) => b-a);
    localStorage.setItem(`scores_${poornataId}`, JSON.stringify(userScores.slice(0, 5)));
    document.getElementById('best-score').innerText = userScores[0];
}

// 4. RESET & INITIALIZATION
function initGame(name, id) {
    playerName = name; poornataId = id;
    localStorage.setItem('seamex_session', JSON.stringify({ name, id, expiry: Date.now() + 7776000000 }));
    
    // UI Resets
    document.getElementById('hud-player-name').innerText = name;
    document.querySelectorAll('.screen-box, .overlay-modal').forEach(el => el.classList.add('hidden'));
    document.getElementById('game-hud').classList.remove('hidden');
    
    // Game Logic Reset
    gameState = 'PLAYING'; isPaused = false;
    score = 0; level = 1; enemies = []; powerups = []; 
    document.getElementById('level').innerText = "1";
    player = new Player();
    animate();
}

// 5. EVENT LISTENERS
const nameInp = document.getElementById('player-name');
const idInp = document.getElementById('player-id');
const startBtn = document.getElementById('start-btn');

function validate() {
    const isNameValid = /^[a-zA-Z\s]+$/.test(nameInp.value) && nameInp.value.length >= 3;
    const isIdValid = /^\d+$/.test(idInp.value) && idInp.value.length >= 4;
    startBtn.disabled = !(isNameValid && isIdValid);
}
[nameInp, idInp].forEach(el => el.addEventListener('input', validate));

document.getElementById('start-btn').addEventListener('click', () => initGame(nameInp.value, idInp.value));
document.getElementById('quick-start-btn').addEventListener('click', () => initGame(playerName, poornataId));
document.getElementById('restart-btn').addEventListener('click', () => initGame(playerName, poornataId));
document.getElementById('back-to-menu-btn').addEventListener('click', () => location.reload());
document.getElementById('continue-btn').addEventListener('click', () => { document.getElementById('level-modal').classList.add('hidden'); gameState = 'PLAYING'; animate(); });

document.getElementById('pause-btn').addEventListener('click', () => {
    isPaused = !isPaused;
    document.getElementById('pause-btn').innerText = isPaused ? "▶" : "❚❚";
    if(!isPaused) animate();
});

document.getElementById('share-btn').addEventListener('click', () => {
    const msg = `${playerName} scored ${Math.floor(score)} on Seamless Dash! 🚀 Can you beat them?\nDownload Seamex: https://seamex.app.link/download`;
    if(navigator.share) navigator.share({ title: 'Dash Challenge', text: msg });
    else { navigator.clipboard.writeText(msg); alert("Challenge copied!"); }
});

document.getElementById('music-toggle').addEventListener('click', function() {
    isMuted = !isMuted;
    this.innerText = isMuted ? "🔇 Sound Off" : "🔊 Sound On";
    Object.values(sounds).forEach(s => s.muted = isMuted);
});

// INITIAL SESSION CHECK
const session = JSON.parse(localStorage.getItem('seamex_session'));
if (session && session.expiry > Date.now()) {
    playerName = session.name; poornataId = session.id;
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('returning-user-section').classList.remove('hidden');
    document.getElementById('display-name').innerText = playerName;
}

canvas.width = window.innerWidth; canvas.height = window.innerHeight;
