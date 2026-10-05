const avatars = {
    'KeyB': { id: 'base', name: 'Base Form', color: '#c5c6c7', speed: 300, radius: 15, fireRate: 0.2, dmg: 10 },
    'Digit1': { id: 'sun', name: 'Sun-Flame', color: '#ffb347', speed: 280, radius: 18, fireRate: 0.15, dmg: 15 },
    'Digit2': { id: 'earth', name: 'Earth-Breaker', color: '#8b4513', speed: 200, radius: 25, fireRate: 0.4, dmg: 25 },
    'Digit3': { id: 'gale', name: 'Gale-Blade', color: '#aeeeee', speed: 450, radius: 12, fireRate: 0.1, dmg: 8 },
    'Digit4': { id: 'mystic', name: 'Mystic', color: '#dda0dd', speed: 300, radius: 15, fireRate: 0.25, dmg: 12 }
};

export class Projectile {
    constructor(x, y, vx, vy, form, color, dmg, radius) {
        this.x = x; this.y = y; this.vx = vx; this.vy = vy;
        this.form = form; this.color = color; this.dmg = dmg; this.radius = radius;
    }
    update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; }
    isDead(worldSize) { return (this.x < 0 || this.x > worldSize.w || this.y < 0 || this.y > worldSize.h); }
    draw(ctx) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = this.color; ctx.shadowBlur = 15; ctx.shadowColor = this.color;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0; ctx.globalCompositeOperation = 'source-over';
    }
}

export class Player {
    constructor(x, y) {
        this.x = x; this.y = y; this.vx = 0; this.vy = 0;
        this.radius = 15; this.speed = 300; this.color = '#c5c6c7'; this.currentForm = 'base';
        this.health = 100; this.maxHealth = 100; this.prana = 100; this.maxPrana = 100;
        this.shootTimer = 0; this.dashTimer = 0; this.dashCooldown = 1.0; this.isDashing = false;
    }

    update(game) {
        // Transform
        Object.keys(avatars).forEach(key => {
            if (game.input.keys[key]) {
                const form = avatars[key];
                if(this.currentForm !== form.id) {
                    this.currentForm = form.id;
                    this.color = form.color; this.speed = form.speed; this.radius = form.radius;
                    game.ui.updateDial(form.id);
                    game.particles.spawn(this.x, this.y, this.color, 20, 2);
                    game.camera.shake(0.1, 5);
                    game.audio.play('levelup');
                }
            }
        });

        let dx = 0, dy = 0;
        if (game.input.keys['KeyW']) dy -= 1; if (game.input.keys['KeyS']) dy += 1;
        if (game.input.keys['KeyA']) dx -= 1; if (game.input.keys['KeyD']) dx += 1;
        if (dx !== 0 && dy !== 0) { const len = Math.sqrt(dx*dx+dy*dy); dx/=len; dy/=len; }
        
        this.dashTimer -= game.deltaTime;
        if (game.input.keys['Space'] && this.dashTimer <= 0 && (dx!==0 || dy!==0)) {
            this.isDashing = true; this.dashTimer = this.dashCooldown;
            this.vx = dx * this.speed * 3; this.vy = dy * this.speed * 3;
            game.audio.play('dash');
            game.particles.spawn(this.x, this.y, '#fff', 15);
        }

        let currentSpeed = this.speed;
        if(!this.isDashing) {
            game.obstacles.forEach(o => {
                if(o.type === 'mud' && Math.hypot(this.x-o.x, this.y-o.y) < o.r + this.radius) currentSpeed *= 0.4;
            });
            this.vx = dx * currentSpeed; this.vy = dy * currentSpeed;
        } else {
            this.vx *= 0.9; this.vy *= 0.9;
            if(Math.hypot(this.vx, this.vy) < this.speed) this.isDashing = false;
            if(Math.random()<0.5) game.particles.spawn(this.x, this.y, this.color, 1, 0.1);
        }
        
        let nx = this.x + this.vx * game.deltaTime;
        let ny = this.y + this.vy * game.deltaTime;
        
        if(!game.levelManager.checkWallCollision(nx, ny, this.radius, game.obstacles)) {
            this.x = nx; this.y = ny;
        }
        
        this.x = Math.max(this.radius, Math.min(game.worldSize.w - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(game.worldSize.h - this.radius, this.y));
        
        // Combat
        this.shootTimer -= game.deltaTime;
        let stats = Object.values(avatars).find(f => f.id === this.currentForm) || avatars['KeyB'];
        if (game.input.mouse.down && this.prana >= 1 && this.shootTimer <= 0 && !this.isDashing) {
            game.audio.play('shoot');
            const angle = Math.atan2(game.input.mouse.worldY - this.y, game.input.mouse.worldX - this.x);
            game.projectiles.push(new Projectile(
                this.x, this.y, Math.cos(angle)*700, Math.sin(angle)*700,
                this.currentForm, this.color, stats.dmg, this.currentForm==='earth'? 10 : 5
            ));
            this.prana -= 2;
            this.shootTimer = stats.fireRate;
        }
        if (this.prana < this.maxPrana) this.prana += 8 * game.deltaTime;
    }
    
    draw(ctx, input) {
        ctx.shadowBlur = 30; ctx.shadowColor = this.color;
        ctx.fillStyle = '#000'; ctx.strokeStyle = this.color; ctx.lineWidth = this.isDashing ? 6 : 3;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.shadowBlur = 0;
        
        if(!this.isDashing) {
            ctx.beginPath(); ctx.moveTo(this.x, this.y);
            const angle = Math.atan2(input.mouse.worldY - this.y, input.mouse.worldX - this.x);
            ctx.lineTo(this.x + Math.cos(angle) * 50, this.y + Math.sin(angle) * 50);
            ctx.strokeStyle = this.color; ctx.lineWidth = 2; ctx.globalAlpha = 0.5; ctx.stroke(); ctx.globalAlpha = 1;
        }
    }
}
