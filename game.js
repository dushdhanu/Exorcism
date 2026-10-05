const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI Elements
const uiLayer = document.getElementById('ui-layer');
const menuScreen = document.getElementById('menu-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const finalScore = document.getElementById('final-score');
const levelDisplay = document.getElementById('level-display');
const coinDisplay = document.getElementById('coin-display');
const healthBar = document.getElementById('health-bar');
const pranaBar = document.getElementById('prana-bar');

const dialOptions = {
    base: document.getElementById('avatar-base'),
    sun: document.getElementById('avatar-sun'),
    earth: document.getElementById('avatar-earth'),
    gale: document.getElementById('avatar-gale'),
    mystic: document.getElementById('avatar-mystic')
};

// Game State
let gameState = 'menu'; // 'menu', 'playing', 'gameover'
let lastTime = 0;
let deltaTime = 0;
let currentLevel = 1;
let coinsCollected = 0;
let coinsNeeded = 5;
let enemySpawnTimer = 0;
let desperationTriggered = false;

// Audio
let audioCtx;
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playSound(type) {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    if (type === 'shoot') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'hit') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
    } else if (type === 'coin') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.setValueAtTime(1200, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
    } else if (type === 'levelup') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(600, now + 0.4);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
    }
}

// Input handling
const keys = { w: false, a: false, s: false, d: false, 1: false, 2: false, 3: false, 4: false, b: false };
const mouse = { x: 0, y: 0, down: false };

window.addEventListener('keydown', e => { if(keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', e => { if(keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key.toLowerCase()] = false; });
canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});
canvas.addEventListener('mousedown', () => mouse.down = true);
canvas.addEventListener('mouseup', () => mouse.down = false);

// Entities
let player, projectiles, enemies, coins, particles, obstacles;

const avatars = {
    base: { color: '#c5c6c7', speed: 200, radius: 15 },
    sun: { color: '#ffb347', speed: 180, radius: 18 },
    earth: { color: '#8b4513', speed: 120, radius: 25 },
    gale: { color: '#aeeeee', speed: 300, radius: 12 },
    mystic: { color: '#dda0dd', speed: 200, radius: 15 }
};

function initGame() {
    player = {
        x: canvas.width / 2, y: canvas.height / 2,
        radius: 15, speed: 200, color: '#c5c6c7',
        currentForm: 'base', health: 100, maxHealth: 100, prana: 100, maxPrana: 100
    };
    projectiles = []; enemies = []; coins = []; particles = [];
    obstacles = generateObstacles();
    
    currentLevel = 1;
    coinsCollected = 0;
    coinsNeeded = 5;
    desperationTriggered = false;
    
    updateUI();
    gameState = 'playing';
    menuScreen.classList.remove('active');
    gameOverScreen.classList.remove('active');
    uiLayer.style.display = 'flex';
}

function generateObstacles() {
    const obs = [];
    // Crypts (blocking)
    for(let i=0; i<3; i++) obs.push({ x: Math.random()*700+50, y: Math.random()*500+50, w: 40, h: 60, type: 'crypt' });
    // Mud pits (slows movement)
    for(let i=0; i<2; i++) obs.push({ x: Math.random()*700+50, y: Math.random()*500+50, r: 50, type: 'mud' });
    return obs;
}

function transform(form) {
    if (player.currentForm === form) return;
    player.currentForm = form;
    player.color = avatars[form].color;
    player.speed = avatars[form].speed;
    player.radius = avatars[form].radius;
    Object.values(dialOptions).forEach(el => el.classList.remove('active'));
    dialOptions[form].classList.add('active');
}

function spawnParticle(x, y, color) {
    for(let i=0; i<8; i++) {
        particles.push({
            x, y,
            vx: (Math.random()-0.5)*200, vy: (Math.random()-0.5)*200,
            life: 0.5, maxLife: 0.5, color, radius: Math.random()*3+1
        });
    }
}

function spawnEnemy(forceType = null) {
    const levelData = [
        { type: 'Mohini', radius: 12, hp: 30, speed: 100, damage: 10, color: '#ffffff' }, 
        { type: 'Mahasona', radius: 25, hp: 80, speed: 60, damage: 25, color: '#4a0000' }, 
        { type: 'Kalu Kumaraya', radius: 10, hp: 20, speed: 180, damage: 15, color: '#111111' }, 
        { type: 'Giri Yaka', radius: 20, hp: 50, speed: 90, damage: 20, color: '#228b22' } 
    ];
    
    let type = forceType;
    if (!type) {
        const typeIdx = (currentLevel - 1) % levelData.length;
        type = levelData[typeIdx];
    }
    
    let x, y;
    if (Math.random() > 0.5) { x = Math.random() > 0.5 ? -30 : canvas.width+30; y = Math.random() * canvas.height; } 
    else { x = Math.random() * canvas.width; y = Math.random() > 0.5 ? -30 : canvas.height+30; }
    
    enemies.push({ ...type, x, y, timer: 0 });
}

function updateUI() {
    healthBar.style.width = Math.max(0, (player.health / player.maxHealth) * 100) + '%';
    pranaBar.style.width = Math.max(0, (player.prana / player.maxPrana) * 100) + '%';
    levelDisplay.innerText = 'Level: ' + currentLevel + (desperationTriggered ? ' [DESPERATION]' : '');
    coinDisplay.innerText = 'Coins: ' + coinsCollected + '/' + coinsNeeded;
}

function gameOver() {
    gameState = 'gameover';
    uiLayer.style.display = 'none';
    gameOverScreen.classList.add('active');
    finalScore.innerText = `You reached Level ${currentLevel} with ${coinsCollected} souls collected.`;
}

function update() {
    if (gameState !== 'playing') return;

    // Transformations
    if (keys['b']) transform('base');
    if (keys['1']) transform('sun');
    if (keys['2']) transform('earth');
    if (keys['3']) transform('gale');
    if (keys['4']) transform('mystic');

    // Movement & Obstacles
    let dx = 0, dy = 0;
    if (keys.w) dy -= 1; if (keys.s) dy += 1;
    if (keys.a) dx -= 1; if (keys.d) dx += 1;
    if (dx !== 0 && dy !== 0) { const len = Math.sqrt(dx*dx+dy*dy); dx/=len; dy/=len; }
    
    let currentSpeed = player.speed;
    obstacles.forEach(o => {
        if(o.type === 'mud') {
            const mdist = Math.sqrt(Math.pow(player.x-o.x,2)+Math.pow(player.y-o.y,2));
            if(mdist < o.r + player.radius) currentSpeed *= 0.4;
        }
    });
    
    let newX = player.x + dx * currentSpeed * deltaTime;
    let newY = player.y + dy * currentSpeed * deltaTime;
    
    // Crypt collision
    let blocked = false;
    obstacles.forEach(o => {
        if(o.type === 'crypt') {
            if(newX+player.radius > o.x - o.w/2 && newX-player.radius < o.x + o.w/2 &&
               newY+player.radius > o.y - o.h/2 && newY-player.radius < o.y + o.h/2) {
                blocked = true;
            }
        }
    });
    
    if(!blocked) { player.x = newX; player.y = newY; }
    player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));
    
    // Combat (Shooting)
    if (mouse.down && player.prana >= 1) {
        playSound('shoot');
        const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
        projectiles.push({ x: player.x, y: player.y, vx: Math.cos(angle)*500, vy: Math.sin(angle)*500, radius: 5, form: player.currentForm });
        player.prana -= 1;
        updateUI();
        mouse.down = false; 
    }
    
    if (player.prana < player.maxPrana) { player.prana += 5 * deltaTime; updateUI(); }
    
    // Spawner
    enemySpawnTimer -= deltaTime;
    if (enemySpawnTimer <= 0) {
        spawnEnemy();
        let spawnRate = Math.max(0.5, 2.0 - (currentLevel*0.2));
        if(desperationTriggered) spawnRate *= 0.5;
        enemySpawnTimer = spawnRate;
    }
    
    // Desperation Climax
    if(currentLevel >= 3 && player.health < 30 && !desperationTriggered) {
        desperationTriggered = true;
        updateUI();
        playSound('levelup'); // Scary sound in practice
        spawnEnemy({ type: 'Mohini', radius: 12, hp: 30, speed: 100, damage: 10, color: '#ffffff' });
        spawnEnemy({ type: 'Mahasona', radius: 25, hp: 80, speed: 60, damage: 25, color: '#4a0000' });
    }

    // Update Particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * deltaTime; p.y += p.vy * deltaTime;
        p.life -= deltaTime;
        if (p.life <= 0) particles.splice(i, 1);
    }
    
    // Update Projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.x += p.vx * deltaTime; p.y += p.vy * deltaTime;
        if (p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) { projectiles.splice(i, 1); continue; }
        
        let projBlocked = false;
        obstacles.forEach(o => {
            if(o.type === 'crypt' && p.x > o.x-o.w/2 && p.x < o.x+o.w/2 && p.y > o.y-o.h/2 && p.y < o.y+o.h/2) projBlocked = true;
        });
        if(projBlocked) { spawnParticle(p.x, p.y, '#66fcf1'); projectiles.splice(i, 1); }
    }

    // Update Coins
    for (let i = coins.length - 1; i >= 0; i--) {
        const c = coins[i];
        if (Math.sqrt(Math.pow(player.x-c.x,2) + Math.pow(player.y-c.y,2)) < player.radius + c.radius) {
            coins.splice(i, 1);
            coinsCollected++;
            playSound('coin');
            updateUI();
            
            if (coinsCollected >= coinsNeeded) {
                currentLevel++;
                coinsCollected = 0;
                coinsNeeded = currentLevel * 5; 
                enemies.length = 0; projectiles.length = 0;
                desperationTriggered = false;
                playSound('levelup');
                player.health = Math.min(player.maxHealth, player.health + 50); 
                obstacles = generateObstacles(); // randomize map
                updateUI();
            }
        }
    }
    
    // Update Enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        e.timer += deltaTime;
        let ex = player.x - e.x, ey = player.y - e.y;
        let dist = Math.sqrt(ex*ex + ey*ey);
        
        // AI Logic
        if(e.type === 'Kalu Kumaraya') {
            if(e.timer > 2) { e.x += ex*0.5; e.y += ey*0.5; e.timer = 0; spawnParticle(e.x, e.y, '#111'); } // Teleport dash
        } else if (e.type === 'Mohini') {
            if(Math.random() < 0.02) { ex += (Math.random()-0.5)*200; ey += (Math.random()-0.5)*200; } // Erratic
        }
        
        if (dist > 0) { e.x += (ex/dist) * e.speed * deltaTime; e.y += (ey/dist) * e.speed * deltaTime; }
        
        if (dist < player.radius + e.radius) {
            player.health -= e.damage * deltaTime;
            updateUI();
            if(player.health <= 0) gameOver();
        }
        
        // Projectile collision
        for (let j = projectiles.length - 1; j >= 0; j--) {
            const p = projectiles[j];
            const pdist = Math.sqrt(Math.pow(p.x-e.x,2) + Math.pow(p.y-e.y,2));
            if (pdist < e.radius + p.radius) {
                let dmg = 15;
                if (e.type === 'Mohini' && p.form === 'sun') dmg *= 2.5; 
                if (e.type === 'Mahasona' && p.form === 'earth') dmg *= 2.5; 
                if (e.type === 'Kalu Kumaraya' && p.form === 'gale') dmg *= 2.5;
                if (e.type === 'Giri Yaka' && p.form === 'mystic') dmg *= 2.5;
                
                e.hp -= dmg;
                spawnParticle(p.x, p.y, e.color);
                projectiles.splice(j, 1);
                
                if (e.hp <= 0) {
                    playSound('hit');
                    coins.push({ x: e.x, y: e.y, radius: 8 });
                    spawnParticle(e.x, e.y, e.color);
                    enemies.splice(i, 1);
                    break;
                }
            }
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Background
    const bgGrad = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 100, canvas.width/2, canvas.height/2, 600);
    bgGrad.addColorStop(0, '#151a22');
    bgGrad.addColorStop(1, desperationTriggered ? '#300' : '#0b0c10');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Grid
    ctx.strokeStyle = '#1f2833'; ctx.lineWidth = 1;
    for(let i=0; i<canvas.width; i+=50) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke(); }
    for(let i=0; i<canvas.height; i+=50) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke(); }

    if(gameState !== 'playing') return;

    // Obstacles
    obstacles.forEach(o => {
        if(o.type === 'mud') {
            ctx.fillStyle = 'rgba(50,30,10,0.6)';
            ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI*2); ctx.fill();
        } else if(o.type === 'crypt') {
            ctx.fillStyle = '#222'; ctx.strokeStyle = '#555'; ctx.lineWidth=2;
            ctx.fillRect(o.x-o.w/2, o.y-o.h/2, o.w, o.h); ctx.strokeRect(o.x-o.w/2, o.y-o.h/2, o.w, o.h);
        }
    });
    
    // Particles
    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2); ctx.fill();
        ctx.globalAlpha = 1.0;
    });

    // Coins
    ctx.fillStyle = '#ffd700'; ctx.shadowBlur = 10; ctx.shadowColor = '#ffd700';
    coins.forEach(c => { ctx.beginPath(); ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2); ctx.fill(); });
    ctx.shadowBlur = 0;

    // Enemies
    enemies.forEach(e => {
        ctx.fillStyle = e.color; ctx.shadowBlur = 15; ctx.shadowColor = e.color;
        ctx.beginPath(); ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    });
    ctx.shadowBlur = 0;

    // Player
    ctx.fillStyle = player.color; ctx.shadowBlur = 20; ctx.shadowColor = player.color;
    ctx.beginPath(); ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Aim line
    ctx.beginPath(); ctx.moveTo(player.x, player.y);
    const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
    ctx.lineTo(player.x + Math.cos(angle) * 40, player.y + Math.sin(angle) * 40);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2; ctx.stroke();

    // Projectiles
    ctx.fillStyle = '#66fcf1'; ctx.shadowBlur = 10; ctx.shadowColor = '#66fcf1';
    projectiles.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill(); });
    ctx.shadowBlur = 0;
}

function gameLoop(timestamp) {
    deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Button Events
startBtn.addEventListener('click', () => { initAudio(); initGame(); });
restartBtn.addEventListener('click', () => { initGame(); });

// Init
requestAnimationFrame(gameLoop);
