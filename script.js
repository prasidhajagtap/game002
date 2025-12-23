const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const trivia = ["Seamex offers paperless onboarding.", "Poornata is used group-wide.", "Level up happens every 100 points!", "Dodge orbs to survive."];
let player, enemies = [], powerups = [], gameState = 'START';
let score = 0, level = 1, pName = "", pId = "", isPaused = false;

// Simplified Audio Logic for stability
const sfx = { 
    power: new Audio('https://assets.mixkit.co/active_storage/sfx/1103/1103-preview.mp3'),
    over: new Audio('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3') 
};
let muted = false;

class Player {
    constructor() { this.w = 60; this.h = 60; this.x = canvas.width/2-30; this.y = canvas.height-120; }
    draw() {
        const img = document.getElementById('player-img');
        if(img.complete && img.naturalHeight !== 0) ctx.drawImage(img, this.x, this.y, this.w, this.h);
        else { ctx.fillStyle = 'red'; ctx.fillRect(this.x, this.y, this.w, this.h); }
    }
}

function spawn() {
    if (Math.random() < 0.03) enemies.push({x: Math.random()*canvas.width, y: -50, s: 20, spd: 3 + level});
}

function animate() {
    if (gameState !== 'PLAYING' || isPaused) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Grid Background
    ctx.strokeStyle = '#ddd';
    for(let i=0; i<canvas.width; i+=40) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,canvas.height); ctx.stroke(); }

    score += 0.1;
    document.getElementById('score').innerText = Math.floor(score);
    
    if(Math.floor(score) >= level * 100) {
        gameState = 'LEVEL_UP';
        document.getElementById('level-modal').classList.remove('hidden');
        document.getElementById('trivia-text').innerText = trivia[level % trivia.length];
        return;
    }

    player.draw();
    spawn();

    enemies.forEach((e, i) => {
        e.y += e.spd;
        ctx.fillStyle = 'red'; ctx.beginPath(); ctx.arc(e.x, e.y, e.s, 0, Math.PI*2); ctx.fill();
        
        // Collision
        if(e.x > player.x && e.x < player.x+player.w && e.y > player.y && e.y < player.y+player.h) {
            gameState = 'OVER';
            document.getElementById('game-over-screen').classList.remove('hidden');
            document.getElementById('final-score').innerText = Math.floor(score);
            if(!muted) sfx.over.play();
        }
    });

    requestAnimationFrame(animate);
}

function start(name, id) {
    pName = name; pId = id;
    localStorage.setItem('seamex_user', JSON.stringify({name, id, exp: Date.now() + 7776000000}));
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-hud').classList.remove('hidden');
    document.getElementById('hud-name').innerText = name;
    gameState = 'PLAYING'; score = 0; level = 1; enemies = []; player = new Player();
    animate();
}

// Listeners
document.getElementById('start-btn').onclick = () => start(document.getElementById('player-name').value, document.getElementById('player-id').value);
document.getElementById('quick-start-btn').onclick = () => start(pName, pId);
document.getElementById('continue-btn').onclick = () => { gameState = 'PLAYING'; level++; document.getElementById('level').innerText = level; document.getElementById('level-modal').classList.add('hidden'); animate(); };
document.getElementById('pause-btn').onclick = () => { isPaused = !isPaused; if(!isPaused) animate(); };
document.getElementById('menu-btn').onclick = () => location.reload();

// Validation
document.querySelectorAll('input').forEach(i => i.oninput = () => {
    const n = document.getElementById('player-name').value;
    const id = document.getElementById('player-id').value;
    document.getElementById('start-btn').disabled = !(n.length > 2 && id.length > 3);
});

// Controls
window.addEventListener('touchmove', (e) => { 
    if(player) player.x = e.touches[0].clientX - 30; 
}, {passive: false});

// Session
const saved = JSON.parse(localStorage.getItem('seamex_user'));
if(saved && saved.exp > Date.now()) {
    pName = saved.name; pId = saved.id;
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('returning-user-section').classList.remove('hidden');
    document.getElementById('display-name').innerText = pName;
}
