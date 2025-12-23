const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const triviaList = [
    "Seamex provides a single point of contact for the entire employee lifecycle.",
    "Poornata is the core HRMS platform for the entire Aditya Birla Group.",
    "Seamex enables digital onboarding for a paperless experience.",
    "The Seamex platform integrates payroll and benefits administration.",
    "Poornata stores employee data securely with advanced encryption."
];

let player, enemies = [], powerups = [], particles = [], gameState = 'START';
let score = 0, level = 1, playerName = "", poornataId = "", bgOffset = 0;
let shieldActive = false, shieldTime = 0, isPaused = false;
let timeWarpActive = false;

// SOUNDS
const sounds = {
    power: new Audio('https://assets.mixkit.co/active_storage/sfx/1103/1103-preview.mp3'),
    hit: new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'),
    lvl: new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3'),
    over: new Audio('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3'),
    slow: new Audio('https://assets.mixkit.co/active_storage/sfx/614/614-preview.mp3')
};
// DIRECT 8-BIT MUSIC LINK
const bgMusic = new Audio('https://ia800504.us.archive.org/33/items/26_20240320_202403/Retro%20Game.mp3'); 
bgMusic.loop = true;
let isMuted = false;

function unlockAudio() {
    bgMusic.currentTime = 0;
    if (!isMuted) {
        let playPromise = bgMusic.play();
        if (playPromise !== undefined) {
            playPromise.catch(() => { console.log("User interaction required for audio"); });
        }
    }
    // Pre-load SFX
    Object.values(sounds).forEach(s => {
        s.muted = false;
        s.play().then(() => { s.pause(); s.currentTime = 0; }).catch(() => {});
    });
}

class Player {
    constructor() { 
        this.w = 85; this.h = 85;
        this.x = canvas.width/2 - 42; 
        this.y = canvas.height * 0.60; // Lifted 40% from bottom
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

function animate() {
    if(gameState !== 'PLAYING' || isPaused) return;
    
    // Draw Background
    let gridColor = level >= 20 ? "#333" : "#e9ecef";
    ctx.fillStyle = level >= 20 ? "#212121" : (level >= 10 ? "#fff3e0" : "#f8f9fa");
    ctx.fillRect(0,0,canvas.width,canvas.height);
    
    ctx.strokeStyle = gridColor;
    bgOffset = (bgOffset + (timeWarpActive ? 1 : 2) + level) % 40;
    for(let x=0; x<canvas.width; x+=40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,canvas.height); ctx.stroke(); }
    for(let y=bgOffset; y<canvas.height; y+=40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(canvas.width,y); ctx.stroke(); }

    // Particles
    particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy; p.alpha -= 0.02;
        ctx.save(); ctx.globalAlpha = p.alpha; ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size); ctx.restore();
        if (p.alpha <= 0) particles.splice(i, 1);
    });

    const spdMult = timeWarpActive ? 0.4 : 1.0;
    score += (0.15 * spdMult); 
    document.getElementById('score').innerText = Math.floor(score);
    
    if(Math.floor(score) >= level * 100) { levelUp(); }

    if(shieldActive) {
        shieldTime -= 0.016; 
        document.getElementById('shield-timer').innerText = Math.ceil(shieldTime);
        if(shieldTime <= 0) { shieldActive=false; document.getElementById('shield-indicator').classList.add('hidden'); }
    }

    player.draw();

    // Spawning logic
    if(Math.random() < (0.03 + (level*0.005)) * spdMult) {
        enemies.push({x:Math.random()*(canvas.width-30), y:-50, spd:(4+(level*0.6)) * spdMult});
    }
    if(Math.random() < 0.004) {
        const type = (level >= 5 && Math.random() > 0.7) ? 'SLOW' : 'SHIELD';
        powerups.push({x:Math.random()*(canvas.width-30), y:-50, type: type});
    }

    powerups.forEach((p,i) => {
        p.y += (4 * spdMult);
        ctx.font = "30px Arial";
        ctx.fillText(p.type === 'SLOW' ? "⏳" : "🛡️", p.x, p.y);
        
        if(p.x < player.x+75 && p.x+30 > player.x+10 && p.y < player.y+75 && p.y+30 > player.y+10) {
            if(p.type === 'SLOW') {
                timeWarpActive = true; canvas.classList.add('slow-mo-active');
                if(!isMuted) sounds.slow.play();
                setTimeout(() => { timeWarpActive = false; canvas.classList.remove('slow-mo-active'); }, 5000);
            } else {
                shieldActive=true; shieldTime=8; if(!isMuted) sounds.power.play();
                document.getElementById('shield-indicator').classList.remove('hidden');
            }
            if(navigator.vibrate) navigator.vibrate(50);
            powerups.splice(i,1);
        }
    });

    enemies.forEach((e,i) => {
        e.y += e.spd; 
        ctx.fillStyle='#D32F2F'; ctx.beginPath(); ctx.arc(e.x+15,e.y+15,15,0,Math.PI*2); ctx.fill();
        if(e.x < player.x+75 && e.x+30 > player.x+10 && e.y < player.y+75 && e.y+30 > player.y+10) {
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

function levelUp() {
    level++;
    if(!isMuted) sounds.lvl.play();
    document.getElementById('level').innerText = level;
    
    const triviaBox = document.createElement('div');
    triviaBox.className = 'floating-trivia';
    triviaBox.innerText = "💡 LEVEL UP: " + triviaList[level % triviaList.length];
    document.getElementById('ui-layer').appendChild(triviaBox);
    setTimeout(() => { if(triviaBox) { triviaBox.style.opacity = '0'; setTimeout(()=>triviaBox.remove(), 500); } }, 4500);
}

function start(n, id) {
    unlockAudio(); playerName=n; poornataId=id;
    localStorage.setItem('seamex_session', JSON.stringify({n, id, exp: Date.now()+7776000000}));
    
    gameState='PLAYING'; isPaused=false; timeWarpActive=false;
    score=0; level=1; enemies=[]; powerups=[]; particles=[];
    
    document.getElementById('level').innerText = "1";
    document.getElementById('score').innerText = "0";
    document.querySelectorAll('.screen-box, .overlay-modal').forEach(e => e.classList.add('hidden'));
    document.getElementById('game-hud').classList.remove('hidden');
    document.getElementById('hud-name').innerText = n;
    
    player=new Player();
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

// Logic for Validation and Controls
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
[nameInp, idInp].forEach(el => el.addEventListener('input', validate));

document.getElementById('change-user-link').addEventListener('click', () => { localStorage.removeItem('seamex_session'); location.reload(); });
document.getElementById('pause-btn').addEventListener('click', () => { isPaused = true; bgMusic.pause(); document.getElementById('pause-overlay').classList.remove('hidden'); });
document.getElementById('resume-btn').addEventListener('click', () => { isPaused = false; if(!isMuted) bgMusic.play(); document.getElementById('pause-overlay').classList.add('hidden'); requestAnimationFrame(animate); });
document.getElementById('start-btn').addEventListener('click', () => start(nameInp.value, idInp.value));
document.getElementById('quick-start-btn').addEventListener('click', () => start(playerName, poornataId));
document.getElementById('restart-btn').addEventListener('click', () => start(playerName, poornataId));
document.getElementById('menu-btn').addEventListener('click', () => location.reload());

document.getElementById('share-btn').addEventListener('click', () => {
    const msg = `🚀 I just dashed ${Math.floor(score)} points as ${playerName}! Can you beat me? \nDownload Seamex: https://seamex.app.link/download`;
    if(navigator.share) navigator.share({ title: 'Dash Challenge', text: msg });
    else { navigator.clipboard.writeText(msg); alert("Challenge copied!"); }
});

document.getElementById('music-toggle').addEventListener('click', function() {
    isMuted = !isMuted; this.innerText = isMuted ? "🔇 Sound Off" : "🔊 Sound On";
    isMuted ? bgMusic.pause() : (gameState==='PLAYING' && bgMusic.play());
});

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
