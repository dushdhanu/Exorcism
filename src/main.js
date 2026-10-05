import * as THREE from 'three';
import { Core3D } from './engine/Core3D.js';
import { Input } from './engine/Input.js';

const canvas = document.getElementById('gameCanvas');

export const Game = {
    core: null,
    input: null,
    player: null,
    clock: new THREE.Clock(),
    gameState: 'menu',
    
    init() {
        this.core = new Core3D(canvas);
        this.input = new Input(canvas);
        
        // Build Graveyard Arena
        const groundGeo = new THREE.PlaneGeometry(200, 200);
        const groundMat = new THREE.MeshStandardMaterial({ color: 0x111a11, roughness: 0.9, metalness: 0.1 });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.core.scene.add(ground);
        
        // Add some random tombstones
        for(let i=0; i<50; i++) {
            const size = 1 + Math.random()*2;
            const tombGeo = new THREE.BoxGeometry(size, size*2, size*0.5);
            const tombMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
            const tomb = new THREE.Mesh(tombGeo, tombMat);
            tomb.position.set((Math.random()-0.5)*150, size, (Math.random()-0.5)*150);
            tomb.castShadow = true;
            tomb.receiveShadow = true;
            this.core.scene.add(tomb);
        }

        // Temp Player Mesh
        const playerGeo = new THREE.BoxGeometry(2, 4, 2);
        const playerMat = new THREE.MeshStandardMaterial({ color: 0x00f3ff });
        this.player = new THREE.Mesh(playerGeo, playerMat);
        this.player.position.y = 2;
        this.player.castShadow = true;
        this.core.scene.add(this.player);

        document.getElementById('start-btn').addEventListener('click', () => {
            document.getElementById('menu-screen').classList.add('hidden');
            this.gameState = 'playing';
        });

        this.loop();
    },

    loop() {
        requestAnimationFrame(() => this.loop());
        
        const dt = this.clock.getDelta();
        
        if (this.gameState === 'playing') {
            // Basic movement test
            let dx = 0, dz = 0;
            if(this.input.keys['KeyW']) dz -= 1;
            if(this.input.keys['KeyS']) dz += 1;
            if(this.input.keys['KeyA']) dx -= 1;
            if(this.input.keys['KeyD']) dx += 1;
            
            if(dx !== 0 || dz !== 0) {
                const len = Math.sqrt(dx*dx + dz*dz);
                this.player.position.x += (dx/len) * 20 * dt;
                this.player.position.z += (dz/len) * 20 * dt;
            }
            
            this.core.updateCamera(this.player.position);
            this.core.pointLight.position.copy(this.player.position);
            this.core.pointLight.position.y += 2;
        }

        this.core.render();
    }
};

Game.init();
