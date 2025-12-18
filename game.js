/* Project: Jump Master (game002)
    Based on Milestone 1 Stable Release
    Core Logic: Vanilla JS, Canvas, LocalStorage
*/

// --- CONFIGURATION ---
const CANVAS_WIDTH = 400;  // Base logic width
const CANVAS_HEIGHT = 600; // Base logic height
const GRAVITY = 0.4;       // [cite: 73]
const JUMP_STRENGTH = -12; // [cite: 74]
const EXPIRY_MS = 7776000000; // 90 Days in ms [cite: 20]

// --- ASSETS ---
const charImg = new Image(); charImg.src = 'character.png'; // [cite: 25]
const block1Img = new Image(); block1Img.src = 'block-1.png'; // [cite: 26]
const block2Img = new Image(); block2Img.src = 'block-2.png'; // [cite: 27]

// --- STATE MANAGEMENT ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let player = { x: 175, y: 300, width: 50, height: 50, vx: 0, vy: 0 };
let platforms = [];
let score = 0;
let gameRunning = false;
let currentUser = null;

// --- VALIDATION & AUTH (Part 3A) ---
const nameRegex = /^[A-Za-z\s]+$/; // [cite: 15, 36]
const pidRegex = /^[0-9]+$/;       // [cite: 16, 37]

document.addEventListener('DOMContentLoaded', () => {
    checkSession();
    document.getElementById('start-btn').addEventListener('click', handleLogin);
});

function handleLogin() {
    const name = document.getElementById('username').value;
    const pid = document.getElementById('poornataId').value;
    const errorMsg = document.getElementById('error-msg');

    if (!nameRegex.test(name)) {
        errorMsg.textContent = "Error: Name must contain alphabets only.";
        errorMsg.classList.remove('hidden');
        return;
    }
    if (!pidRegex.test(pid)) {
        errorMsg.textContent = "Error: Poornata ID must be numeric.";
        errorMsg.classList.remove('hidden');
        return;
    }

    // Set Session
    const expiry = Date.now() + EXPIRY_MS;
    const userData = { name, pid, expiry };
    localStorage.setItem('game001_user', JSON.stringify(userData)); // [cite: 19]
    localStorage.setItem('game001_expiry', expiry); 
    
    startGame(userData);
}

function checkSession() {
    const storedUser = localStorage.getItem('game001_user');
    const storedExpiry = localStorage.getItem('game001_expiry');

    if (storedUser && storedExpiry) {
        if (Date.now() < parseInt(storedExpiry)) { // [cite: 21]
            startGame(JSON.parse(storedUser));
        } else {
            localStorage.clear(); // Session expired
        }
    }
}

// --- GAME ENGINE ---
function startGame(user) {
    currentUser = user;
    document.getElementById('login-container').classList.add('hidden');
    document.getElementById('game-container').classList.remove('hidden');
    
    // Resize canvas
    canvas.width = window.innerWidth > 450 ? 450 : window.innerWidth;
    canvas.height = window.innerHeight;
    
    resetGame();
    gameRunning = true;
    requestAnimationFrame(gameLoop);
    
    // Input Handling [cite: 39]
    window.addEventListener('mousedown', handleInput);
    window.addEventListener('touchstart', handleInput, {passive: false});
}

function handleInput(e) {
    if(!gameRunning) {
        resetGame(); 
        gameRunning = true; 
        return;
    }
    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const midPoint = window.innerWidth / 2;
    // Left/Right Split Control [cite: 41]
    player.vx = clientX < midPoint ? -7 : 7; 
}

function resetGame() {
    player.x = canvas.width / 2 - 25;
    player.y = canvas.height - 150;
    player.vx = 0;
    player.vy = 0;
    score = 0;
    platforms = [];
    
    // Starter Platform [cite: 76]
    platforms.push({ x: canvas.width/2 - 40, y: canvas.height - 50, type: 1 });
    
    // Generate initial platforms
    for(let i=0; i<6; i++) {
        spawnPlatform(canvas.height - 150 - (i * 120));
    }
}

function spawnPlatform(y) {
    const x = Math.random() * (canvas.width - 80);
    const type = Math.random() > 0.5 ? 1 : 2; 
    platforms.push({ x, y, type });
}

function update() {
    // Physics
    player.vy += GRAVITY;
    player.x += player.vx;
    player.y += player.vy;
    
    // Friction/Air resistance simulation
    player.vx *= 0.9;

    // Screen Wrap [cite: 75]
    if (player.x + player.width < 0) player.x = canvas.width;
    if (player.x > canvas.width) player.x = -player.width;

    // Platform Collision (Only when falling)
    if (player.vy > 0) {
        platforms.forEach(p => {
            if (
                player.x < p.x + 80 &&
                player.x + player.width > p.x &&
                player.y + player.height > p.y &&
                player.y + player.height < p.y + 30
            ) {
                player.vy = JUMP_STRENGTH; // [cite: 74]
            }
        });
    }

    // Scroll Logic
    if (player.y < canvas.height / 2) {
        player.y = canvas.height / 2;
        score++;
        document.getElementById('score-display').innerText = `Score: ${score}`;
        platforms.forEach(p => {
            p.y -= player.vy; 
            if (p.y > canvas.height) {
                p.y = 0;
                p.x = Math.random() * (canvas.width - 80);
            }
        });
    }

    // Game Over
    if (player.y > canvas.height) {
        gameOver();
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Player
    if (charImg.complete) ctx.drawImage(charImg, player.x, player.y, 50, 50);
    else { ctx.fillStyle = 'red'; ctx.fillRect(player.x, player.y, 50, 50); } // Fallback

    // Draw Platforms
    platforms.forEach(p => {
        let img = p.type === 1 ? block1Img : block2Img;
        if (img.complete) ctx.drawImage(img, p.x, p.y, 80, 30);
        else { ctx.fillStyle = 'green'; ctx.fillRect(p.x, p.y, 80, 30); } // Fallback
    });
}

function gameLoop() {
    if (gameRunning) {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }
}

function gameOver() {
    gameRunning = false;
    updateHistory(score);
    alert(`Game Over! Score: ${score}`);
    location.reload(); // Simple restart
}

// --- HISTORY & STATS [cite: 28, 31] ---
function updateHistory(newScore) {
    let history = JSON.parse(localStorage.getItem('game001_history')) || [];
    
    // Update High Score [cite: 30]
    let highScore = localStorage.getItem('game001_highscore') || 0;
    if (newScore > highScore) {
        localStorage.setItem('game001_highscore', newScore);
    }

    // Update Recent History (FIFO) [cite: 31]
    history.unshift(newScore); 
    if (history.length > 3) history.pop();
    
    localStorage.setItem('game001_history', JSON.stringify(history));
}
