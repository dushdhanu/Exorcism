import { Input } from './engine/Input.js';
import { Camera } from './engine/Camera.js';
import { ParticleSystem } from './engine/ParticleSystem.js';
import { AudioSystem } from './engine/Audio.js';
import { Player, Projectile } from './entities/Player.js';
import { LevelManager } from './world/LevelManager.js';
import { UIManager } from './ui/UIManager.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let lastTime = 0;

export const Game = {
    ctx,
    canvas,
    worldSize: { w: 2000, h: 2000 },
    deltaTime: 0,
    particles: new ParticleSystem(),
    camera: new Camera(),
    input: new Input(canvas),
    audio: new AudioSystem(),
    ui: new UIManager(),
    levelManager: new LevelManager(),
    player: null,
    projectiles: [],
    enemies: [],
    coins: [],
    obstacles: [],
    gameState: 'menu',
    
    init() {
        window.addEventListener('resize', () => this.resize());
        this.resize();
        this.ui.init(this);
        requestAnimationFrame((t) => this.loop(t));
    },
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },
    
    start() {
        this.audio.init();
        this.player = new Player(this.worldSize.w/2, this.worldSize.h/2);
        this.projectiles = [];
        this.enemies = [];
        this.coins = [];
        this.particles.clear();
        this.levelManager.reset(this);
        this.gameState = 'playing';
        this.ui.showGame();
    },
    
    gameOver() {
        this.gameState = 'gameover';
        this.ui.showGameOver(this.levelManager.currentLevel);
    },
    
    loop(timestamp) {
        this.deltaTime = Math.min((timestamp - lastTime) / 1000, 0.1);
        lastTime = timestamp;
        
        if(this.gameState === 'playing') {
            this.update();
        }
        this.draw();
        requestAnimationFrame((t) => this.loop(t));
    },
    
    update() {
        this.input.update(this.camera);
        this.player.update(this);
        this.camera.follow(this.player, this.canvas, this.deltaTime);
        this.levelManager.update(this);
        
        // Update Projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            let p = this.projectiles[i];
            p.update(this.deltaTime);
            if (p.isDead(this.worldSize)) {
                this.projectiles.splice(i, 1);
                continue;
            }
            if (this.levelManager.checkProjectileCollision(p, this.obstacles)) {
                this.particles.spawn(p.x, p.y, p.color, 5);
                this.projectiles.splice(i, 1);
            }
        }
        
        // Update Coins
        for (let i = this.coins.length - 1; i >= 0; i--) {
            let c = this.coins[i];
            if (Math.hypot(this.player.x - c.x, this.player.y - c.y) < this.player.radius + c.radius) {
                this.coins.splice(i, 1);
                this.levelManager.addCoin(this);
            }
        }
        
        // Update Enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            let e = this.enemies[i];
            e.update(this);
            if(e.hp <= 0) {
                this.enemies.splice(i, 1);
            }
        }
        
        this.particles.update(this.deltaTime);
        this.ui.updateHUD(this);
    },
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        // Background
        this.ctx.fillStyle = this.levelManager.isDesperation() ? '#1a0000' : '#0b0c10';
        this.ctx.fillRect(0, 0, this.worldSize.w, this.worldSize.h);
        
        this.ctx.strokeStyle = '#1f2833'; this.ctx.lineWidth = 2;
        for(let i=0; i<=this.worldSize.w; i+=100) { this.ctx.beginPath(); this.ctx.moveTo(i, 0); this.ctx.lineTo(i, this.worldSize.h); this.ctx.stroke(); }
        for(let i=0; i<=this.worldSize.h; i+=100) { this.ctx.beginPath(); this.ctx.moveTo(0, i); this.ctx.lineTo(this.worldSize.w, i); this.ctx.stroke(); }
        
        if(this.gameState !== 'playing') { this.ctx.restore(); return; }

        // Obstacles
        this.obstacles.forEach(o => {
            if(o.type === 'mud') {
                const grad = this.ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
                grad.addColorStop(0, 'rgba(40,25,10,0.8)'); grad.addColorStop(1, 'rgba(40,25,10,0)');
                this.ctx.fillStyle = grad;
                this.ctx.beginPath(); this.ctx.arc(o.x, o.y, o.r, 0, Math.PI*2); this.ctx.fill();
            } else if(o.type === 'crypt') {
                this.ctx.fillStyle = '#111'; this.ctx.strokeStyle = '#00f3ff'; this.ctx.lineWidth = 1;
                this.ctx.shadowBlur = 15; this.ctx.shadowColor = '#00f3ff';
                this.ctx.fillRect(o.x-o.w/2, o.y-o.h/2, o.w, o.h); 
                this.ctx.strokeRect(o.x-o.w/2, o.y-o.h/2, o.w, o.h);
                this.ctx.shadowBlur = 0;
            }
        });
        
        // Coins
        this.coins.forEach(c => {
            this.ctx.shadowBlur = 20; this.ctx.shadowColor = '#ffaa00';
            this.ctx.fillStyle = '#ffaa00';
            this.ctx.beginPath(); this.ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2); this.ctx.fill();
            this.ctx.fillStyle = '#fff';
            this.ctx.beginPath(); this.ctx.arc(c.x, c.y, c.radius*0.5, 0, Math.PI * 2); this.ctx.fill();
            this.ctx.shadowBlur = 0;
        });

        this.particles.draw(this.ctx);
        this.projectiles.forEach(p => p.draw(this.ctx));
        this.enemies.forEach(e => e.draw(this.ctx, this.player));
        this.player.draw(this.ctx, this.input);
        
        // Ambient Lighting (Vignette)
        const playerGrad = this.ctx.createRadialGradient(this.player.x, this.player.y, 100, this.player.x, this.player.y, 800);
        playerGrad.addColorStop(0, 'rgba(0,0,0,0)');
        playerGrad.addColorStop(1, 'rgba(0,0,0,0.85)');
        this.ctx.fillStyle = playerGrad;
        this.ctx.fillRect(this.camera.x, this.camera.y, this.canvas.width, this.canvas.height);

        this.ctx.restore();
    }
};

Game.init();
