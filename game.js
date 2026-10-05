const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Resize canvas to full screen
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// UI Elements
const uiLayer = document.getElementById('ui-layer');
const menuScreen = document.getElementById('menu-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const flashOverlay = document.getElementById('flash-overlay');

// Game State
let gameState = 'menu';
let lastTime = 0, deltaTime = 0;
let currentLevel = 1, coinsCollected = 0, coinsNeeded = 5;
let enemySpawnTimer = 0, desperationTriggered = false;

// Camera & World
const worldSize = { w: 2000, h: 2000 };
let camera = { x: 0, y: 0, shakeTime: 0, shakeMagnitude: 0 };

// Audio Context
let audioCtx;
function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playSound(type, pitchVar = 0.1) {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    
    let p = 1 + (Math.random()*pitchVar*2 - pitchVar); // Pitch variation
    
    if (type === 'shoot') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(400 * p, now);
        osc.frequency.exponentialRampToValueAtTime(800 * p, now + 0.1);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'hit') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150 * p, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now); osc.stop(now + 0.2);
    } else if (type === 'coin') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800 * p, now);
        osc.frequency.setValueAtTime(1200 * p, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.3);
        osc.start(now); osc.stop(now + 0.3);
    } else if (type === 'levelup') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(800, now + 0.5);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.6);
        osc.start(now); osc.stop(now + 0.6);
    } else if (type === 'dash') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now); osc.stop(now + 0.2);
    }
}

// Input Handling
const keys = {};
const mouse = { x: 0, y: 0, worldX: 0, worldY: 0, down: false };
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);
window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
window.addEventListener('mousedown', () => mouse.down = true);
window.addEventListener('mouseup', () => mouse.down = false);

// Entities
let player, projectiles, enemies, coins, particles, texts, obstacles;

const avatars = {
    'KeyB': { id: 'base', name: 'Base Form', color: '#c5c6c7', speed: 300, radius: 15, fireRate: 0.2 },
    'Digit1': { id: 'sun', name: 'Sun-Flame', color: '#ffb347', speed: 280, radius: 18, fireRate: 0.15 },
    'Digit2': { id: 'earth', name: 'Earth-Breaker', color: '#8b4513', speed: 200, radius: 25, fireRate: 0.4 },
    'Digit3': { id: 'gale', name: 'Gale-Blade', color: '#aeeeee', speed: 450, radius: 12, fireRate: 0.1 },
    'Digit4': { id: 'mystic', name: 'Mystic', color: '#dda0dd', speed: 300, radius: 15, fireRate: 0.25 }
};

function screenShake(duration, magnitude) {
    camera.shakeTime = duration;
    camera.shakeMagnitude = magnitude;
}

function flashScreen() {
    flashOverlay.style.opacity = '1';
    setTimeout(() => flashOverlay.style.opacity = '0', 50);
}

function initGame() {
    player = {
        x: worldSize.w/2, y: worldSize.h/2, vx: 0, vy: 0,
        radius: 15, speed: 300, color: '#c5c6c7', currentForm: 'base',
        health: 100, maxHealth: 100, prana: 100, maxPrana: 100,
        shootTimer: 0, dashTimer: 0, dashCooldown: 1.0, isDashing: false
    };
    projectiles = []; enemies = []; coins = []; particles = []; texts = []; obstacles = [];
    currentLevel = 1; coinsCollected = 0; coinsNeeded = 5; desperationTriggered = false;
    generateWorld();
    
    updateUI();
    gameState = 'playing';
    menuScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    uiLayer.classList.remove('hidden');
}

function generateWorld() {
    obstacles = [];
    for(let i=0; i<30; i++) {
        obstacles.push({
            x: Math.random() * worldSize.w, y: Math.random() * worldSize.h,
            w: 60 + Math.random()*40, h: 60 + Math.random()*40, type: 'crypt'
        });
    }
    for(let i=0; i<15; i++) {
        obstacles.push({
            x: Math.random() * worldSize.w, y: Math.random() * worldSize.h,
            r: 80 + Math.random()*60, type: 'mud'
        });
    }
}

function spawnParticle(x, y, color, count=10, speedMul=1) {
    for(let i=0; i<count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 200 * speedMul;
        particles.push({
            x, y, vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed,
            life: 0.3 + Math.random()*0.3, maxLife: 0.6,
            color, radius: 2 + Math.random()*3
        });
    }
}

function spawnText(x, y, text, color) {
    texts.push({ x, y, text, color, life: 0.8, maxLife: 0.8, vy: -50 });
}

function spawnEnemy(forceType = null) {
    const types = [
        { type: 'Mohini', radius: 15, hp: 40, speed: 120, damage: 15, color: '#ffffff', behavior: 'erratic' },
        { type: 'Mahasona', radius: 30, hp: 120, speed: 80, damage: 30, color: '#ff2222', behavior: 'charge' },
        { type: 'Kalu Kumaraya', radius: 12, hp: 30, speed: 180, damage: 20, color: '#333333', behavior: 'teleport' },
        { type: 'Giri Yaka', radius: 22, hp: 60, speed: 100, damage: 25, color: '#22ff22', behavior: 'normal' }
    ];
    let type = forceType || types[(currentLevel - 1) % types.length];
    
    // Spawn outside camera view
    let angle = Math.random() * Math.PI * 2;
    let dist = Math.max(canvas.width, canvas.height) * 0.8;
    let ex = player.x + Math.cos(angle)*dist;
    let ey = player.y + Math.sin(angle)*dist;
    
    enemies.push({ ...type, x: ex, y: ey, stateTimer: 0 });
}

function updateUI() {
    document.getElementById('health-bar').style.width = Math.max(0, (player.health/player.maxHealth)*100) + '%';
    document.getElementById('prana-bar').style.width = Math.max(0, (player.prana/player.maxPrana)*100) + '%';
    document.getElementById('level-display').innerText = 'Wave ' + currentLevel + (desperationTriggered ? ' [DESPERATION]' : '');
    document.getElementById('coin-display').innerText = 'Souls: ' + coinsCollected + ' / ' + coinsNeeded;
}

function gameOver() {
    gameState = 'gameover';
    uiLayer.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');
    document.getElementById('final-score').innerText = `You survived until Wave ${currentLevel}`;
}

function update() {
    if (gameState !== 'playing') return;

    // Transform
    Object.keys(avatars).forEach(key => {
        if (keys[key]) {
            const form = avatars[key];
            if(player.currentForm !== form.id) {
                player.currentForm = form.id;
                player.color = form.color; player.speed = form.speed; player.radius = form.radius;
                document.querySelectorAll('.dial-option').forEach(el => el.classList.remove('active'));
                document.getElementById('avatar-' + form.id).classList.add('active');
                spawnParticle(player.x, player.y, player.color, 20, 2);
                screenShake(0.1, 5);
                playSound('levelup');
            }
        }
    });

    // Player Movement & Dash
    let dx = 0, dy = 0;
    if (keys['KeyW']) dy -= 1; if (keys['KeyS']) dy += 1;
    if (keys['KeyA']) dx -= 1; if (keys['KeyD']) dx += 1;
    if (dx !== 0 && dy !== 0) { const len = Math.sqrt(dx*dx+dy*dy); dx/=len; dy/=len; }
    
    player.dashTimer -= deltaTime;
    if (keys['Space'] && player.dashTimer <= 0 && (dx!==0 || dy!==0)) {
        player.isDashing = true;
        player.dashTimer = player.dashCooldown;
        player.vx = dx * player.speed * 3;
        player.vy = dy * player.speed * 3;
        playSound('dash');
        spawnParticle(player.x, player.y, '#fff', 15);
    }

    let currentSpeed = player.speed;
    if(!player.isDashing) {
        obstacles.forEach(o => {
            if(o.type === 'mud' && Math.hypot(player.x-o.x, player.y-o.y) < o.r + player.radius) currentSpeed *= 0.4;
        });
        player.vx = dx * currentSpeed;
        player.vy = dy * currentSpeed;
    } else {
        // Friction on dash
        player.vx *= 0.9; player.vy *= 0.9;
        if(Math.hypot(player.vx, player.vy) < player.speed) player.isDashing = false;
        // Dash trail
        if(Math.random()<0.5) spawnParticle(player.x, player.y, player.color, 1, 0.1);
    }
    
    let nx = player.x + player.vx * deltaTime;
    let ny = player.y + player.vy * deltaTime;
    
    // Crypt Collision (Player)
    let blocked = false;
    obstacles.forEach(o => {
        if(o.type === 'crypt') {
            if(nx+player.radius > o.x-o.w/2 && nx-player.radius < o.x+o.w/2 &&
               ny+player.radius > o.y-o.h/2 && ny-player.radius < o.y+o.h/2) {
                blocked = true;
            }
        }
    });
    if(!blocked) { player.x = nx; player.y = ny; }
    
    player.x = Math.max(player.radius, Math.min(worldSize.w - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(worldSize.h - player.radius, player.y));
    
    // Camera Logic
    let targetCamX = player.x - canvas.width/2;
    let targetCamY = player.y - canvas.height/2;
    camera.x += (targetCamX - camera.x) * 5 * deltaTime;
    camera.y += (targetCamY - camera.y) * 5 * deltaTime;
    
    if (camera.shakeTime > 0) {
        camera.shakeTime -= deltaTime;
        camera.x += (Math.random()-0.5)*camera.shakeMagnitude;
        camera.y += (Math.random()-0.5)*camera.shakeMagnitude;
    }
    
    mouse.worldX = mouse.x + camera.x;
    mouse.worldY = mouse.y + camera.y;

    // Combat (Shooting)
    player.shootTimer -= deltaTime;
    let currentFormStats = Object.values(avatars).find(f => f.id === player.currentForm) || avatars['KeyB'];
    if (mouse.down && player.prana >= 1 && player.shootTimer <= 0 && !player.isDashing) {
        playSound('shoot');
        const angle = Math.atan2(mouse.worldY - player.y, mouse.worldX - player.x);
        projectiles.push({
            x: player.x, y: player.y, 
            vx: Math.cos(angle)*700, vy: Math.sin(angle)*700, 
            radius: player.currentForm==='earth'? 10 : 5, 
            form: player.currentForm, color: player.color
        });
        player.prana -= 2;
        player.shootTimer = currentFormStats.fireRate;
        updateUI();
    }
    if (player.prana < player.maxPrana) { player.prana += 8 * deltaTime; updateUI(); }
    
    // Spawner
    enemySpawnTimer -= deltaTime;
    if (enemySpawnTimer <= 0) {
        spawnEnemy();
        let rate = Math.max(0.5, 2.0 - (currentLevel*0.15));
        enemySpawnTimer = desperationTriggered ? rate * 0.4 : rate;
    }
    
    if(currentLevel >= 3 && player.health < 30 && !desperationTriggered) {
        desperationTriggered = true;
        updateUI(); screenShake(1.0, 10); playSound('levelup'); flashScreen();
        spawnEnemy({ type: 'Mohini', radius: 15, hp: 40, speed: 120, damage: 15, color: '#ffffff', behavior: 'erratic' });
        spawnEnemy({ type: 'Mahasona', radius: 30, hp: 120, speed: 80, damage: 30, color: '#ff2222', behavior: 'charge' });
    }

    // Update Entities
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx * deltaTime; p.y += p.vy * deltaTime;
        p.vx *= 0.95; p.vy *= 0.95; // friction
        p.life -= deltaTime;
        if (p.life <= 0) particles.splice(i, 1);
    }
    
    for (let i = texts.length - 1; i >= 0; i--) {
        let t = texts[i];
        t.y += t.vy * deltaTime;
        t.life -= deltaTime;
        if (t.life <= 0) texts.splice(i, 1);
    }
    
    for (let i = projectiles.length - 1; i >= 0; i--) {
        let p = projectiles[i];
        p.x += p.vx * deltaTime; p.y += p.vy * deltaTime;
        if (p.x < 0 || p.x > worldSize.w || p.y < 0 || p.y > worldSize.h) { projectiles.splice(i, 1); continue; }
        let pBlocked = false;
        obstacles.forEach(o => {
            if(o.type === 'crypt' && p.x > o.x-o.w/2 && p.x < o.x+o.w/2 && p.y > o.y-o.h/2 && p.y < o.y+o.h/2) pBlocked = true;
        });
        if(pBlocked) { spawnParticle(p.x, p.y, p.color, 5); projectiles.splice(i, 1); }
    }

    for (let i = coins.length - 1; i >= 0; i--) {
        let c = coins[i];
        if (Math.hypot(player.x-c.x, player.y-c.y) < player.radius + c.radius) {
            coins.splice(i, 1);
            coinsCollected++; playSound('coin'); updateUI();
            if (coinsCollected >= coinsNeeded) {
                currentLevel++; coinsCollected = 0; coinsNeeded = currentLevel * 5; 
                enemies = []; projectiles = []; desperationTriggered = false;
                playSound('levelup'); flashScreen();
                player.health = Math.min(player.maxHealth, player.health + 40); 
                generateWorld(); updateUI();
            }
        }
    }
    
    for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i];
        e.stateTimer += deltaTime;
        let ex = player.x - e.x, ey = player.y - e.y;
        let dist = Math.hypot(ex, ey);
        
        // Advanced AI Behaviors
        let moveSpeed = e.speed;
        if (e.behavior === 'erratic') { // Mohini
            if (Math.random() < 0.05) { e.targetX = player.x + (Math.random()-0.5)*300; e.targetY = player.y + (Math.random()-0.5)*300; }
            if (e.targetX) { ex = e.targetX - e.x; ey = e.targetY - e.y; dist = Math.hypot(ex, ey); }
            if (Math.random() < 0.1) spawnParticle(e.x, e.y, 'rgba(255,255,255,0.2)', 1, 0);
        } else if (e.behavior === 'teleport') { // Kalu Kumaraya
            if (e.stateTimer > 3) {
                e.stateTimer = 0;
                spawnParticle(e.x, e.y, '#333', 20, 2);
                e.x += (ex/dist) * 200; e.y += (ey/dist) * 200; // Dash
                spawnParticle(e.x, e.y, '#000', 20, 2);
            }
            if (e.stateTimer > 2.5) moveSpeed = 0; // stop before dashing
        } else if (e.behavior === 'charge') { // Mahasona
            if (e.stateTimer > 4) {
                if (e.stateTimer < 5) moveSpeed = e.speed * 2.5; // Charge!
                else e.stateTimer = 0;
            }
        }
        
        if (dist > 0) {
            let nx = e.x + (ex/dist)*moveSpeed*deltaTime;
            let ny = e.y + (ey/dist)*moveSpeed*deltaTime;
            // Crypt Collision for enemies
            let blocked = false;
            obstacles.forEach(o => {
                if(o.type === 'crypt' && nx+e.radius > o.x-o.w/2 && nx-e.radius < o.x+o.w/2 && ny+e.radius > o.y-o.h/2 && ny-e.radius < o.y+o.h/2) blocked = true;
            });
            if(!blocked) { e.x = nx; e.y = ny; }
        }
        
        if (Math.hypot(player.x-e.x, player.y-e.y) < player.radius + e.radius && !player.isDashing) {
            player.health -= e.damage * deltaTime; updateUI(); screenShake(0.2, 5);
            spawnParticle(player.x, player.y, '#f00', 5);
            if(player.health <= 0) gameOver();
        }
        
        // Hits
        for (let j = projectiles.length - 1; j >= 0; j--) {
            let p = projectiles[j];
            if (Math.hypot(p.x-e.x, p.y-e.y) < e.radius + p.radius) {
                let dmg = p.form === 'earth' ? 25 : 15; // Earth does more base damage
                let isCrit = false;
                if (e.type === 'Mohini' && p.form === 'sun') { dmg *= 3; isCrit=true; }
                if (e.type === 'Mahasona' && p.form === 'earth') { dmg *= 3; isCrit=true; }
                if (e.type === 'Kalu Kumaraya' && p.form === 'gale') { dmg *= 3; isCrit=true; }
                if (e.type === 'Giri Yaka' && p.form === 'mystic') { dmg *= 3; isCrit=true; }
                
                e.hp -= dmg;
                spawnParticle(p.x, p.y, e.color, isCrit? 15:5);
                spawnText(e.x, e.y-e.radius, Math.floor(dmg), isCrit ? '#ff0' : '#fff');
                playSound('hit');
                projectiles.splice(j, 1);
                
                if (e.hp <= 0) {
                    coins.push({ x: e.x, y: e.y, radius: 10 });
                    spawnParticle(e.x, e.y, e.color, 30, 3);
                    screenShake(0.1, Math.min(10, dmg/5));
                    enemies.splice(i, 1);
                    break;
                }
            }
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    ctx.translate(-camera.x, -camera.y);
    
    // Background Ground
    ctx.fillStyle = desperationTriggered ? '#1a0000' : '#0b0c10';
    ctx.fillRect(0, 0, worldSize.w, worldSize.h);
    
    ctx.strokeStyle = '#1f2833'; ctx.lineWidth = 2;
    for(let i=0; i<=worldSize.w; i+=100) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, worldSize.h); ctx.stroke(); }
    for(let i=0; i<=worldSize.h; i+=100) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(worldSize.w, i); ctx.stroke(); }
    
    if(gameState === 'menu') { ctx.restore(); return; } // Don't draw game in menu

    // Obstacles
    obstacles.forEach(o => {
        if(o.type === 'mud') {
            const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
            grad.addColorStop(0, 'rgba(40,25,10,0.8)'); grad.addColorStop(1, 'rgba(40,25,10,0)');
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI*2); ctx.fill();
        } else if(o.type === 'crypt') {
            ctx.fillStyle = '#111'; ctx.strokeStyle = '#00f3ff'; ctx.lineWidth = 1;
            ctx.shadowBlur = 15; ctx.shadowColor = '#00f3ff';
            ctx.fillRect(o.x-o.w/2, o.y-o.h/2, o.w, o.h); 
            ctx.strokeRect(o.x-o.w/2, o.y-o.h/2, o.w, o.h);
            ctx.shadowBlur = 0;
        }
    });

    // Coins
    ctx.shadowBlur = 20; ctx.shadowColor = '#ffaa00';
    coins.forEach(c => {
        ctx.fillStyle = '#ffaa00';
        ctx.beginPath(); ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(c.x, c.y, c.radius*0.5, 0, Math.PI * 2); ctx.fill();
    });
    ctx.shadowBlur = 0;
    
    // Particles
    ctx.globalCompositeOperation = 'lighter';
    particles.forEach(p => {
        ctx.fillStyle = p.color; ctx.globalAlpha = p.life / p.maxLife;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha = 1.0; ctx.globalCompositeOperation = 'source-over';

    // Enemies
    enemies.forEach(e => {
        ctx.shadowBlur = 20; ctx.shadowColor = e.color;
        ctx.fillStyle = '#000'; ctx.strokeStyle = e.color; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        
        // Eyes
        ctx.fillStyle = e.color;
        let angle = Math.atan2(player.y - e.y, player.x - e.x);
        ctx.beginPath(); ctx.arc(e.x + Math.cos(angle - 0.5)*e.radius*0.5, e.y + Math.sin(angle - 0.5)*e.radius*0.5, 3, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(e.x + Math.cos(angle + 0.5)*e.radius*0.5, e.y + Math.sin(angle + 0.5)*e.radius*0.5, 3, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
    });

    // Player
    ctx.shadowBlur = 30; ctx.shadowColor = player.color;
    ctx.fillStyle = '#000'; ctx.strokeStyle = player.color; ctx.lineWidth = player.isDashing ? 6 : 3;
    ctx.beginPath(); ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Aim line
    if(!player.isDashing) {
        ctx.beginPath(); ctx.moveTo(player.x, player.y);
        const angle = Math.atan2(mouse.worldY - player.y, mouse.worldX - player.x);
        ctx.lineTo(player.x + Math.cos(angle) * 50, player.y + Math.sin(angle) * 50);
        ctx.strokeStyle = player.color; ctx.lineWidth = 2; ctx.globalAlpha = 0.5; ctx.stroke(); ctx.globalAlpha = 1;
    }

    // Projectiles
    ctx.globalCompositeOperation = 'lighter';
    projectiles.forEach(p => {
        ctx.fillStyle = p.color; ctx.shadowBlur = 15; ctx.shadowColor = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill();
    });
    ctx.shadowBlur = 0; ctx.globalCompositeOperation = 'source-over';
    
    // Floating Texts
    ctx.font = 'bold 16px Inter'; ctx.textAlign = 'center';
    texts.forEach(t => {
        ctx.fillStyle = t.color; ctx.globalAlpha = t.life / t.maxLife;
        ctx.fillText(t.text, t.x, t.y);
    });
    ctx.globalAlpha = 1;

    // Ambient Lighting (Vignette)
    const playerGrad = ctx.createRadialGradient(player.x, player.y, 100, player.x, player.y, 800);
    playerGrad.addColorStop(0, 'rgba(0,0,0,0)');
    playerGrad.addColorStop(1, 'rgba(0,0,0,0.85)');
    ctx.fillStyle = playerGrad;
    ctx.fillRect(camera.x, camera.y, canvas.width, canvas.height);

    ctx.restore();
}

function gameLoop(timestamp) {
    deltaTime = Math.min((timestamp - lastTime) / 1000, 0.1); // cap dt
    lastTime = timestamp;
    update(); draw();
    requestAnimationFrame(gameLoop);
}

startBtn.addEventListener('click', () => { initAudio(); initGame(); });
restartBtn.addEventListener('click', () => { initGame(); });

requestAnimationFrame(gameLoop);
