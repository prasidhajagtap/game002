// Targeted Refactoring for game.js
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const dpr = window.devicePixelRatio |

| 1;

// Configuration Constants
const LOGIC_WIDTH = 400;
const LOGIC_HEIGHT = 600;
const JUMP_STRENGTH = -12;
const GRAVITY = 0.4;

function resizeCanvas() {
    // Determine the best visual size for the canvas
    const displayWidth = Math.min(window.innerWidth, 450);
    const displayHeight = window.innerHeight;

    // Set the drawing buffer to physical resolution
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;

    // Set the CSS size to the logical viewport size
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';

    // Scale the context so logic can remain based on LOGIC_WIDTH/HEIGHT
    const scaleFactor = displayWidth / LOGIC_WIDTH;
    ctx.setTransform(dpr * scaleFactor, 0, 0, dpr * scaleFactor, 0, 0);
}

// Input Handling with Touch Event Fixes
function handleInput(e) {
    e.preventDefault(); // Stop accidental scrolling
    const clientX = e.type.includes('touch')? e.touches.clientX : e.clientX;
    const canvasRect = canvas.getBoundingClientRect();
    const relativeX = clientX - canvasRect.left;
    
    // Movement Logic
    player.vx = relativeX < (canvasRect.width / 2)? -7 : 7;
}

// Listen for input release to prevent "sticky" movement
function stopMovement() {
    player.vx = 0;
}

function updatePhysics() {
    player.vy += GRAVITY;
    player.y += player.vy;
    player.x += player.vx;

    // Screen Wrapping Logic
    if (player.x + 50 < 0) player.x = LOGIC_WIDTH;
    if (player.x > LOGIC_WIDTH) player.x = -50;

    // One-Way Collision detection
    if (player.vy > 0) {
        platforms.forEach(p => {
            if (
                player.x < p.x + p.width &&
                player.x + 50 > p.x &&
                player.y + 50 > p.y &&
                player.y + 50 < p.y + p.height + 15 // Tolerance slop
            ) {
                // Landing detected
                player.y = p.y - 50; // Snap to top
                player.vy = JUMP_STRENGTH;
            }
        });
    }

    // World Scroll Trigger
    if (player.y < LOGIC_HEIGHT / 2) {
        let scrollAmount = LOGIC_HEIGHT / 2 - player.y;
        player.y = LOGIC_HEIGHT / 2;
        score += Math.floor(scrollAmount);
        
        platforms.forEach(p => { p.y += scrollAmount; });
    }
}

const physicsSteps = 2;
function gameLoop(timestamp) {
    for(let i = 0; i < physicsSteps; i++) {
        updatePhysics(1 / (60 * physicsSteps));
    }
    render();
    requestAnimationFrame(gameLoop);
}

// Ensure this is at the bottom of your file to catch the button click
document.getElementById('start-btn').addEventListener('click', () => {
    const name = document.getElementById('username').value;
    const pid = document.getElementById('poornataId').value;

    // Strict validation based on corporate requirements
    if (nameRegex.test(name) && pidRegex.test(pid)) {
        document.getElementById('login-container').classList.add('hidden');
        document.getElementById('game-container').classList.remove('hidden');
        
        // CRITICAL: Must resize and initialize before the loop starts
        resizeCanvas(); 
        initGame(); 
    } else {
        const error = document.getElementById('error-msg');
        error.innerText = "Please enter a valid Name (Letters) and ID (Numbers).";
        error.classList.remove('hidden');
    }
});

window.addEventListener('touchstart', handleInput, { passive: false });
window.addEventListener('touchend', stopMovement);
window.addEventListener('mousedown', handleInput);
window.addEventListener('mouseup', stopMovement);
