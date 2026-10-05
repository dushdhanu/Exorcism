export class ParticleSystem {
    constructor() {
        this.particles = [];
        this.texts = [];
    }
    
    clear() {
        this.particles = [];
        this.texts = [];
    }
    
    spawn(x, y, color, count=10, speedMul=1) {
        for(let i=0; i<count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 200 * speedMul;
            this.particles.push({
                x, y, vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed,
                life: 0.3 + Math.random()*0.3, maxLife: 0.6,
                color, radius: 2 + Math.random()*3
            });
        }
    }
    
    spawnText(x, y, text, color) {
        this.texts.push({ x, y, text, color, life: 0.8, maxLife: 0.8, vy: -50 });
    }
    
    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.x += p.vx * dt; p.y += p.vy * dt;
            p.vx *= 0.95; p.vy *= 0.95;
            p.life -= dt;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
        for (let i = this.texts.length - 1; i >= 0; i--) {
            let t = this.texts[i];
            t.y += t.vy * dt; t.life -= dt;
            if (t.life <= 0) this.texts.splice(i, 1);
        }
    }
    
    draw(ctx) {
        ctx.globalCompositeOperation = 'lighter';
        this.particles.forEach(p => {
            ctx.fillStyle = p.color; ctx.globalAlpha = p.life / p.maxLife;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2); ctx.fill();
        });
        ctx.globalAlpha = 1.0; ctx.globalCompositeOperation = 'source-over';
        
        ctx.font = 'bold 16px Inter'; ctx.textAlign = 'center';
        this.texts.forEach(t => {
            ctx.fillStyle = t.color; ctx.globalAlpha = t.life / t.maxLife;
            ctx.fillText(t.text, t.x, t.y);
        });
        ctx.globalAlpha = 1;
    }
}
