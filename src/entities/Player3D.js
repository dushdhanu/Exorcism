import * as THREE from 'three';

export class Player3D {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.position = this.group.position;
        this.rotation = this.group.rotation;

        // Player Stats
        this.hp = 100;
        this.maxHp = 100;
        this.prana = 100;
        this.maxPrana = 100;
        this.currentAvatar = 'Digit1'; // Default: Suriya Divya
        this.facingDir = new THREE.Vector3(0, 0, 1);
        this.dashTimer = 0;
        this.dashCooldown = 0.8;
        this.isDashing = false;
        this.attackTimer = 0;
        this.specialCooldown = 0;
        this.walkCycle = 0;
        this.isMoving = false;

        // Avatar specifications
        this.avatarData = {
            'Digit1': {
                id: 'sun',
                name: 'Suriya Divya',
                title: 'Solar Radiant Avatar',
                color: 0xffaa00,
                speed: 28,
                attackCd: 0.22,
                specialCd: 5.0,
                dmg: 16
            },
            'Digit2': {
                id: 'earth',
                name: 'Maha Gaja',
                title: 'Earth-Breaker Titan',
                color: 0xa87c4f,
                speed: 18,
                attackCd: 0.7,
                specialCd: 6.0,
                dmg: 45
            },
            'Digit3': {
                id: 'gale',
                name: 'Vayu Yodheya',
                title: 'Gale-Blade Hunter',
                color: 0x00f3ff,
                speed: 38,
                attackCd: 0.14,
                specialCd: 4.0,
                dmg: 11
            },
            'Digit4': {
                id: 'mystic',
                name: 'Shanthikarma Mystic',
                title: 'Ritual Exorcist',
                color: 0xdd44ff,
                speed: 24,
                attackCd: 0.1,
                specialCd: 7.0,
                dmg: 9
            }
        };

        this.buildHeroMesh();
        this.buildAvatarAttachments();
        this.setAvatar('Digit1');

        this.scene.add(this.group);
    }

    buildHeroMesh() {
        this.bodyGroup = new THREE.Group();

        // Materials
        this.skinMat = new THREE.MeshStandardMaterial({ color: 0x96613d, roughness: 0.7 });
        this.tunicMat = new THREE.MeshStandardMaterial({ color: 0x1d2228, roughness: 0.6 });
        this.goldMat = new THREE.MeshStandardMaterial({
            color: 0xffaa00,
            metalness: 0.85,
            roughness: 0.25,
            emissive: 0x553300
        });

        // Torso / Tunic
        this.torso = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.6, 0.8), this.tunicMat);
        this.torso.position.y = 1.8;
        this.torso.castShadow = true;
        this.bodyGroup.add(this.torso);

        // Head
        this.head = new THREE.Mesh(new THREE.SphereGeometry(0.48, 16, 16), this.skinMat);
        this.head.position.y = 3.0;
        this.head.castShadow = true;
        this.bodyGroup.add(this.head);

        // Headband / Cloth wrap
        this.headband = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.2, 16), this.goldMat);
        this.headband.position.y = 3.05;
        this.bodyGroup.add(this.headband);

        // Left Arm (Hosts the Yantra Bandhana wrist relic!)
        this.leftArm = new THREE.Group();
        this.leftArm.position.set(-0.8, 2.4, 0);
        const lArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.16, 1.2, 8), this.skinMat);
        lArmMesh.position.y = -0.5;
        lArmMesh.castShadow = true;
        this.leftArm.add(lArmMesh);

        // Yantra Bandhana Relic Dial (Wrist Gauntlet)
        this.relicDial = new THREE.Group();
        this.relicDial.position.y = -0.7;
        const gauntlet = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.4, 12), this.goldMat);
        this.relicDial.add(gauntlet);

        // Glowing Core Stone
        const coreGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.08, 8);
        this.relicCoreMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
        const coreStone = new THREE.Mesh(coreGeo, this.relicCoreMat);
        coreStone.rotation.z = Math.PI / 2;
        coreStone.position.x = -0.22;
        this.relicDial.add(coreStone);

        this.leftArm.add(this.relicDial);
        this.bodyGroup.add(this.leftArm);

        // Right Arm (Weapon Wielding)
        this.rightArm = new THREE.Group();
        this.rightArm.position.set(0.8, 2.4, 0);
        const rArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.16, 1.2, 8), this.skinMat);
        rArmMesh.position.y = -0.5;
        rArmMesh.castShadow = true;
        this.rightArm.add(rArmMesh);
        this.bodyGroup.add(this.rightArm);

        // Legs
        this.leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.18, 1.4, 8), this.tunicMat);
        this.leftLeg.position.set(-0.35, 0.7, 0);
        this.leftLeg.castShadow = true;
        this.bodyGroup.add(this.leftLeg);

        this.rightLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.18, 1.4, 8), this.tunicMat);
        this.rightLeg.position.set(0.35, 0.7, 0);
        this.rightLeg.castShadow = true;
        this.bodyGroup.add(this.rightLeg);

        this.group.add(this.bodyGroup);
    }

    buildAvatarAttachments() {
        // 1. Suriya Divya (Solar Chakrams)
        this.sunAttachments = new THREE.Group();
        const chakramGeo = new THREE.TorusGeometry(0.65, 0.08, 8, 24);
        const chakramMat = new THREE.MeshStandardMaterial({
            color: 0xffaa00,
            emissive: 0xff6600,
            emissiveIntensity: 0.8,
            metalness: 0.8,
            roughness: 0.2
        });
        this.sunChakram1 = new THREE.Mesh(chakramGeo, chakramMat);
        this.sunChakram1.position.set(0, -0.6, 0.4);
        this.rightArm.add(this.sunChakram1);

        this.sunChakram2 = new THREE.Mesh(chakramGeo, chakramMat);
        this.sunChakram2.position.set(0, -0.6, 0.4);
        this.leftArm.add(this.sunChakram2);

        // Solar crown
        const crownGeo = new THREE.ConeGeometry(0.08, 0.5, 6);
        for (let i = 0; i < 7; i++) {
            const ray = new THREE.Mesh(crownGeo, chakramMat);
            const a = (i / 7) * Math.PI - Math.PI / 2;
            ray.position.set(Math.cos(a) * 0.55, 3.5 + Math.sin(a) * 0.2, 0);
            ray.rotation.z = -a;
            this.sunAttachments.add(ray);
        }
        this.bodyGroup.add(this.sunAttachments);

        // 2. Maha Gaja (Earth Titan Granite Club & Stone Pauldrons)
        this.earthAttachments = new THREE.Group();
        const rockMat = new THREE.MeshStandardMaterial({
            color: 0x5a504a,
            roughness: 0.95,
            metalness: 0.1
        });
        
        // Colossal Spiked Granite Club
        this.earthClub = new THREE.Group();
        const clubHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.8, 8), this.tunicMat);
        clubHandle.position.y = 0.5;
        this.earthClub.add(clubHandle);

        const clubHead = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.8, 0.9), rockMat);
        clubHead.position.y = 1.8;
        clubHead.castShadow = true;
        this.earthClub.add(clubHead);

        // Chain wrap on club
        const chainMat = new THREE.MeshStandardMaterial({ color: 0xffcc44, metalness: 0.9, roughness: 0.3 });
        const chainRing = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.06, 6, 16), chainMat);
        chainRing.position.y = 1.6;
        chainRing.rotation.x = Math.PI / 2;
        this.earthClub.add(chainRing);

        this.earthClub.position.set(0, -0.6, 0.3);
        this.earthClub.rotation.x = Math.PI / 4;
        this.rightArm.add(this.earthClub);

        // Stone Pauldrons
        const pauldronL = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45), rockMat);
        pauldronL.position.set(-0.85, 2.5, 0);
        this.earthAttachments.add(pauldronL);

        const pauldronR = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45), rockMat);
        pauldronR.position.set(0.85, 2.5, 0);
        this.earthAttachments.add(pauldronR);
        this.bodyGroup.add(this.earthAttachments);

        // 3. Vayu Yodheya (Twin Curved Kastane Swords)
        this.galeAttachments = new THREE.Group();
        const bladeMat = new THREE.MeshStandardMaterial({
            color: 0x00f3ff,
            emissive: 0x00aacc,
            emissiveIntensity: 0.6,
            metalness: 0.95,
            roughness: 0.1
        });

        // Twin curved swords
        this.galeSwordR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.8, 0.25), bladeMat);
        this.galeSwordR.position.set(0, -0.7, 0.4);
        this.galeSwordR.rotation.x = Math.PI / 3;
        this.rightArm.add(this.galeSwordR);

        this.galeSwordL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.8, 0.25), bladeMat);
        this.galeSwordL.position.set(0, -0.7, 0.4);
        this.galeSwordL.rotation.x = Math.PI / 3;
        this.leftArm.add(this.galeSwordL);

        // 4. Shanthikarma Mystic (Flame Torch Pandama & Atavisi Cane)
        this.mysticAttachments = new THREE.Group();
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x3d2516, roughness: 0.8 });
        
        // Pandama (Fire Torch in Right Hand)
        this.mysticTorch = new THREE.Group();
        const torchHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.2, 8), woodMat);
        this.mysticTorch.add(torchHandle);
        const torchBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.15, 0.35, 8), woodMat);
        torchBowl.position.y = 1.0;
        this.mysticTorch.add(torchBowl);
        const torchFlame = new THREE.Mesh(
            new THREE.SphereGeometry(0.25, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xff3300 })
        );
        torchFlame.position.y = 1.25;
        this.mysticTorch.add(torchFlame);
        this.mysticTorch.position.set(0, -0.4, 0.4);
        this.rightArm.add(this.mysticTorch);

        // Atavisi Cane (in Left Hand)
        this.mysticCane = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 8), woodMat);
        this.mysticCane.position.set(0, -0.4, 0.3);
        this.leftArm.add(this.mysticCane);
    }

    setAvatar(key) {
        if (!this.avatarData[key]) return;
        this.currentAvatar = key;
        const data = this.avatarData[key];

        // Update Relic Dial glow color
        this.relicCoreMat.color.setHex(data.color);

        // Toggle attachment visibility
        this.sunAttachments.visible = (key === 'Digit1');
        this.sunChakram1.visible = (key === 'Digit1');
        this.sunChakram2.visible = (key === 'Digit1');

        this.earthAttachments.visible = (key === 'Digit2');
        this.earthClub.visible = (key === 'Digit2');

        this.galeSwordR.visible = (key === 'Digit3');
        this.galeSwordL.visible = (key === 'Digit3');

        this.mysticTorch.visible = (key === 'Digit4');
        this.mysticCane.visible = (key === 'Digit4');

        // Tint tunic trim slightly based on avatar
        this.headband.material.color.setHex(data.color);
    }

    update(dt, input, environment) {
        const data = this.avatarData[this.currentAvatar];

        // Avatar switching via 1-4 keys
        ['Digit1', 'Digit2', 'Digit3', 'Digit4'].forEach(k => {
            if (input.keys[k] && this.currentAvatar !== k) {
                this.setAvatar(k);
                return;
            }
        });

        // Movement input (WASD)
        let moveX = 0;
        let moveZ = 0;
        if (input.keys['KeyW']) moveZ -= 1;
        if (input.keys['KeyS']) moveZ += 1;
        if (input.keys['KeyA']) moveX -= 1;
        if (input.keys['KeyD']) moveX += 1;

        let currentSpeed = data.speed;

        // Dash handling
        if (this.dashTimer > 0) this.dashTimer -= dt;
        if (this.specialCooldown > 0) this.specialCooldown -= dt;
        if (this.attackTimer > 0) this.attackTimer -= dt;

        if (input.keys['Space'] && this.dashTimer <= 0 && (moveX !== 0 || moveZ !== 0) && this.prana >= 10) {
            this.isDashing = true;
            this.dashTimer = this.dashCooldown;
            this.prana = Math.max(0, this.prana - 10);
            currentSpeed *= 3.8;
        } else if (this.isDashing && this.dashTimer < this.dashCooldown - 0.22) {
            this.isDashing = false;
        }

        // Apply movement vector
        if (moveX !== 0 || moveZ !== 0) {
            this.isMoving = true;
            const len = Math.hypot(moveX, moveZ);
            const normX = moveX / len;
            const normZ = moveZ / len;

            const targetX = this.position.x + normX * currentSpeed * dt;
            const targetZ = this.position.z + normZ * currentSpeed * dt;

            // Check obstacle collision
            if (!environment.checkCollision(targetX, this.position.z, 0.9)) {
                this.position.x = targetX;
            }
            if (!environment.checkCollision(this.position.x, targetZ, 0.9)) {
                this.position.z = targetZ;
            }

            this.facingDir.set(normX, 0, normZ);
        } else {
            this.isMoving = false;
        }

        // Rotate hero smoothly toward mouse aim or movement direction
        if (input.mouse.worldPoint) {
            const dx = input.mouse.worldPoint.x - this.position.x;
            const dz = input.mouse.worldPoint.z - this.position.z;
            if (Math.hypot(dx, dz) > 0.5) {
                const targetAngle = Math.atan2(dx, dz);
                // Slerp or lerp rotation around Y
                let diff = targetAngle - this.group.rotation.y;
                while (diff < -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;
                this.group.rotation.y += diff * 0.2;
            }
        }

        // Procedural walk/run animation
        if (this.isMoving) {
            this.walkCycle += dt * (currentSpeed / 4);
            const legSwing = Math.sin(this.walkCycle * 6) * 0.6;
            this.leftLeg.rotation.x = legSwing;
            this.rightLeg.rotation.x = -legSwing;
            
            // Arm counter swing
            this.leftArm.rotation.x = -legSwing * 0.4;
            this.rightArm.rotation.x = legSwing * 0.4;
            
            // Subtle body bounce
            this.bodyGroup.position.y = Math.abs(Math.sin(this.walkCycle * 6)) * 0.15;
        } else {
            // Idle breathing
            const idleTime = performance.now() * 0.003;
            this.leftLeg.rotation.x = 0;
            this.rightLeg.rotation.x = 0;
            this.leftArm.rotation.x = Math.sin(idleTime) * 0.08;
            this.rightArm.rotation.x = -Math.sin(idleTime) * 0.08;
            this.bodyGroup.position.y = Math.sin(idleTime * 2) * 0.04;
        }

        // Rotate Chakrams idle spin
        if (this.sunChakram1.visible) {
            this.sunChakram1.rotation.z += 12 * dt;
            this.sunChakram2.rotation.z += 12 * dt;
        }

        // Prana natural regeneration
        if (this.prana < this.maxPrana) {
            this.prana = Math.min(this.maxPrana, this.prana + 12 * dt);
        }
    }

    triggerAttackAnimation() {
        // Swing right arm forward
        this.rightArm.rotation.x = -Math.PI / 2.2;
    }

    damage(amount) {
        this.hp = Math.max(0, this.hp - amount);
        return this.hp <= 0;
    }
}
