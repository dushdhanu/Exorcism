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

// Player object
const player = {
    x: 400,
    y: 300,
    radius: 15,
    baseSpeed: 200,
    speed: 200,
    color: '#c5c6c7',
    currentForm: 'base'
};

const avatars = {
    base: { color: '#c5c6c7', speed: 200, radius: 15 },
    sun: { color: '#ffb347', speed: 180, radius: 18 },    // Sun-Flame Avatar
    earth: { color: '#8b4513', speed: 120, radius: 25 },   // Earth-Breaker Titan
    gale: { color: '#aeeeee', speed: 300, radius: 12 },    // Gale-Blade Hunter
    mystic: { color: '#dda0dd', speed: 200, radius: 15 }   // Ritual Cleanser
};

// UI Elements
const dialOptions = {
    base: document.getElementById('avatar-base'),
    sun: document.getElementById('avatar-sun'),
    earth: document.getElementById('avatar-earth'),
    gale: document.getElementById('avatar-gale'),
    mystic: document.getElementById('avatar-mystic')
};

function transform(form) {
    if (player.currentForm === form) return;
    
    player.currentForm = form;
    player.color = avatars[form].color;
    player.speed = avatars[form].speed;
    player.radius = avatars[form].radius;
    
    // Update UI
    Object.values(dialOptions).forEach(el => el.classList.remove('active'));
    dialOptions[form].classList.add('active');
}

// Game Loop
function gameLoop(timestamp) {
    deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    update();
    draw();

    requestAnimationFrame(gameLoop);
}

function update() {
    // Transformations
    if (keys['b']) transform('base');
    if (keys['1']) transform('sun');
    if (keys['2']) transform('earth');
    if (keys['3']) transform('gale');
    if (keys['4']) transform('mystic');

    // Player movement
    let dx = 0;
    let dy = 0;
    
    if (keys.w) dy -= 1;
    if (keys.s) dy += 1;
    if (keys.a) dx -= 1;
    if (keys.d) dx += 1;
    
    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
        const length = Math.sqrt(dx * dx + dy * dy);
        dx /= length;
        dy /= length;
    }
    
    player.x += dx * player.speed * deltaTime;
    player.y += dy * player.speed * deltaTime;
    
    // Boundary check
    player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));
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
    
    // Draw player
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = player.color;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw aim line
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
    ctx.lineTo(player.x + Math.cos(angle) * 30, player.y + Math.sin(angle) * 30);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.stroke();
}

// Start game
requestAnimationFrame(gameLoop);
