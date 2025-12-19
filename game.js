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

window.addEventListener('touchstart', handleInput, { passive: false });
window.addEventListener('touchend', stopMovement);
window.addEventListener('mousedown', handleInput);
window.addEventListener('mouseup', stopMovement);
