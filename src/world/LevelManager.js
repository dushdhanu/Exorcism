import { Enemy } from '../entities/Enemy.js';

export class LevelManager {
    constructor() {
        this.currentLevel = 1;
        this.coinsCollected = 0;
        this.coinsNeeded = 5;
        this.desperationTriggered = false;
        this.enemySpawnTimer = 0;
    }
    
    reset(game) {
        this.currentLevel = 1;
        this.coinsCollected = 0;
        this.coinsNeeded = 5;
        this.desperationTriggered = false;
        this.generateWorld(game);
    }
    
    generateWorld(game) {
        game.obstacles = [];
        for(let i=0; i<30; i++) {
            game.obstacles.push({
                x: Math.random() * game.worldSize.w, y: Math.random() * game.worldSize.h,
                w: 60 + Math.random()*40, h: 60 + Math.random()*40, type: 'crypt'
            });
        }
        for(let i=0; i<15; i++) {
            game.obstacles.push({
                x: Math.random() * game.worldSize.w, y: Math.random() * game.worldSize.h,
                r: 80 + Math.random()*60, type: 'mud'
            });
        }
    }
    
    addCoin(game) {
        this.coinsCollected++;
        game.audio.play('coin');
        if (this.coinsCollected >= this.coinsNeeded) {
            this.currentLevel++;
            this.coinsCollected = 0;
            this.coinsNeeded = this.currentLevel * 5;
            game.enemies = []; game.projectiles = [];
            this.desperationTriggered = false;
            game.audio.play('levelup');
            game.ui.flash();
            game.player.health = Math.min(game.player.maxHealth, game.player.health + 40);
            this.generateWorld(game);
        }
    }
    
    isDesperation() { return this.desperationTriggered; }
    
    update(game) {
        this.enemySpawnTimer -= game.deltaTime;
        if (this.enemySpawnTimer <= 0) {
            this.spawnEnemy(game);
            let rate = Math.max(0.5, 2.0 - (this.currentLevel*0.15));
            this.enemySpawnTimer = this.desperationTriggered ? rate * 0.4 : rate;
        }
        
        if(this.currentLevel >= 3 && game.player.health < 30 && !this.desperationTriggered) {
            this.desperationTriggered = true;
            game.camera.shake(1.0, 10);
            game.audio.play('levelup');
            game.ui.flash();
            this.spawnEnemy(game, { type: 'Mohini', radius: 15, hp: 40, speed: 120, damage: 15, color: '#ffffff', behavior: 'erratic' });
            this.spawnEnemy(game, { type: 'Mahasona', radius: 30, hp: 120, speed: 80, damage: 30, color: '#ff2222', behavior: 'charge' });
        }
    }
    
    spawnEnemy(game, forceType = null) {
        const types = [
            { type: 'Mohini', radius: 15, hp: 40, speed: 120, damage: 15, color: '#ffffff', behavior: 'erratic' },
            { type: 'Mahasona', radius: 30, hp: 120, speed: 80, damage: 30, color: '#ff2222', behavior: 'charge' },
            { type: 'Kalu Kumaraya', radius: 12, hp: 30, speed: 180, damage: 20, color: '#333333', behavior: 'teleport' },
            { type: 'Giri Yaka', radius: 22, hp: 60, speed: 100, damage: 25, color: '#22ff22', behavior: 'normal' }
        ];
        let type = forceType || types[(this.currentLevel - 1) % types.length];
        
        let angle = Math.random() * Math.PI * 2;
        let dist = Math.max(game.canvas.width, game.canvas.height) * 0.8;
        let ex = game.player.x + Math.cos(angle)*dist;
        let ey = game.player.y + Math.sin(angle)*dist;
        
        game.enemies.push(new Enemy(type, ex, ey));
    }
    
    checkWallCollision(x, y, radius, obstacles) {
        let blocked = false;
        obstacles.forEach(o => {
            if(o.type === 'crypt') {
                if(x+radius > o.x-o.w/2 && x-radius < o.x+o.w/2 &&
                   y+radius > o.y-o.h/2 && y-radius < o.y+o.h/2) {
                    blocked = true;
                }
            }
        });
        return blocked;
    }
    
    checkProjectileCollision(p, obstacles) {
        let blocked = false;
        obstacles.forEach(o => {
            if(o.type === 'crypt' && p.x > o.x-o.w/2 && p.x < o.x+o.w/2 && p.y > o.y-o.h/2 && p.y < o.y+o.h/2) {
                blocked = true;
            }
        });
        return blocked;
    }
    
    drawObstacles(ctx, obstacles) {
        // Assume game draws this by calling game.obstacles
        // (Actually moving this to main.js is easier, but we can do it here)
    }
}
