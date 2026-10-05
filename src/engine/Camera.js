export class Camera {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.shakeTime = 0;
        this.shakeMag = 0;
    }
    
    shake(duration, magnitude) {
        this.shakeTime = duration;
        this.shakeMag = magnitude;
    }
    
    follow(target, canvas, dt) {
        let tx = target.x - canvas.width/2;
        let ty = target.y - canvas.height/2;
        this.x += (tx - this.x) * 5 * dt;
        this.y += (ty - this.y) * 5 * dt;
        
        if (this.shakeTime > 0) {
            this.shakeTime -= dt;
            this.x += (Math.random()-0.5) * this.shakeMag;
            this.y += (Math.random()-0.5) * this.shakeMag;
        }
    }
}
