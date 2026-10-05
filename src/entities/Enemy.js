export class Enemy {
    constructor(type, x, y) {
        this.x = x; this.y = y;
        this.type = type.type; this.radius = type.radius; this.hp = type.hp;
        this.speed = type.speed; this.damage = type.damage; this.color = type.color;
        this.behavior = type.behavior;
        this.stateTimer = 0;
    }
    
    update(game) {
        this.stateTimer += game.deltaTime;
        let ex = game.player.x - this.x, ey = game.player.y - this.y;
        let dist = Math.hypot(ex, ey);
        
        let moveSpeed = this.speed;
        if (this.behavior === 'erratic') { 
            if (Math.random() < 0.05) { this.targetX = game.player.x + (Math.random()-0.5)*300; this.targetY = game.player.y + (Math.random()-0.5)*300; }
            if (this.targetX) { ex = this.targetX - this.x; ey = this.targetY - this.y; dist = Math.hypot(ex, ey); }
            if (Math.random() < 0.1) game.particles.spawn(this.x, this.y, 'rgba(255,255,255,0.2)', 1, 0);
        } else if (this.behavior === 'teleport') { 
            if (this.stateTimer > 3) {
                this.stateTimer = 0;
                game.particles.spawn(this.x, this.y, '#333', 20, 2);
                this.x += (ex/dist) * 200; this.y += (ey/dist) * 200;
                game.particles.spawn(this.x, this.y, '#000', 20, 2);
            }
            if (this.stateTimer > 2.5) moveSpeed = 0;
        } else if (this.behavior === 'charge') { 
            if (this.stateTimer > 4) {
                if (this.stateTimer < 5) moveSpeed = this.speed * 2.5;
                else this.stateTimer = 0;
            }
        }
        
        if (dist > 0) {
            let nx = this.x + (ex/dist)*moveSpeed*game.deltaTime;
            let ny = this.y + (ey/dist)*moveSpeed*game.deltaTime;
            if(!game.levelManager.checkWallCollision(nx, ny, this.radius, game.obstacles)) {
                this.x = nx; this.y = ny;
            }
        }
        
        // Damage player
        if (Math.hypot(game.player.x-this.x, game.player.y-this.y) < game.player.radius + this.radius && !game.player.isDashing) {
            game.player.health -= this.damage * game.deltaTime;
            game.camera.shake(0.2, 5);
            game.particles.spawn(game.player.x, game.player.y, '#f00', 5);
            if(game.player.health <= 0) game.gameOver();
        }
        
        // Check hits
        for (let j = game.projectiles.length - 1; j >= 0; j--) {
            let p = game.projectiles[j];
            if (Math.hypot(p.x-this.x, p.y-this.y) < this.radius + p.radius) {
                let dmg = p.dmg;
                let isCrit = false;
                if (this.type === 'Mohini' && p.form === 'sun') { dmg *= 3; isCrit=true; }
                if (this.type === 'Mahasona' && p.form === 'earth') { dmg *= 3; isCrit=true; }
                if (this.type === 'Kalu Kumaraya' && p.form === 'gale') { dmg *= 3; isCrit=true; }
                if (this.type === 'Giri Yaka' && p.form === 'mystic') { dmg *= 3; isCrit=true; }
                
                this.hp -= dmg;
                game.particles.spawn(p.x, p.y, this.color, isCrit? 15:5);
                game.particles.spawnText(this.x, this.y-this.radius, Math.floor(dmg), isCrit ? '#ff0' : '#fff');
                game.audio.play('hit');
                game.projectiles.splice(j, 1);
            }
        }
    }
    
    draw(ctx, player) {
        ctx.shadowBlur = 20; ctx.shadowColor = this.color;
        ctx.fillStyle = '#000'; ctx.strokeStyle = this.color; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        
        ctx.fillStyle = this.color;
        let angle = Math.atan2(player.y - this.y, player.x - this.x);
        ctx.beginPath(); ctx.arc(this.x + Math.cos(angle - 0.5)*this.radius*0.5, this.y + Math.sin(angle - 0.5)*this.radius*0.5, 3, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(this.x + Math.cos(angle + 0.5)*this.radius*0.5, this.y + Math.sin(angle + 0.5)*this.radius*0.5, 3, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
    }
}
