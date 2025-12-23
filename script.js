const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- UI Elements ---
const startScreen = document.getElementById('start-screen');
const hud = document.getElementById('game-hud');
const levelModal = document.getElementById('level-modal');
const gameOverScreen = document.getElementById('game-over-screen');
const pauseMenu = document.getElementById('pause-menu');

const nameInput = document.getElementById('player-name');
const idInput = document.getElementById('player-id');
const nameError = document.getElementById('name-error');
const idError = document.getElementById('id-error');
const highScoreList = document.getElementById('high-score-list');

const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const triviaText = document.getElementById('trivia-text');
const finalScoreEl = document.getElementById('final-score');
const bestScoreEl = document.getElementById('best-score');

// --- Game Assets ---
const playerImg = document.getElementById('player-img');

// --- Game State ---
let gameState = 'START'; // START, PLAYING, PAUSED, LEVEL_UP, GAME_OVER
let score = 0;
let level = 1;
let frameCount = 0;
let playerName = "";
let speedMultiplier = 1;
let nextLevelScore = 100; // Trigger next level when score hits this
let animationId;

// --- Trivia Data ---
const triviaFacts = [
    "Seamex was established in 2017 to provide a seamless HR experience.",
    "Seamex is powered by 'Poornata', the Group's HRMS software.",
    "Seamex acts as a single point of contact for the entire employee lifecycle.",
    "Seamex handles everything from Onboarding to Exit Management.",
    "Core Value: 'Respect for all' is a key work ethic at Seamex.",
    "Seamex uses 'Cornerstone on Demand' for employee learning.",
    "Seamex is located in Airoli, Navi Mumbai."
];

// --- High Score System ---
function getHighScores() {
    const stored = localStorage.getItem('seamexScores');
    return stored ? JSON.parse(stored) : [];
}

function saveHighScore(newScore, name) {
    let scores = getHighScores();
    scores.push({ score: Math.floor(newScore), name: name });
    scores.sort((a, b) => b.score - a.score); // Sort descending
    scores = scores.slice(0, 3); // Keep top 3
    localStorage.setItem('seamexScores', JSON.stringify(scores));
    updateHighScoreDisplay();
}

function updateHighScoreDisplay() {
    const scores = getHighScores();
    highScoreList.innerHTML = scores.length 
        ? scores.map(s => `<li>${s.score} - ${s.name}</li>`).join('') 
        : '<li>No scores yet</li>';
}

function getBestScore() {
    const scores = getHighScores();
    return scores.length > 0 ? scores[0].score : 0;
}

// Initialize Scores on Load
updateHighScoreDisplay();

// --- Resize Handling ---
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (player) player.fixPosition(); // Ensure player stays on screen
}
window.addEventListener('resize', resize);
resize();

// --- INPUT VALIDATION ---
nameInput.addEventListener('input', () => {
    // Regex: Only letters and spaces allowed
    const val = nameInput.value;
    if (/[^a-zA-Z\s]/.test(val)) {
        nameError.style.display = 'block';
        // Remove invalid character immediately
        nameInput.value = val.replace(/[^a-zA-Z\s]/g, '');
    } else {
        nameError.style.display = 'none';
    }
});

idInput.addEventListener('input', () => {
    // Regex: Only numbers allowed
    const val = idInput.value;
    if (/[^0-9]/.test(val)) {
        idError.style.display = 'block';
        idInput.value = val.replace(/[^0-9]/g, '');
    } else {
        idError.style.display = 'none';
    }
});

document.getElementById('start-btn').addEventListener('click', () => {
    const nameVal = nameInput.value.trim();
    const idVal = idInput.value.trim();
    let valid = true;

    if (nameVal.length < 2) {
        nameError.style.display = 'block';
        valid = false;
    }
    if (idVal.length === 0) {
        idError.style.display = 'block';
        valid = false;
    }

    if (valid) {
        playerName = nameVal;
        startGame();
    }
});

// --- CLASSES ---

class Player {
    constructor() {
        this.width = 60; // Adjusted for character aspect ratio
        this.height = 60;
        this.x = canvas.width / 2 - this.width / 2;
        // Fix: Position near bottom (20px padding)
        this.y = canvas.height - this.height - 20; 
    }

    fixPosition() {
        // Called on resize to keep player visible
        this.y = canvas.height - this.height - 20;
    }

    draw() {
        // Draw the uploaded character image
        if (playerImg.complete) {
            ctx.drawImage(playerImg, this.x, this.y, this.width, this.height);
        } else {
            // Fallback if image fails
            ctx.fillStyle = '#FFC107';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }

    moveTo(x, y) {
        this.x = x - this.width / 2;
        // Restrict movement to screen bounds
        if (this.x < 0) this.x = 0;
        if (this.x > canvas.width - this.width) this.x = canvas.width - this.width;
    }
}

class Enemy {
    constructor() {
        this.size = Math.random() * 30 + 30; 
        this.x = Math.random() * (canvas.width - this.size);
        this.y = -this.size;
        this.speed = (Math.random() * 3 + 4) * speedMultiplier; 
        this.color = '#D32F2F'; 
    }

    update() {
        this.y += this.speed;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x + this.size/2, this.y + this.size/2, this.size/2, 0, Math.PI * 2);
        ctx.fill();
        // Add a shine
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.arc(this.x + this.size/2 - 5, this.y + this.size/2 - 5, this.size/4, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Confetti {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height - canvas.height; // Start above screen
        this.color = ['#FFC107', '#D32F2F', '#A01018', '#00C853'][Math.floor(Math.random() * 4)];
        this.size = Math.random() * 8 + 4;
        this.speedY = Math.random() * 3 + 2;
        this.speedX = Math.random() * 2 - 1;
        this.rotation = Math.random() * 360;
    }
    update() {
        this.y += this.speedY;
        this.x += this.speedX;
        this.rotation += 5;
        // Reset if it falls off screen
        if(this.y > canvas.height) this.y = -10;
    }
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation * Math.PI / 180);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
        ctx.restore();
    }
}

// --- GAME LOGIC ---

let player;
let enemies = [];
let confettis = [];

function startGame() {
    // Hide Screens
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    pauseMenu.classList.add('hidden');
    hud.classList.remove('hidden');
    
    // Reset State
    gameState = 'PLAYING';
    score = 0;
    level = 1;
    frameCount = 0;
    speedMultiplier = 1;
    nextLevelScore = 100;
    
    player = new Player();
    enemies = [];
    confettis = [];
    
    updateHUD();
    animate();
}

// Pause Functionality
document.getElementById('pause-btn').addEventListener('click', () => {
    if (gameState === 'PLAYING') {
        gameState = 'PAUSED';
        pauseMenu.classList.remove('hidden');
    }
});

document.getElementById('resume-btn').addEventListener('click', () => {
    if (gameState === 'PAUSED') {
        gameState = 'PLAYING';
        pauseMenu.classList.add('hidden');
        animate(); // Restart loop
    }
});

function updateHUD() {
    scoreEl.innerText = Math.floor(score);
    levelEl.innerText = level;
}

function levelUp() {
    gameState = 'LEVEL_UP';
    level++;
    nextLevelScore += 100; // Next level at +100 score
    speedMultiplier += 0.2; 
    
    // Trivia
    const fact = triviaFacts[(level - 2) % triviaFacts.length];
    triviaText.innerText = fact;
    
    // Generate Confetti
    confettis = [];
    for(let i=0; i<80; i++) confettis.push(new Confetti());
    
    levelModal.classList.remove('hidden');
    
    // NOTE: animate() keeps running to draw confetti, 
    // but game updates (movement) stop inside the loop logic.
}

document.getElementById('continue-btn').addEventListener('click', () => {
    levelModal.classList.add('hidden');
    gameState = 'PLAYING';
    confettis = []; 
});

document.getElementById('restart-btn').addEventListener('click', startGame);

function checkCollision(p, e) {
    const distX = Math.abs((p.x + p.width/2) - (e.x + e.size/2));
    const distY = Math.abs((p.y + p.height/2) - (e.y + e.size/2));

    if (distX > (p.width/2 + e.size/2)) { return false; }
    if (distY > (p.height/2 + e.size/2)) { return false; }

    if (distX <= (p.width/2)) { return true; } 
    if (distY <= (p.height/2)) { return true; }

    const dx = distX - p.width/2;
    const dy = distY - p.height/2;
    return (dx*dx + dy*dy <= (e.size/2 * e.size/2));
}

function animate() {
    // If paused, stop the loop entirely
    if (gameState === 'PAUSED' || gameState === 'GAME_OVER') return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // --- LEVEL UP STATE (Confetti Only) ---
    if (gameState === 'LEVEL_UP') {
        // Draw static game objects in background
        player.draw();
        enemies.forEach(e => e.draw());
        
        // Update & Draw Confetti
        confettis.forEach(c => {
            c.update();
            c.draw();
        });
        
        requestAnimationFrame(animate);
        return;
    }

    // --- PLAYING STATE ---
    if (gameState === 'PLAYING') {
        frameCount++;
        score += 0.1; 
        updateHUD();

        // Level Up Check
        if (score >= nextLevelScore) {
             levelUp();
             // Important: Call animate again immediately so the return inside levelUp logic catches the new state
             requestAnimationFrame(animate);
             return; 
        }

        // Player
        player.draw();

        // Enemies
        if (frameCount % Math.max(20, 60 - level * 4) === 0) { 
            enemies.push(new Enemy());
        }

        for (let i = 0; i < enemies.length; i++) {
            let e = enemies[i];
            e.update();
            e.draw();

            if (checkCollision(player, e)) {
                endGame();
                return; // Stop loop immediately
            }

            // Remove off-screen
            if (e.y > canvas.height) {
                enemies.splice(i, 1);
                i--;
            }
        }
        
        requestAnimationFrame(animate);
    }
}

function endGame() {
    gameState = 'GAME_OVER';
    hud.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');
    
    document.getElementById('final-name').innerText = playerName;
    
    const finalS = Math.floor(score);
    finalScoreEl.innerText = finalS;
    
    saveHighScore(finalS, playerName);
    bestScoreEl.innerText = getBestScore();
}

// --- CONTROLS ---

// Mouse
window.addEventListener('mousemove', (e) => {
    if ((gameState === 'PLAYING' || gameState === 'LEVEL_UP') && player) {
        player.moveTo(e.clientX, e.clientY);
    }
});

// Touch
window.addEventListener('touchmove', (e) => {
    if ((gameState === 'PLAYING' || gameState === 'LEVEL_UP') && player) {
        e.preventDefault(); 
        const touch = e.touches[0];
        player.moveTo(touch.clientX, touch.clientY);
    }
}, { passive: false });
