import * as THREE from 'three';
import { Core3D } from './engine/Core3D.js';
import { Input } from './engine/Input.js';

const canvas = document.getElementById('gameCanvas');

export const Game = {
    core: null,
    input: null,
    player: null,
    playerBody: null,
    enemies: [],
    projectiles: [],
    particles: [],
    damageTexts: [],
    clock: new THREE.Clock(),
    gameState: 'menu',
    
    // Level System
    currentLevel: 1,
    timeRemaining: 60,
    maxTime: 60,
    levelData: [
        { demon: 'Mohini', color: 0xffffff, shape: 'ghost', hp: 100 },
        { demon: 'Mahasona', color: 0xff0000, shape: 'titan', hp: 200 },
        { demon: 'Kalu Kumaraya', color: 0x330033, shape: 'shadow', hp: 300 },
        { demon: 'Giri Yaka', color: 0x00ff00, shape: 'blob', hp: 400 }
    ],
    
    // Camera Shake
    shakeTime: 0,
    shakeIntensity: 0,
    
    // UI Elements
    healthBar: document.getElementById('health-bar'),
    pranaBar: document.getElementById('prana-bar'),
    timerDisplay: document.getElementById('timer-display'),
    levelDisplay: document.getElementById('level-display'),
    
    // Avatar Stats
    avatars: {
        'Digit1': { name: 'Suriya Divya', color: 0xffaa00, speed: 30, type: 'range', cd: 0.3 },
        'Digit2': { name: 'Maha Gaja', color: 0x555555, speed: 15, type: 'melee_heavy', cd: 1.0 },
        'Digit3': { name: 'Vayu Yodheya', color: 0x00ffcc, speed: 45, type: 'melee_fast', cd: 0.2 },
        'Digit4': { name: 'Shanthikarma', color: 0xdd88ff, speed: 25, type: 'flamethrower', cd: 0.1 }
    },
    
    init() {
        this.core = new Core3D(canvas);
        this.input = new Input(canvas);
        
        // Adjust camera for isometric brawler feel
        this.core.cameraOffset = new THREE.Vector3(0, 30, 25);
        
        // Arena
        const groundGeo = new THREE.PlaneGeometry(300, 300);
        const groundMat = new THREE.MeshStandardMaterial({ color: 0x0a110a, roughness: 0.8 });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.core.scene.add(ground);
        
        // Tombstones
        for(let i=0; i<80; i++) {
            const h = 2 + Math.random()*3;
            const tomb = new THREE.Mesh(
                new THREE.BoxGeometry(2, h, 1),
                new THREE.MeshStandardMaterial({ color: 0x222222 })
            );
            tomb.position.set((Math.random()-0.5)*250, h/2, (Math.random()-0.5)*250);
            tomb.castShadow = true; tomb.receiveShadow = true;
            this.core.scene.add(tomb);
        }

        // Build 3D Humanoid Player
        this.player = new THREE.Group();
        this.player.position.y = 2;
        
        // Body
        this.playerBody = new THREE.Mesh(
            new THREE.BoxGeometry(2, 3, 2),
            new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0x442200 })
        );
        this.playerBody.castShadow = true;
        this.player.add(this.playerBody);
        
        // Head
        const head = new THREE.Mesh(
            new THREE.SphereGeometry(1, 16, 16),
            new THREE.MeshStandardMaterial({ color: 0xffccaa })
        );
        head.position.y = 2.5;
        this.player.add(head);
        
        this.player.userData = { 
            speed: 30, dashTimer: 0, hp: 100, maxHp: 100, 
            prana: 100, maxPrana: 100, attackTimer: 0, currentAvatar: 'Digit1'
        };
        this.core.scene.add(this.player);

        // Raycaster for mouse aiming
        this.raycaster = new THREE.Raycaster();
        this.mousePlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

        document.getElementById('start-btn').addEventListener('click', () => {
            document.getElementById('menu-screen').classList.add('hidden');
            document.getElementById('ui-layer').classList.remove('hidden');
            this.startLevel();
        });
        
        document.getElementById('restart-btn').addEventListener('click', () => {
            document.getElementById('game-over-screen').classList.add('hidden');
            this.startLevel(); // Retry same level
        });

        document.getElementById('next-level-btn').addEventListener('click', () => {
            document.getElementById('next-level-screen').classList.add('hidden');
            this.currentLevel++;
            if (this.currentLevel > this.levelData.length) {
                this.currentLevel = 1; // loop back or show ultimate win screen
            }
            this.startLevel();
        });

        this.loop();
    },
    
    startLevel() {
        this.gameState = 'playing';
        this.timeRemaining = this.maxTime;
        this.player.userData.hp = this.player.userData.maxHp;
        
        // Clean up old enemies
        this.enemies.forEach(e => this.core.scene.remove(e));
        this.enemies = [];
        
        // Update UI
        this.levelDisplay.innerText = "Level " + this.currentLevel;
        
        this.spawnWave();
    },
    
    spawnWave() {
        const data = this.levelData[this.currentLevel - 1];
        this.createDemon(data.demon, data.color, 0, -20, 15, data.hp, data.shape);
    },

    createDemon(name, color, x, z, speed, hp, shape) {
        const demon = new THREE.Group();
        demon.position.set(x, 2, z);
        
        let mesh;
        if(shape === 'ghost') {
            mesh = new THREE.Mesh(new THREE.ConeGeometry(1.5, 4, 16), new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 0.7 }));
            mesh.position.y = 1;
        } else if (shape === 'titan') {
            mesh = new THREE.Mesh(new THREE.BoxGeometry(4, 6, 4), new THREE.MeshStandardMaterial({ color }));
            mesh.position.y = 1;
        } else if (shape === 'blob') {
            mesh = new THREE.Mesh(new THREE.SphereGeometry(2.5, 16, 16), new THREE.MeshStandardMaterial({ color }));
        } else {
            mesh = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 3), new THREE.MeshStandardMaterial({ color }));
        }
        
        mesh.castShadow = true;
        demon.add(mesh);
        
        // Eyes (Keep glowing red eyes for gameplay clarity)
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const eye1 = new THREE.Mesh(new THREE.SphereGeometry(0.2), eyeMat);
        eye1.position.set(0.5, shape==='titan'?2:1, 1.5);
        const eye2 = new THREE.Mesh(new THREE.SphereGeometry(0.2), eyeMat);
        eye2.position.set(-0.5, shape==='titan'?2:1, 1.5);
        demon.add(eye1); demon.add(eye2);

        demon.userData = { name, speed, hp, maxHp: hp, shape, stateTimer: 0 };
        this.core.scene.add(demon);
        this.enemies.push(demon);
    },

    createParticle(pos, color, count=10) {
        for(let i=0; i<count; i++) {
            const mesh = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 0.5, 0.5),
                new THREE.MeshBasicMaterial({ color })
            );
            mesh.position.copy(pos);
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 10;
            const vy = Math.random() * 10;
            mesh.userData = { vx: Math.cos(angle)*speed, vy: vy, vz: Math.sin(angle)*speed, life: 1.0 };
            this.core.scene.add(mesh);
            this.particles.push(mesh);
        }
    },

    createDamageText(pos, amount, color=0xffffff) {
        // Simple 3D text using a sprite canvas
        const canvas = document.createElement('canvas');
        canvas.width = 128; canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(amount.toString(), 64, 48);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.strokeText(amount.toString(), 64, 48);
        
        const tex = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.position.copy(pos);
        sprite.position.y += 3;
        sprite.scale.set(4, 2, 1);
        sprite.userData = { life: 1.0, vy: 5 };
        this.core.scene.add(sprite);
        this.damageTexts.push(sprite);
    },

    loop() {
        requestAnimationFrame(() => this.loop());
        const dt = this.clock.getDelta();
        
        if (this.gameState === 'playing') {
            this.updatePlayer(dt);
            this.updateCombat(dt);
            this.updateEnemies(dt);
            this.updateParticles(dt);
            this.updateDamageTexts(dt);
            
            // Timer logic
            this.timeRemaining -= dt;
            this.timerDisplay.innerText = "Time: " + Math.ceil(this.timeRemaining) + "s";
            
            if (this.timeRemaining <= 0) {
                this.triggerGameOver();
            }
            
            // Screen Shake
            if (this.shakeTime > 0) {
                this.shakeTime -= dt;
                const rx = (Math.random() - 0.5) * this.shakeIntensity;
                const ry = (Math.random() - 0.5) * this.shakeIntensity;
                this.core.camera.position.x += rx;
                this.core.camera.position.y += ry;
            }
            
            // UI Update
            this.healthBar.style.width = Math.max(0, (this.player.userData.hp/100)*100) + '%';
            this.pranaBar.style.width = Math.max(0, (this.player.userData.prana/100)*100) + '%';
        }

        this.core.render();
    },
    
    updatePlayer(dt) {
        const u = this.player.userData;
        
        // Avatar Swapping
        Object.keys(this.avatars).forEach(key => {
            if(this.input.keys[key]) {
                const avatar = this.avatars[key];
                if(u.currentAvatar !== key) {
                    this.playerBody.material.color.setHex(avatar.color);
                    this.playerBody.material.emissive.setHex(avatar.color).multiplyScalar(0.3);
                    u.speed = avatar.speed;
                    u.currentAvatar = key;
                    this.createParticle(this.player.position, avatar.color, 20);
                }
            }
        });

        // Movement
        let dx = 0, dz = 0;
        if(this.input.keys['KeyW']) dz -= 1;
        if(this.input.keys['KeyS']) dz += 1;
        if(this.input.keys['KeyA']) dx -= 1;
        if(this.input.keys['KeyD']) dx += 1;
        
        let moveSpeed = u.speed;
        
        // Dash (Space)
        if(u.dashTimer > 0) u.dashTimer -= dt;
        if(this.input.keys['Space'] && u.dashTimer <= 0 && (dx!==0 || dz!==0)) {
            moveSpeed *= 5; // Fast burst
            u.dashTimer = 1.0; 
            this.createParticle(this.player.position, 0xffffff, 15);
        }

        if(dx !== 0 || dz !== 0) {
            const len = Math.sqrt(dx*dx + dz*dz);
            this.player.position.x += (dx/len) * moveSpeed * dt;
            this.player.position.z += (dz/len) * moveSpeed * dt;
        }

        // Aiming (Mouse Raycast)
        this.raycaster.setFromCamera(
            new THREE.Vector2((this.input.mouse.x / window.innerWidth) * 2 - 1, -(this.input.mouse.y / window.innerHeight) * 2 + 1),
            this.core.camera
        );
        const target = new THREE.Vector3();
        this.raycaster.ray.intersectPlane(this.mousePlane, target);
        this.player.lookAt(target.x, this.player.position.y, target.z);

        // Prana regen
        if(u.prana < u.maxPrana) u.prana += 10 * dt;
    },

    updateCombat(dt) {
        const u = this.player.userData;
        u.attackTimer -= dt;
        const avatar = this.avatars[u.currentAvatar];

        if (this.input.mouse.down && u.attackTimer <= 0 && u.prana >= 5) {
            u.prana -= 5;
            u.attackTimer = avatar.cd;
            
            // Aim direction
            const dir = new THREE.Vector3(0,0,1).applyQuaternion(this.player.quaternion).normalize();
            
            if (avatar.type === 'range') {
                const proj = new THREE.Mesh(new THREE.TorusGeometry(1, 0.2, 8, 16), new THREE.MeshBasicMaterial({color: avatar.color}));
                proj.position.copy(this.player.position);
                proj.position.y += 1;
                proj.rotation.x = Math.PI/2;
                proj.userData = { dir: dir, speed: 60, life: 2.0, dmg: 15, type: avatar.type };
                this.core.scene.add(proj);
                this.projectiles.push(proj);
            } else if (avatar.type === 'melee_heavy') {
                this.createParticle(this.player.position.clone().add(dir.clone().multiplyScalar(4)), avatar.color, 30);
                this.shakeTime = 0.3; this.shakeIntensity = 1.5; // Heavy screen shake
                this.checkMeleeHit(dir, 10, 40, avatar);
            } else if (avatar.type === 'melee_fast') {
                this.createParticle(this.player.position.clone().add(dir.clone().multiplyScalar(3)), avatar.color, 10);
                this.checkMeleeHit(dir, 6, 15, avatar);
            } else if (avatar.type === 'flamethrower') {
                // Fire cone
                const proj = new THREE.Mesh(new THREE.SphereGeometry(1), new THREE.MeshBasicMaterial({color: avatar.color}));
                proj.position.copy(this.player.position).add(dir.clone().multiplyScalar(2));
                proj.position.y += 1;
                proj.userData = { dir: dir.clone().add(new THREE.Vector3((Math.random()-0.5)*0.5, 0, (Math.random()-0.5)*0.5)), speed: 30, life: 0.5, dmg: 8, type: avatar.type };
                this.core.scene.add(proj);
                this.projectiles.push(proj);
            }
        }

        // Update Projectiles
        for(let i=this.projectiles.length-1; i>=0; i--) {
            const p = this.projectiles[i];
            p.position.addScaledVector(p.userData.dir, p.userData.speed * dt);
            if(p.userData.type === 'range') p.rotation.z += 10 * dt; // spin chakram
            p.userData.life -= dt;
            
            // Check Hit
            let hit = false;
            this.enemies.forEach(e => {
                if(p.position.distanceTo(e.position) < 3) {
                    this.damageEnemy(e, p.userData.dmg, p.position);
                    hit = true;
                }
            });

            if(p.userData.life <= 0 || hit) {
                this.core.scene.remove(p);
                this.projectiles.splice(i, 1);
            }
        }
    },

    checkMeleeHit(dir, range, dmg, avatar) {
        this.enemies.forEach(e => {
            const toEnemy = new THREE.Vector3().subVectors(e.position, this.player.position);
            if (toEnemy.length() < range && toEnemy.normalize().dot(dir) > 0.5) {
                this.damageEnemy(e, dmg, e.position);
            }
        });
    },

    damageEnemy(enemy, amount, pos) {
        enemy.userData.hp -= amount;
        this.createParticle(pos, 0xff0000, 10);
        this.createDamageText(pos, amount, 0xff3333);
        
        // Hit flash (make it white briefly)
        if(enemy.children[0].material) {
            const oldColor = enemy.children[0].material.color.getHex();
            enemy.children[0].material.color.setHex(0xffffff);
            setTimeout(() => { if(enemy.children[0]) enemy.children[0].material.color.setHex(oldColor); }, 100);
        }
        
        // Knockback
        const kbDir = new THREE.Vector3().subVectors(enemy.position, this.player.position).normalize();
        kbDir.y = 0;
        enemy.position.addScaledVector(kbDir, 2); // Push back 2 units

        if(enemy.userData.hp <= 0) {
            this.core.scene.remove(enemy);
            this.enemies = this.enemies.filter(e => e !== enemy);
            this.createParticle(pos, 0xffffff, 40);
            
            this.gameState = 'win';
            document.getElementById('next-level-screen').classList.remove('hidden');
        }
    },

    triggerGameOver() {
        this.gameState = 'gameover';
        document.getElementById('game-over-screen').classList.remove('hidden');
    },

    updateEnemies(dt) {
        this.enemies.forEach(enemy => {
            const u = enemy.userData;
            u.stateTimer += dt;
            
            const dir = new THREE.Vector3().subVectors(this.player.position, enemy.position);
            dir.y = 0;
            const dist = dir.length();
            
            let currentSpeed = u.speed;
            
            // Simple AI Logic
            if(u.name === 'Kalu Kumaraya') {
                if(u.stateTimer > 4) {
                    // Teleport behind player
                    const behind = new THREE.Vector3(0,0,-10).applyQuaternion(this.player.quaternion);
                    enemy.position.copy(this.player.position).add(behind);
                    u.stateTimer = 0;
                    this.createParticle(enemy.position, 0x330033, 20);
                }
            } else if (u.name === 'Mahasona') {
                if(u.stateTimer > 3) {
                    currentSpeed *= 3; // Charge
                    if(u.stateTimer > 4) u.stateTimer = 0;
                }
            }
            
            if (dist > 3) {
                dir.normalize();
                enemy.lookAt(this.player.position);
                enemy.position.addScaledVector(dir, currentSpeed * dt);
            } else {
                // Attack player
                if(!(this.player.userData.dashTimer > 0.5)) { 
                    this.player.userData.hp -= 10 * dt;
                    if(this.player.userData.hp <= 0) {
                        this.triggerGameOver();
                    }
                }
            }
        });
    },

    updateParticles(dt) {
        for(let i=this.particles.length-1; i>=0; i--) {
            const p = this.particles[i];
            p.position.x += p.userData.vx * dt;
            p.position.y += p.userData.vy * dt;
            p.position.z += p.userData.vz * dt;
            p.userData.vy -= 20 * dt; // gravity
            p.userData.life -= dt;
            if(p.position.y < 0) p.position.y = 0;
            
            p.scale.setScalar(p.userData.life);
            if(p.userData.life <= 0) {
                this.core.scene.remove(p);
                this.particles.splice(i, 1);
            }
        }
    },

    updateDamageTexts(dt) {
        for(let i=this.damageTexts.length-1; i>=0; i--) {
            const txt = this.damageTexts[i];
            txt.position.y += txt.userData.vy * dt;
            txt.userData.life -= dt;
            txt.material.opacity = txt.userData.life;
            if(txt.userData.life <= 0) {
                this.core.scene.remove(txt);
                txt.material.map.dispose();
                txt.material.dispose();
                this.damageTexts.splice(i, 1);
            }
        }
    }
};

Game.init();
