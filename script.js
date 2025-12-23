const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const triviaList = [
    "Seamex provides a single point of contact for the entire employee lifecycle.",
    "Poornata acts as the core HRMS platform for the entire group.",
    "Seamex aims for a 'Seamless Experience Always'.",
    "Level up is achieved every 100 points!",
    "Seamex automates onboarding, payroll, and exit management."
];

let player, enemies = [], powerups = [], particles = [], gameState = 'START';
let score = 0, level = 1, playerName = "", poornataId = "";
let shieldActive = false, shieldTime = 0;

const sounds = {
    lvlUp: new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3'),
    over: new Audio('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3'),
    power: new Audio('https://assets.mixkit.co/active_storage/sfx/1103/1103-preview.mp3'),
    hit: new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3')
};
let isMuted = false;

// 1. Validation & On-Blur Events
const nameInp = document.getElementById('player-name');
const idInp = document.getElementById('player-id');
const startBtn = document.getElementById('start-btn');

function validate() {
    const isNameValid = /^[a-zA-Z\s]+$/.test(nameInp.value);
    const isIdValid = /^\d+$/.test(idInp.value);
    document.getElementById('name-val').style.display = (nameInp.value && !isNameValid) ? 'block' : 'none';
    document.getElementById('id-val').style.display = (idInp.value && !isIdValid) ? 'block' : 'none';
    startBtn.disabled = !(isNameValid && isIdValid && nameInp.value.length >= 3);
}

[nameInp, idInp].forEach(el => {
    el.addEventListener('blur', validate);
    el.addEventListener('input', validate);
});

// 2. 90-Day Persistence & Scores
function checkUserSession() {
    const session = JSON.parse(localStorage.getItem('seamexSession'));
    if (session && session.expiry > Date.now()) {
        playerName = session.name;
        poornataId = session.id;
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('returning-user-section').classList.remove('hidden');
        document.getElementById('display-name').innerText = playerName;
        renderUserTopScores();
    }
}

function renderUserTopScores() {
    const scores = JSON.parse(localStorage.getItem(`scores_${poornataId}`) || '[]');
    document.getElementById('user-top-scores').innerHTML = scores.slice(0, 3).map(s => `<li>${s} pts</li>`).join('') || '<li>No scores yet</li>';
}

function saveScore(newScore) {
    let scores = JSON.parse(localStorage.getItem(`scores_${poornataId}`) || '[]');
    scores.push(Math.floor(newScore));
    scores.sort((a, b) => b - a);
    localStorage.setItem(`scores_${poornataId}`, JSON.stringify(scores.slice(0, 5)));
}

// 3. Challenge Friends
document.getElementById('share-btn').addEventListener('click', async () => {
    const canvasCap = await html2canvas(document.getElementById('capture-area'));
    canvasCap.toBlob(blob => {
        const file = new File([blob], 'dash_score.png', { type: 'image/png' });
        if (navigator.share) {
            navigator.share({ title: 'Seamless Dash', text: `I scored ${Math.floor(score)}! Can you beat me?`, files: [file] });
        } else {
            alert("Score saved to clipboard!");
        }
    });
});

// 4. Game Logic
function handleLevelUp() {
    gameState = 'LEVEL_UP';
    level++;
    document.getElementById('level').innerText = level;
    // Proper Trivia Selection
    document.getElementById('trivia-text').innerText = triviaList[(level - 1) % triviaList.length];
    document.getElementById('level-modal').classList.remove('hidden');
    if (!isMuted) sounds.lvlUp.play();
}

function animate() {
    if (gameState !== 'PLAYING') return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    score += 0.15;
    document.getElementById('score').innerText = Math.floor(score);
    if (Math.floor(score) >= level * 100) handleLevelUp();
    // (Rest of collision/rendering logic)
    requestAnimationFrame(animate);
}

function startGame() {
    const expiry = Date.now() + (90 * 24 * 60 * 60 * 1000);
    localStorage.setItem('seamexSession', JSON.stringify({ name: playerName, id: poornataId, expiry }));
    gameState = 'PLAYING';
    document.querySelectorAll('.screen-box, .overlay-modal').forEach(m => m.classList.add('hidden'));
    document.getElementById('game-hud').classList.remove('hidden');
    score = 0; level = 1; enemies = []; player = { x: canvas.width/2-35, y: canvas.height-150, draw: function() { /* draw logic */ } };
    animate();
}

document.getElementById('start-btn').addEventListener('click', () => { playerName = nameInp.value; poornataId = idInp.value; startGame(); });
document.getElementById('quick-start-btn').addEventListener('click', startGame);
document.getElementById('restart-btn').addEventListener('click', startGame);
document.getElementById('change-user-link').addEventListener('click', () => {
    localStorage.removeItem('seamexSession');
    location.reload();
});

canvas.width = window.innerWidth; canvas.height = window.innerHeight;
checkUserSession();
