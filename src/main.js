import * as THREE from 'three';
import { Core3D } from './engine/Core3D.js';
import { Input } from './engine/Input.js';

const canvas = document.getElementById('gameCanvas');

export const Game = {
    core: null,
    input: null,
    player: null,
    enemies: [],
    clock: new THREE.Clock(),
    gameState: 'menu',
    
    // Avatars based on prompt
    avatars: {
        'Digit1': { name: 'Suriya Divya', color: 0xffaa00, speed: 25 },
        'Digit2': { name: 'Maha Gaja', color: 0x555555, speed: 15 },
        'Digit3': { name: 'Vayu Yodheya', color: 0x00ffcc, speed: 35 },
        'Digit4': { name: 'Shanthikarma Mystic', color: 0xdd88ff, speed: 20 }
    },
    
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
        
        // Add Tombs
        for(let i=0; i<50; i++) {
            const size = 1 + Math.random()*2;
            const tombGeo = new THREE.BoxGeometry(size, size*2, size*0.5);
            const tombMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
            const tomb = new THREE.Mesh(tombGeo, tombMat);
            tomb.position.set((Math.random()-0.5)*150, size, (Math.random()-0.5)*150);
            tomb.castShadow = true; tomb.receiveShadow = true;
            this.core.scene.add(tomb);
        }

        // Player Setup
        const playerGeo = new THREE.BoxGeometry(2, 4, 2);
        const playerMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0x442200 });
        this.player = new THREE.Mesh(playerGeo, playerMat);
        this.player.position.y = 2;
        this.player.castShadow = true;
        this.player.userData = { speed: 25, dashTimer: 0 };
        this.core.scene.add(this.player);
        
        // Setup UI
        document.getElementById('start-btn').addEventListener('click', () => {
            document.getElementById('menu-screen').classList.add('hidden');
            this.spawnEnemies();
            this.gameState = 'playing';
        });

        this.loop();
    },
    
    spawnEnemies() {
        // Simple enemy setup for Mohini & Mahasona
        const enemyGeo = new THREE.CylinderGeometry(1.5, 1.5, 4, 16);
        
        // Mohini
        const mohiniMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
        const mohini = new THREE.Mesh(enemyGeo, mohiniMat);
        mohini.position.set(20, 2, 20);
        mohini.userData = { type: 'Mohini', speed: 18 };
        this.core.scene.add(mohini);
        this.enemies.push(mohini);
        
        // Mahasona
        const mahaMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        const mahasona = new THREE.Mesh(new THREE.BoxGeometry(3,5,3), mahaMat);
        mahasona.position.set(-20, 2.5, -20);
        mahasona.userData = { type: 'Mahasona', speed: 12 };
        this.core.scene.add(mahasona);
        this.enemies.push(mahasona);
    },

    loop() {
        requestAnimationFrame(() => this.loop());
        const dt = this.clock.getDelta();
        
        if (this.gameState === 'playing') {
            this.updatePlayer(dt);
            this.updateEnemies(dt);
            this.core.updateCamera(this.player.position);
            this.core.pointLight.position.copy(this.player.position);
            this.core.pointLight.position.y += 2;
        }

        this.core.render();
    },
    
    updatePlayer(dt) {
        // Avatar Swapping
        Object.keys(this.avatars).forEach(key => {
            if(this.input.keys[key]) {
                const avatar = this.avatars[key];
                this.player.material.color.setHex(avatar.color);
                this.player.material.emissive.setHex(avatar.color).multiplyScalar(0.2);
                this.player.userData.speed = avatar.speed;
                // UI update logic here if tied to DOM
            }
        });

        // Movement
        let dx = 0, dz = 0;
        if(this.input.keys['KeyW']) dz -= 1;
        if(this.input.keys['KeyS']) dz += 1;
        if(this.input.keys['KeyA']) dx -= 1;
        if(this.input.keys['KeyD']) dx += 1;
        
        let moveSpeed = this.player.userData.speed;
        
        // Dash
        if(this.player.userData.dashTimer > 0) this.player.userData.dashTimer -= dt;
        if(this.input.keys['Space'] && this.player.userData.dashTimer <= 0 && (dx!==0 || dz!==0)) {
            moveSpeed *= 4; // Burst speed
            this.player.userData.dashTimer = 1.5; // Cooldown
        }

        if(dx !== 0 || dz !== 0) {
            const len = Math.sqrt(dx*dx + dz*dz);
            this.player.position.x += (dx/len) * moveSpeed * dt;
            this.player.position.z += (dz/len) * moveSpeed * dt;
        }
    },
    
    updateEnemies(dt) {
        this.enemies.forEach(enemy => {
            const dir = new THREE.Vector3().subVectors(this.player.position, enemy.position);
            dir.y = 0; // Keep on ground
            if (dir.length() > 2) {
                dir.normalize();
                enemy.position.addScaledVector(dir, enemy.userData.speed * dt);
            }
        });
    }
};

Game.init();
