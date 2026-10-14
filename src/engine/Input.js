import * as THREE from 'three';

export class Input {
    constructor(canvas) {
        this.canvas = canvas;
        this.keys = {};
        this.mouse = {
            screenX: 0,
            screenY: 0,
            ndcX: 0,
            ndcY: 0,
            down: false,
            rightDown: false,
            worldPoint: new THREE.Vector3(0, 0, 0)
        };

        this.raycaster = new THREE.Raycaster();
        this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        
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

        window.addEventListener('mousemove', e => {
            this.mouse.screenX = e.clientX;
            this.mouse.screenY = e.clientY;
            this.mouse.ndcX = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.ndcY = -(e.clientY / window.innerHeight) * 2 + 1;
        });

        window.addEventListener('mousedown', e => {
            if (e.button === 0) this.mouse.down = true;
            if (e.button === 2) this.mouse.rightDown = true;
        });

        window.addEventListener('mouseup', e => {
            if (e.button === 0) this.mouse.down = false;
            if (e.button === 2) this.mouse.rightDown = false;
        });

        // Prevent right click menu on canvas
        window.addEventListener('contextmenu', e => {
            if (e.target === this.canvas || e.target.closest('#game-wrapper')) {
                e.preventDefault();
            }
        });
    }

    update(camera) {
        if (!camera) return;
        this.raycaster.setFromCamera(
            new THREE.Vector2(this.mouse.ndcX, this.mouse.ndcY),
            camera
        );
        this.raycaster.ray.intersectPlane(this.groundPlane, this.mouse.worldPoint);
    }
}
