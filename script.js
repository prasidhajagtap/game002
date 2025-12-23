const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const triviaList = [
    "Seamex provides a single point of contact for the entire employee lifecycle.",
    "Poornata is the core HRMS platform for the entire Aditya Birla Group.",
    "Seamex enables digital onboarding for a paperless experience.",
    "The Seamex platform integrates payroll and benefits administration.",
    "The Seamex 'Helpdesk' uses AI to answer common HR queries."
];

let player, enemies = [], powerups = [], particles = [], gameState = 'START';
let score = 0, level = 1, playerName = "", poornataId = "", bgOffset = 0;
let shieldActive = false, shieldTime = 0, isPaused = false;
let timeWarpActive = false, lastTime = 0; // For Delta-Time physics

// SOUNDS - Retro 8-Bit Styled
const sounds = {
    power: new Audio('https://assets.mixkit.co/active_storage/sfx/1103/1103-preview.mp3'),
    hit: new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'),
    lvl: new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3'),
    over: new Audio('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3'),
    slow: new Audio('https://assets.mixkit.co/active_storage/sfx/614/614-preview.mp3')
};
// 8-Bit Retro Background Music
const bgMusic = new Audio('https://www.soundjay.com/free-music/retro-game-heart-bit-01.mp3'); 
bgMusic.loop = true;
let isMuted = false;

function unlockAudio() {
    if (!isMuted) bgMusic.play().catch(() => {});
    Object.values(sounds).forEach(s => {
        s.play().then(() => { s.pause(); s.currentTime = 0; }).catch(() => {});
    });
}

class Player {
    constructor() { 
        this.w = 85; this.h = 85;
        this.x = canvas.width/2 - 42; 
        this.y = canvas.height * 0.60; // Lifted character 40% from top (60% from bottom)
    }
    draw() {
        if(shieldActive) {
            if (shieldTime > 2 || Math.floor(Date.now() / 100) % 2 === 0) {
                ctx.strokeStyle='#0984e3'; ctx.lineWidth=6; ctx.beginPath();
                ctx.arc(this.x+42,this.y+42,55,0,Math.PI*2); ctx.stroke();
            }
        }
        const img = document.getElementById('player-img');
        if(img.complete && img.naturalWidth !== 0) ctx.drawImage(img, this.x, this.y, this.w, this.h);
        else { ctx.fillStyle='#A01018'; ctx.fillRect(this.x, this.y, this.w, this.h); }
    }
}

// 1. ENGINE (Delta Time for iOS/Android smoothness parity)
function animate(timestamp) {
    if(gameState !== 'PLAYING' || isPaused) return;
    
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    const fpsAdj = dt / 16.67; // Adjust speed based on 60fps baseline

    drawBackground();
    updateTheme(); // Progressive Content

    particles.forEach((p, i) => {
        p.x += p.vx * fpsAdj; p.y += p.vy * fpsAdj; p.alpha -= 0.02 * fpsAdj;
        ctx.save(); ctx.globalAlpha = p.alpha; ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size); ctx.restore();
        if (p.alpha <= 0) particles.splice(i, 1);
    });

    const spdMult = timeWarpActive ? 0.4 : 1.0;
    score += (0.15 * spdMult * fpsAdj); 
    document.getElementById('score').innerText = Math.floor(score);
    
    if(Math.floor(score) >= level * 100) { levelUp(); }

    if(shieldActive) {
        shieldTime -= (0.016 * fpsAdj); 
        document.getElementById('shield-timer').innerText = Math.ceil(shieldTime);
        if(shieldTime <= 0) { shieldActive=false; document.getElementById('shield-indicator').classList.add('hidden'); }
    }

    player.draw();

    // Spawning logic
    if(Math.random() < (0.03 + (level*0.005)) * spdMult) {
        enemies.push({x:Math.random()*(canvas.width-30), y:-50, spd:(3+(level*0.5)) * spdMult});
    }
    if(Math.random() < 0.004) {
        const type = (level >= 5 && Math.random() > 0.7) ? 'SLOW' : 'SHIELD';
        powerups.push({x:Math.random()*(canvas.width-30), y:-50, type: type});
    }

    powerups.forEach((p,i) => {
        p.y += (3 * spdMult * fpsAdj);
        ctx.font = "30px Arial";
        ctx.fillText(p.type === 'SLOW' ? "⏳" : "🛡️", p.x, p.y);
        
        if(p.x < player.x+70 && p.x+30 > player.x && p.y < player.y+70 && p.y+30 > player.y) {
            if(p.type === 'SLOW') {
                timeWarpActive = true; canvas.classList.add('slow-mo-active');
                if(!isMuted) sounds.slow.play();
                setTimeout(() => { timeWarpActive = false; canvas.classList.remove('slow-mo-active'); }, 5000);
            } else {
                shieldActive=true; shieldTime=8; if(!isMuted) sounds.power.play();
                document.getElementById('shield-indicator').classList.remove('hidden');
            }
            if(navigator.vibrate) navigator.vibrate(50); // Haptic
            powerups.splice(i,1);
        }
    });

    enemies.forEach((e,i) => {
        e.y += e.spd * fpsAdj; 
        ctx.fillStyle='#D32F2F'; ctx.beginPath(); ctx.arc(e.x+15,e.y+15,15,0,Math.PI*2); ctx.fill();
        if(e.x < player.x+70 && e.x+30 > player.x+10 && e.y < player.y+70 && e.y+30 > player.y+10) {
            if(shieldActive) {
                if(!isMuted) sounds.hit.play();
                if(navigator.vibrate) navigator.vibrate(30);
                for(let j=0; j<12; j++) particles.push({x:e.x+15, y:e.y+15, vx:Math.random()*6-3, vy:Math.random()*6-3, size:Math.random()*4+2, alpha:1, color:'#FFD700'});
                enemies.splice(i,1);
            } else { gameOver(); }
        }
        if(e.y > canvas.height) enemies.splice(i,1);
    });
    requestAnimationFrame(animate);
}

// 2. PROGRESSIVE CONTENT (Themes)
function updateTheme() {
    if (level >= 20) canvas.style.backgroundColor = "#212121";
    else if (level >= 15) canvas.style.backgroundColor = "#f3e5f5";
    else if (level >= 10) canvas.style.backgroundColor = "#fff3e0";
    else if (level >= 5) canvas.style.backgroundColor = "#e3f2fd";
}

function drawBackground() {
    let gridColor = level >= 20 ? "#333" : "#e9ecef";
    ctx.strokeStyle = gridColor;
    bgOffset = (bgOffset + (timeWarpActive ? 1 : 2) + level) % 40;
    for(let x=0; x<canvas.width; x+=40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,canvas.height); ctx.stroke(); }
    for(let y=bgOffset; y<canvas.height; y+=40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(canvas.width,y); ctx.stroke(); }
}

// 3. UI & RESET FIXES
function levelUp() {
    level++;
    if(!isMuted) sounds.lvl.play();
    document.getElementById('level').innerText = level;
    
    const triviaBox = document.createElement('div');
    triviaBox.className = 'floating-trivia';
    triviaBox.innerText = "💡 LEVEL UP: " + triviaList[level % triviaList.length];
    document.getElementById('ui-layer').appendChild(triviaBox);
    setTimeout(() => { if(triviaBox) triviaBox.remove(); }, 5000);
}

function start(n, id) {
    unlockAudio(); playerName=n; poornataId=id;
    localStorage.setItem('seamex_session', JSON.stringify({n, id, exp: Date.now()+7776000000}));
    
    // Explicit reset of variables and HUD
    gameState='PLAYING'; isPaused=false; timeWarpActive=false;
    score=0; level=1; enemies=[]; powerups=[]; particles=[];
    document.getElementById('level').innerText = "1";
    document.getElementById('score').innerText = "0";
    
    document.querySelectorAll('.screen-box, .overlay-modal').forEach(e => e.classList.add('hidden'));
    document.getElementById('game-hud').classList.remove('hidden');
    document.getElementById('hud-name').innerText = n;
    
    player=new Player();
    lastTime = performance.now();
    requestAnimationFrame(animate);
}

function gameOver() {
    gameState = 'OVER'; bgMusic.pause(); if(!isMuted) sounds.over.play();
    if(navigator.vibrate) navigator.vibrate([100, 50, 100]);
    document.getElementById('game-hud').classList.add('hidden');
    document.getElementById('game-over-screen').classList.remove('hidden');
    document.getElementById('final-score').innerText = Math.floor(score);
    let s = JSON.parse(localStorage.getItem(`s_${poornataId}`) || '[]');
    s.push(Math.floor(score)); s.sort((a,b)=>b-a);
    localStorage.setItem(`s_${poornataId}`, JSON.stringify(s.slice(0,5)));
    document.getElementById('best-score').innerText = s[0];
}

// Event Listeners (Change User, Validation, Movement remain same as previous version)
document.getElementById('change-user-link').addEventListener('click', () => { localStorage.removeItem('seamex_session'); location.reload(); });
document.getElementById('pause-btn').addEventListener('click', () => { isPaused = true; bgMusic.pause(); document.getElementById('pause-overlay').classList.remove('hidden'); });
document.getElementById('resume-btn').addEventListener('click', () => { isPaused = false; if(!isMuted) bgMusic.play(); document.getElementById('pause-overlay').classList.add('hidden'); lastTime = performance.now(); requestAnimationFrame(animate); });
document.getElementById('start-btn').addEventListener('click', () => start(document.getElementById('player-name').value, document.getElementById('player-id').value));
document.getElementById('quick-start-btn').addEventListener('click', () => start(playerName, poornataId));
document.getElementById('restart-btn').addEventListener('click', () => start(playerName, poornataId));
document.getElementById('menu-btn').addEventListener('click', () => location.reload());

window.addEventListener('touchmove', (e) => { 
    if(player && gameState==='PLAYING') player.x = Math.max(0, Math.min(canvas.width-85, e.touches[0].clientX-42)); 
}, {passive:false});
window.addEventListener('mousemove', (e) => { 
    if(player && gameState==='PLAYING') player.x = Math.max(0, Math.min(canvas.width-85, e.clientX-42)); 
});

const sess = JSON.parse(localStorage.getItem('seamex_session'));
if(sess && sess.exp > Date.now()) {
    playerName=sess.n; poornataId=sess.id;
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('returning-user-section').classList.remove('hidden');
    document.getElementById('display-name').innerText = playerName;
}
canvas.width = window.innerWidth; canvas.height = window.innerHeight;
