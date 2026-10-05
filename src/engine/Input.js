export class Input {
    constructor(canvas) {
        this.keys = {};
        this.mouse = { x: 0, y: 0, worldX: 0, worldY: 0, down: false };
        
        window.addEventListener('keydown', e => {
            let code = e.code;
            if (code === 'Numpad1') code = 'Digit1';
            if (code === 'Numpad2') code = 'Digit2';
            if (code === 'Numpad3') code = 'Digit3';
            if (code === 'Numpad4') code = 'Digit4';
            this.keys[code] = true;
        });
        window.addEventListener('keyup', e => {
            let code = e.code;
            if (code === 'Numpad1') code = 'Digit1';
            if (code === 'Numpad2') code = 'Digit2';
            if (code === 'Numpad3') code = 'Digit3';
            if (code === 'Numpad4') code = 'Digit4';
            this.keys[code] = false;
        });
        window.addEventListener('mousemove', e => { this.mouse.x = e.clientX; this.mouse.y = e.clientY; });
        window.addEventListener('mousedown', () => this.mouse.down = true);
        window.addEventListener('mouseup', () => this.mouse.down = false);
    }
    
    update(camera) {
        this.mouse.worldX = this.mouse.x + camera.x;
        this.mouse.worldY = this.mouse.y + camera.y;
    }
}
