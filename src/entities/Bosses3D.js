import * as THREE from 'three';

export class Boss3D {
    constructor(scene, demonType, levelNumber) {
        this.scene = scene;
        this.type = demonType; // 'Mohini', 'Mahasona', 'Kalu Kumaraya', 'Giri Yaka'
        this.level = levelNumber;
        this.group = new THREE.Group();
        this.position = this.group.position;
        this.rotation = this.group.rotation;

        this.hp = 120 + levelNumber * 100;
        this.maxHp = this.hp;
        this.speed = 12;
        this.stateTimer = 0;
        this.attackCooldown = 0;
        this.isStunned = 0;
        this.telegraphType = null; // 'red', 'blue', 'purple'
        this.telegraphMesh = null;
        this.floatingHeight = 0;

        this.buildBossModel();
        this.buildTelegraphIndicator();

        this.scene.add(this.group);
    }

    buildTelegraphIndicator() {
        // Glint telegraph indicator sphere above boss head
        const geo = new THREE.SphereGeometry(0.5, 12, 12);
        this.telegraphMat = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0
        });
        this.telegraphGlint = new THREE.Mesh(geo, this.telegraphMat);
        this.telegraphGlint.position.y = 5.5;
        this.group.add(this.telegraphGlint);

        // Ground warning ring
        const ringGeo = new THREE.RingGeometry(0.2, 5.0, 32);
        this.groundRingMat = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide
        });
        this.groundRing = new THREE.Mesh(ringGeo, this.groundRingMat);
        this.groundRing.rotation.x = -Math.PI / 2;
        this.groundRing.position.y = 0.05;
        this.group.add(this.groundRing);
    }

    buildBossModel() {
        if (this.type === 'Mohini') {
            this.buildMohini();
        } else if (this.type === 'Mahasona') {
            this.buildMahasona();
        } else if (this.type === 'Kalu Kumaraya') {
            this.buildKaluKumaraya();
        } else {
            this.buildGiriYaka();
        }
    }

    buildMohini() {
        // The Ethereal Siren - Levitating ghostly figure in white flowing robes
        this.speed = 16;
        this.floatingHeight = 1.6;
        this.position.y = this.floatingHeight;

        const ghostMat = new THREE.MeshStandardMaterial({
            color: 0xeef5ff,
            emissive: 0x88bbff,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.88,
            roughness: 0.3
        });

        const veilMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.45,
            side: THREE.DoubleSide
        });

        // Slender Torso
        this.torso = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 2.0, 12), ghostMat);
        this.torso.position.y = 2.2;
        this.group.add(this.torso);

        // Ghostly flowing dress/skirt
        this.skirt = new THREE.Mesh(new THREE.ConeGeometry(1.6, 3.2, 16, 1, true), ghostMat);
        this.skirt.position.y = 0.8;
        this.group.add(this.skirt);

        // Veil wings / trails
        const veil1 = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 3.0), veilMat);
        veil1.position.set(-0.9, 1.8, -0.4);
        veil1.rotation.y = 0.3;
        this.group.add(veil1);

        const veil2 = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 3.0), veilMat);
        veil2.position.set(0.9, 1.8, -0.4);
        veil2.rotation.y = -0.3;
        this.group.add(veil2);

        // Spectral Head
        this.head = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 16), ghostMat);
        this.head.position.y = 3.5;
        this.group.add(this.head);

        // Weeping Hollow Eyes
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x001122 });
        const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.08), eyeMat);
        eyeL.position.set(-0.16, 3.55, 0.4);
        const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.08), eyeMat);
        eyeR.position.set(0.16, 3.55, 0.4);
        this.group.add(eyeL); this.group.add(eyeR);

        // Decoy Baby Bundle in arms (Sri Lankan folklore siren trap)
        this.babyBundle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.28, 0.8, 8),
            new THREE.MeshStandardMaterial({ color: 0xdddddd })
        );
        this.babyBundle.rotation.z = Math.PI / 4;
        this.babyBundle.position.set(0.2, 2.2, 0.6);
        this.group.add(this.babyBundle);
    }

    buildMahasona() {
        // The Cemetery Giant - Colossal hulking demon with bear-like Raksha mask
        this.speed = 11;
        const fleshMat = new THREE.MeshStandardMaterial({
            color: 0x1f191b,
            roughness: 0.85,
            metalness: 0.1
        });
        const redPaintMat = new THREE.MeshStandardMaterial({
            color: 0xb51c1c,
            roughness: 0.6
        });

        // Massive muscular Torso
        this.torso = new THREE.Mesh(new THREE.BoxGeometry(3.0, 3.2, 2.2), fleshMat);
        this.torso.position.y = 3.6;
        this.torso.castShadow = true;
        this.group.add(this.torso);

        // Huge demonic Raksha Head
        this.head = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.8, 1.8), redPaintMat);
        this.head.position.y = 5.8;
        this.head.castShadow = true;
        this.group.add(this.head);

        // Fangs / Tusks
        const tuskMat = new THREE.MeshStandardMaterial({ color: 0xf5f0d0 });
        const tuskL = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.9, 8), tuskMat);
        tuskL.position.set(-0.6, 5.2, 0.9);
        tuskL.rotation.x = Math.PI / 3;
        const tuskR = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.9, 8), tuskMat);
        tuskR.position.set(0.6, 5.2, 0.9);
        tuskR.rotation.x = Math.PI / 3;
        this.group.add(tuskL); this.group.add(tuskR);

        // Curved Horns
        const hornL = new THREE.Mesh(new THREE.ConeGeometry(0.25, 1.4, 8), fleshMat);
        hornL.position.set(-1.1, 6.8, 0);
        hornL.rotation.z = 0.5;
        const hornR = new THREE.Mesh(new THREE.ConeGeometry(0.25, 1.4, 8), fleshMat);
        hornR.position.set(1.1, 6.8, 0);
        hornR.rotation.z = -0.5;
        this.group.add(hornL); this.group.add(hornR);

        // Glowing Crimson Eyes
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const eye1 = new THREE.Mesh(new THREE.SphereGeometry(0.2), eyeMat);
        eye1.position.set(-0.45, 5.9, 0.95);
        const eye2 = new THREE.Mesh(new THREE.SphereGeometry(0.2), eyeMat);
        eye2.position.set(0.45, 5.9, 0.95);
        this.group.add(eye1); this.group.add(eye2);

        // Colossal Spiked Tree Trunk Club
        this.weapon = new THREE.Group();
        const trunkMesh = new THREE.Mesh(
            new THREE.CylinderGeometry(0.4, 0.55, 6.5, 8),
            new THREE.MeshStandardMaterial({ color: 0x332211, roughness: 0.9 })
        );
        trunkMesh.position.y = 1.5;
        trunkMesh.castShadow = true;
        this.weapon.add(trunkMesh);

        // Spikes on club
        for (let s = 0; s < 8; s++) {
            const spike = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.6, 6), tuskMat);
            const a = (s / 8) * Math.PI * 2;
            spike.position.set(Math.cos(a) * 0.6, 2.5 + (s % 3) * 0.8, Math.sin(a) * 0.6);
            spike.rotation.z = Math.PI / 2;
            this.weapon.add(spike);
        }

        this.weapon.position.set(2.2, 2.5, 0.8);
        this.weapon.rotation.x = Math.PI / 6;
        this.group.add(this.weapon);

        // Sturdy Legs
        this.legL = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.2, 1.0), fleshMat);
        this.legL.position.set(-0.9, 1.1, 0);
        this.legL.castShadow = true;
        this.group.add(this.legL);

        this.legR = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.2, 1.0), fleshMat);
        this.legR.position.set(0.9, 1.1, 0);
        this.legR.castShadow = true;
        this.group.add(this.legR);
    }

    buildKaluKumaraya() {
        // The Shadow Prince - Royal dark demon draped in violet velvet & gold ornaments
        this.speed = 22;
        const shadowMat = new THREE.MeshStandardMaterial({
            color: 0x1a0a2a,
            roughness: 0.5,
            metalness: 0.4
        });
        const goldMat = new THREE.MeshStandardMaterial({
            color: 0xffcc00,
            metalness: 0.9,
            roughness: 0.2
        });

        // Slender athletic torso
        this.torso = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.0, 1.0), shadowMat);
        this.torso.position.y = 2.4;
        this.torso.castShadow = true;
        this.group.add(this.torso);

        // Ornate royal headdress / crown
        this.crown = new THREE.Mesh(new THREE.ConeGeometry(0.65, 1.2, 6), goldMat);
        this.crown.position.y = 4.4;
        this.group.add(this.crown);

        // Head
        this.head = new THREE.Mesh(new THREE.SphereGeometry(0.48, 16, 16), shadowMat);
        this.head.position.y = 3.6;
        this.group.add(this.head);

        // Glowing violet eyes
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xcc00ff });
        const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.1), eyeMat);
        eyeL.position.set(-0.2, 3.65, 0.45);
        const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.1), eyeMat);
        eyeR.position.set(0.2, 3.65, 0.45);
        this.group.add(eyeL); this.group.add(eyeR);

        // Dark Cape
        const capeMat = new THREE.MeshStandardMaterial({
            color: 0x330044,
            roughness: 0.8,
            side: THREE.DoubleSide
        });
        this.cape = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 2.8), capeMat);
        this.cape.position.set(0, 2.0, -0.6);
        this.cape.rotation.x = 0.2;
        this.group.add(this.cape);

        // Twin Obsidian Stilettos
        const stilettoMat = new THREE.MeshStandardMaterial({
            color: 0x220033,
            metalness: 0.9,
            emissive: 0x9900ee,
            emissiveIntensity: 0.6
        });
        this.blade1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.6, 0.2), stilettoMat);
        this.blade1.position.set(-1.1, 1.8, 0.5);
        this.blade1.rotation.x = Math.PI / 4;
        this.group.add(this.blade1);

        this.blade2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.6, 0.2), stilettoMat);
        this.blade2.position.set(1.1, 1.8, 0.5);
        this.blade2.rotation.x = Math.PI / 4;
        this.group.add(this.blade2);
    }

    buildGiriYaka() {
        // The Affliction Demon - Bloated green diseased belly with terrifying Raksha mask
        this.speed = 14;
        const fleshMat = new THREE.MeshStandardMaterial({
            color: 0x245524,
            roughness: 0.7
        });
        const toxicMat = new THREE.MeshBasicMaterial({ color: 0x44ff44 });

        // Bloated belly (Spherical gut)
        this.belly = new THREE.Mesh(new THREE.SphereGeometry(1.8, 16, 16), fleshMat);
        this.belly.position.set(0, 2.2, 0.3);
        this.belly.scale.set(1.2, 1.0, 1.3);
        this.belly.castShadow = true;
        this.group.add(this.belly);

        // Pulsating toxic pustules
        for (let p = 0; p < 6; p++) {
            const boil = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), toxicMat);
            const a = (p / 6) * Math.PI * 2;
            boil.position.set(Math.cos(a) * 1.5, 2.2 + Math.sin(a) * 0.6, 1.0);
            this.group.add(boil);
        }

        // Broad snarling demon head
        this.head = new THREE.Mesh(
            new THREE.BoxGeometry(1.9, 1.4, 1.5),
            new THREE.MeshStandardMaterial({ color: 0x1b401b })
        );
        this.head.position.y = 3.8;
        this.head.castShadow = true;
        this.group.add(this.head);

        // Bulging toxic emerald eyes
        const eye1 = new THREE.Mesh(new THREE.SphereGeometry(0.3), toxicMat);
        eye1.position.set(-0.55, 3.9, 0.85);
        const eye2 = new THREE.Mesh(new THREE.SphereGeometry(0.3), toxicMat);
        eye2.position.set(0.55, 3.9, 0.85);
        this.group.add(eye1); this.group.add(eye2);

        // Open fanged jaw for spitting bile
        const mouth = new THREE.Mesh(
            new THREE.BoxGeometry(1.2, 0.4, 0.6),
            new THREE.MeshBasicMaterial({ color: 0x002200 })
        );
        mouth.position.set(0, 3.4, 0.85);
        this.group.add(mouth);
    }

    setTelegraph(type, duration) {
        this.telegraphType = type;
        this.telegraphDuration = duration;
        this.telegraphTimer = duration;

        if (type === 'red') {
            this.telegraphMat.color.setHex(0xff1111);
            this.groundRingMat.color.setHex(0xff1111);
        } else if (type === 'blue') {
            this.telegraphMat.color.setHex(0x00ccff);
            this.groundRingMat.color.setHex(0x00ccff);
        } else if (type === 'purple') {
            this.telegraphMat.color.setHex(0xaa00ff);
            this.groundRingMat.color.setHex(0xaa00ff);
        }
    }

    update(dt, playerPos, audio) {
        if (this.isStunned > 0) {
            this.isStunned -= dt;
            return;
        }

        this.stateTimer += dt;
        const time = performance.now() * 0.003;

        // Facing player
        const dx = playerPos.x - this.position.x;
        const dz = playerPos.z - this.position.z;
        const dist = Math.hypot(dx, dz);
        
        if (dist > 0.5) {
            const targetAngle = Math.atan2(dx, dz);
            this.group.rotation.y = targetAngle;
        }

        // Update telegraph animation
        if (this.telegraphTimer > 0) {
            this.telegraphTimer -= dt;
            const progress = 1 - (this.telegraphTimer / this.telegraphDuration);
            this.telegraphMat.opacity = Math.sin(progress * Math.PI) * 0.9;
            this.groundRingMat.opacity = Math.sin(progress * Math.PI) * 0.65;
            this.groundRing.scale.setScalar(0.5 + progress * 0.5);
            if (this.telegraphTimer <= 0) {
                this.telegraphType = null;
                this.telegraphMat.opacity = 0;
                this.groundRingMat.opacity = 0;
            }
        }

        // Unique behavior and movement per demon type
        if (this.type === 'Mohini') {
            // Levitating hover bob
            this.position.y = this.floatingHeight + Math.sin(time * 3) * 0.4;
            this.skirt.rotation.y += 0.02;

            if (dist > 7) {
                // Drift toward player
                this.position.x += (dx / dist) * this.speed * dt;
                this.position.z += (dz / dist) * this.speed * dt;
            } else if (dist < 4) {
                // Back away slightly
                this.position.x -= (dx / dist) * this.speed * 0.6 * dt;
                this.position.z -= (dz / dist) * this.speed * 0.6 * dt;
            }
        } else if (this.type === 'Mahasona') {
            // Heavy stomping walk
            const stomp = Math.sin(time * 5);
            this.legL.position.y = 1.1 + Math.max(0, stomp) * 0.4;
            this.legR.position.y = 1.1 + Math.max(0, -stomp) * 0.4;
            this.torso.position.y = 3.6 + Math.abs(stomp) * 0.2;

            if (dist > 4.5) {
                this.position.x += (dx / dist) * this.speed * dt;
                this.position.z += (dz / dist) * this.speed * dt;
            }
        } else if (this.type === 'Kalu Kumaraya') {
            // Fast shadow stride with billowing cape
            this.cape.rotation.x = 0.3 + Math.sin(time * 8) * 0.2;
            if (dist > 3.5) {
                this.position.x += (dx / dist) * this.speed * dt;
                this.position.z += (dz / dist) * this.speed * dt;
            }
        } else if (this.type === 'Giri Yaka') {
            // Waddling grotesque march
            this.belly.position.y = 2.2 + Math.abs(Math.sin(time * 4)) * 0.3;
            if (dist > 6.0) {
                this.position.x += (dx / dist) * this.speed * dt;
                this.position.z += (dz / dist) * this.speed * dt;
            }
        }
    }

    damage(amount, attackForm) {
        let multiplier = 1.0;
        let isCrit = false;

        // Sri Lankan Folklore Avatar counters
        if (this.type === 'Mohini' && attackForm === 'sun') {
            multiplier = 2.5; isCrit = true; // Solar radiance disperses phantom sirens
        } else if (this.type === 'Mahasona' && attackForm === 'earth') {
            multiplier = 2.2; isCrit = true; // Heavy granite club cracks giant armor
        } else if (this.type === 'Kalu Kumaraya' && attackForm === 'gale') {
            multiplier = 2.5; isCrit = true; // Gale blades cut through shadow prince speed
        } else if (this.type === 'Giri Yaka' && attackForm === 'mystic') {
            multiplier = 2.8; isCrit = true; // Sacred exorcism flame purges afflicted pestilence
        }

        const totalDmg = Math.floor(amount * multiplier);
        this.hp = Math.max(0, this.hp - totalDmg);

        // Hit flash
        this.group.traverse(child => {
            if (child.isMesh && child.material && !child.userData.originalColor) {
                child.userData.originalColor = child.material.color.getHex();
                child.material.color.setHex(0xffffff);
                setTimeout(() => {
                    if (child.material) child.material.color.setHex(child.userData.originalColor);
                }, 90);
            }
        });

        return { hp: this.hp, dmg: totalDmg, isCrit };
    }
}
