// Configuration
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const dpr = window.devicePixelRatio |

| 1;

const LOGIC_WIDTH = 400;
const LOGIC_HEIGHT = 600;
const GRAVITY = 0.4;
const JUMP_STRENGTH = -12;
const nameRegex = /^[A-Za-z\s]+$/;
const pidRegex = /^[0-9]+$/;

// State
let player = { x: 175, y: 500, width: 50, height: 50, vx: 0, vy: 0 };
let platforms =; // FIXED: Initialized as empty array
let score = 0;
let gameRunning = false;
let assetsLoadedCount = 0;

// Asset Loading
const images = {};
const assetSrcs = {
    hero: 'character.png',
    plat1: 'block-1.png',
    plat2: 'block-2.png'
};

Object.keys(assetSrcs).forEach(key => {
    images[key] = new Image();
    images[key].src = assetSrcs[key];
    images[key].onload = () => { assetsLoadedCount++; };
});

function resizeCanvas() {
    const displayWidth = Math.min(window.innerWidth, 450);
    const displayHeight = window.innerHeight;
    
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';

    const scale = (displayWidth * dpr) / LOGIC_WIDTH;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
}

function initGame() {
    score = 0;
    document.getElementById('score-display').innerText = `Score: 0`;
    player.x = LOGIC_WIDTH / 2 - 25;
    player.y = LOGIC_HEIGHT - 150;
    player.vy = JUMP_STRENGTH;
    player.vx = 0;
    
    platforms =;
    // Starter Platform
    platforms.push({ x: LOGIC_WIDTH / 2 - 40, y: LOGIC_HEIGHT - 50, width: 80, height: 30, type: 'plat1' });
    
    for(let i = 1; i < 6; i++) {
        spawnPlatform(LOGIC_HEIGHT - (i * 120));
    }
    
    gameRunning = true;
    requestAnimationFrame(gameLoop);
}

function spawnPlatform(y) {
    platforms.push({
        x: Math.random() * (LOGIC_WIDTH - 80),
        y: y,
        width: 80,
        height: 30,
        type: Math.random() > 0.5? 'plat1' : 'plat2'
    });
}

function update() {
    player.vy += GRAVITY;
    player.y += player.vy;
    player.x += player.vx;

    if (player.x + player.width < 0) player.x = LOGIC_WIDTH;
    if (player.x > LOGIC_WIDTH) player.x = -player.width;

    if (player.vy > 0) {
        platforms.forEach(p => {
            if (player.x < p.x + p.width &&
                player.x + player.width > p.x &&
                player.y + player.height > p.y &&
                player.y + player.height < p.y + p.height + 15) {
                player.y = p.y - player.height;
                player.vy = JUMP_STRENGTH;
            }
        });
    }

    if (player.y < LOGIC_HEIGHT / 2) {
        let diff = LOGIC_HEIGHT / 2 - player.y;
        player.y = LOGIC_HEIGHT / 2;
        score += Math.floor(diff);
        document.getElementById('score-display').innerText = `Score: ${score}`;
        
        platforms.forEach(p => {
            p.y += diff;
            if (p.y > LOGIC_HEIGHT) {
                platforms.splice(platforms.indexOf(p), 1);
                spawnPlatform(0);
            }
        });
    }

    if (player.y > LOGIC_HEIGHT) gameOver();
}

function draw() {
    ctx.clearRect(0, 0, LOGIC_WIDTH, LOGIC_HEIGHT);
    platforms.forEach(p => {
        if(images[p.type]) ctx.drawImage(images[p.type], p.x, p.y, p.width, p.height);
    });
    if(images.hero) ctx.drawImage(images.hero, player.x, player.y, player.width, player.height);
}

function gameLoop() {
    if (!gameRunning) return;
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function gameOver() {
    gameRunning = false;
    saveScore(score);
    alert(`Poornata Jump Master: Game Over! Score: ${score}`);
    location.reload();
}

function saveScore(s) {
    let history = JSON.parse(localStorage.getItem('game001_history')) ||; // FIXED: Added fallback array
    history.unshift(s);
    if (history.length > 3) history.pop();
    localStorage.setItem('game001_history', JSON.stringify(history));

    let high = localStorage.getItem('game001_highscore') |

| 0;
    if (parseInt(s) > parseInt(high)) localStorage.setItem('game001_highscore', s);
}

// Controls
function handleInput(e) {
    if (!gameRunning) return;
    const clientX = e.type.includes('touch')? e.touches.clientX : e.clientX;
    const mid = window.innerWidth / 2;
    player.vx = clientX < mid? -7 : 7;
}

window.addEventListener('touchstart', handleInput, { passive: false });
window.addEventListener('touchend', () => player.vx = 0);
window.addEventListener('mousedown', handleInput);
window.addEventListener('mouseup', () => player.vx = 0);
window.addEventListener('resize', resizeCanvas);

// Login Logic
document.getElementById('start-btn').addEventListener('click', () => {
    const name = document.getElementById('username').value.trim();
    const pid = document.getElementById('poornataId').value.trim();
    const error = document.getElementById('error-msg');

    // Mandatory Prompting
    if (!name ||!pid) {
        error.innerText = "Error: Name and Poornata ID are mandatory.";
        error.classList.remove('hidden');
        return;
    }

    if (nameRegex.test(name) && pidRegex.test(pid)) {
        localStorage.setItem('game001_user', JSON.stringify({ name, pid }));
        localStorage.setItem('game001_expiry', Date.now() + 7776000000); // 90 days
        document.getElementById('login-container').classList.add('hidden');
        document.getElementById('game-container').classList.remove('hidden');
        resizeCanvas();
        initGame();
    } else {
        error.innerText = "Error: Use alphabets for Name and numbers for ID.";
        error.classList.remove('hidden');
    }
});

window.onload = () => {
    const expiry = localStorage.getItem('game001_expiry');
    if (expiry && Date.now() < parseInt(expiry)) {
        document.getElementById('login-container').classList.add('hidden');
        document.getElementById('game-container').classList.remove('hidden');
        resizeCanvas();
        initGame();
    }
};
