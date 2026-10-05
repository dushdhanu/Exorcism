const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let lastTime = 0;
let deltaTime = 0;

// Input handling
const keys = {
    w: false, a: false, s: false, d: false,
    1: false, 2: false, 3: false, 4: false,
    b: false
};

const mouse = {
    x: 0,
    y: 0,
    down: false
};

// Event Listeners
window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key.toLowerCase())) {
        keys[e.key.toLowerCase()] = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key.toLowerCase())) {
        keys[e.key.toLowerCase()] = false;
    }
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', () => mouse.down = true);
canvas.addEventListener('mouseup', () => mouse.down = false);

// Game Loop
function gameLoop(timestamp) {
    deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    update();
    draw();

    requestAnimationFrame(gameLoop);
}

function update() {
    // Game logic goes here
}

function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background (foggy graveyard)
    ctx.fillStyle = '#151a22';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid/ground pattern placeholder
    ctx.strokeStyle = '#1f2833';
    ctx.lineWidth = 1;
    for(let i=0; i<canvas.width; i+=50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
    }
    for(let i=0; i<canvas.height; i+=50) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
    }
}

// Start game
requestAnimationFrame(gameLoop);
