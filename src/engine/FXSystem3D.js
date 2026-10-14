import * as THREE from 'three';

export class FXSystem3D {
    constructor(scene) {
        this.scene = scene;
        this.projectiles = [];
        this.particles = [];
        this.damageTexts = [];
        this.aoeZones = [];
        this.flameParticles = [];
    }

    spawnChakram(pos, dir, dmg) {
        const group = new THREE.Group();
        group.position.copy(pos);
        group.position.y += 1.2;

        const chakramGeo = new THREE.TorusGeometry(0.85, 0.12, 8, 24);
        const chakramMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
        const mesh = new THREE.Mesh(chakramGeo, chakramMat);
        mesh.rotation.x = Math.PI / 2;
        group.add(mesh);

        // Core glow
        const glow = new THREE.Mesh(
            new THREE.SphereGeometry(0.4, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        group.add(glow);

        const light = new THREE.PointLight(0xff8800, 2.0, 12);
        group.add(light);

        group.userData = {
            dir: dir.clone().normalize(),
            speed: 55,
            life: 2.2,
            dmg: dmg,
            type: 'sun'
        };

        this.scene.add(group);
        this.projectiles.push(group);
    }

    spawnWindSlash(pos, dir, dmg) {
        const group = new THREE.Group();
        group.position.copy(pos);
        group.position.y += 1.4;

        // Curved crescent blade arc
        const curveGeo = new THREE.TorusGeometry(1.6, 0.08, 6, 16, Math.PI / 1.5);
        const curveMat = new THREE.MeshBasicMaterial({
            color: 0x00f3ff,
            transparent: true,
            opacity: 0.95
        });
        const arc = new THREE.Mesh(curveGeo, curveMat);
        arc.rotation.x = Math.PI / 2;
        arc.rotation.z = Math.atan2(dir.x, dir.z);
        group.add(arc);

        group.userData = {
            dir: dir.clone().normalize(),
            speed: 65,
            life: 0.6,
            dmg: dmg,
            type: 'gale'
        };

        this.scene.add(group);
        this.projectiles.push(group);
    }

    spawnFlameJet(pos, dir, dmg) {
        // Emit a cluster of rising fiery ember particles in a cone
        for (let i = 0; i < 4; i++) {
            const spread = 0.35;
            const pDir = dir.clone().add(new THREE.Vector3(
                (Math.random() - 0.5) * spread,
                (Math.random() - 0.2) * 0.2,
                (Math.random() - 0.5) * spread
            )).normalize();

            const pGeo = new THREE.SphereGeometry(0.3 + Math.random() * 0.25, 6, 6);
            const pColor = Math.random() > 0.3 ? 0xff4400 : 0xffbb00;
            const pMat = new THREE.MeshBasicMaterial({
                color: pColor,
                transparent: true,
                opacity: 0.9
            });
            const pMesh = new THREE.Mesh(pGeo, pMat);
            pMesh.position.copy(pos).add(dir.clone().multiplyScalar(1.2));
            pMesh.position.y += 1.2;

            pMesh.userData = {
                dir: pDir,
                speed: 25 + Math.random() * 10,
                life: 0.45,
                maxLife: 0.45,
                dmg: dmg,
                type: 'mystic'
            };

            this.scene.add(pMesh);
            this.flameParticles.push(pMesh);
        }
    }

    spawnSolarFlareAOE(pos) {
        // Blinding solar sphere expansion
        const sphereGeo = new THREE.SphereGeometry(1, 16, 16);
        const sphereMat = new THREE.MeshBasicMaterial({
            color: 0xffdd44,
            transparent: true,
            opacity: 0.9
        });
        const sphere = new THREE.Mesh(sphereGeo, sphereMat);
        sphere.position.copy(pos);
        sphere.position.y += 1.5;

        sphere.userData = {
            radius: 1,
            maxRadius: 18,
            life: 0.7,
            maxLife: 0.7,
            dmg: 50
        };

        this.scene.add(sphere);
        this.aoeZones.push(sphere);
    }

    spawnQuakeFissure(pos, dir) {
        // Spawns 4 rising granite spikes in a line
        for (let i = 1; i <= 4; i++) {
            setTimeout(() => {
                const spikePos = pos.clone().add(dir.clone().multiplyScalar(i * 3.5));
                const spikeGeo = new THREE.ConeGeometry(0.8, 3.5, 6);
                const spikeMat = new THREE.MeshStandardMaterial({
                    color: 0x443a32,
                    roughness: 0.9
                });
                const spike = new THREE.Mesh(spikeGeo, spikeMat);
                spike.position.set(spikePos.x, -1, spikePos.z);
                spike.castShadow = true;

                spike.userData = {
                    targetY: 1.5,
                    life: 2.0,
                    dmg: 45
                };

                this.scene.add(spike);
                this.aoeZones.push(spike);
                this.spawnSparks(spikePos, 0xa87c4f, 15);
            }, i * 70);
        }
    }

    spawnKovilMandala(pos) {
        // Glowing ritual protection mandala on ground
        const group = new THREE.Group();
        group.position.set(pos.x, 0.06, pos.z);

        const circleGeo = new THREE.RingGeometry(0.2, 7.5, 32);
        const circleMat = new THREE.MeshBasicMaterial({
            color: 0xff3300,
            transparent: true,
            opacity: 0.75,
            side: THREE.DoubleSide
        });
        const circle = new THREE.Mesh(circleGeo, circleMat);
        circle.rotation.x = -Math.PI / 2;
        group.add(circle);

        const innerRing = new THREE.Mesh(
            new THREE.RingGeometry(4.5, 5.0, 32),
            new THREE.MeshBasicMaterial({ color: 0xffdd44, transparent: true, opacity: 0.85, side: THREE.DoubleSide })
        );
        innerRing.rotation.x = -Math.PI / 2;
        group.add(innerRing);

        const light = new THREE.PointLight(0xff4400, 3.0, 16);
        light.position.y = 1.0;
        group.add(light);

        group.userData = {
            life: 8.0,
            maxLife: 8.0,
            radius: 7.5,
            healTimer: 0,
            burnTimer: 0
        };

        this.scene.add(group);
        this.aoeZones.push(group);
    }

    spawnPoisonPool(pos) {
        // Lingering emerald toxic sludge pool dropped by Giri Yaka
        const group = new THREE.Group();
        group.position.set(pos.x, 0.05, pos.z);

        const poolGeo = new THREE.CircleGeometry(4.0, 24);
        const poolMat = new THREE.MeshBasicMaterial({
            color: 0x11aa22,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        const pool = new THREE.Mesh(poolGeo, poolMat);
        pool.rotation.x = -Math.PI / 2;
        group.add(pool);

        // Bubbling green light
        const light = new THREE.PointLight(0x00ff33, 1.8, 8);
        light.position.y = 0.5;
        group.add(light);

        group.userData = {
            type: 'poison_pool',
            life: 9.0,
            radius: 4.0,
            dmg: 12
        };

        this.scene.add(group);
        this.aoeZones.push(group);
    }

    spawnSpectralHound(pos, dir) {
        // Mahasona Phase 2: Ferocious Black Spectral Hound stampede
        const group = new THREE.Group();
        group.position.copy(pos);
        group.position.y = 1.0;

        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x050508,
            emissive: 0x440011,
            roughness: 0.6
        });
        const houndBody = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.2, 2.6), bodyMat);
        group.add(houndBody);

        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const eye1 = new THREE.Mesh(new THREE.SphereGeometry(0.14), eyeMat);
        eye1.position.set(-0.35, 0.4, 1.3);
        const eye2 = new THREE.Mesh(new THREE.SphereGeometry(0.14), eyeMat);
        eye2.position.set(0.35, 0.4, 1.3);
        group.add(eye1); group.add(eye2);

        group.lookAt(pos.clone().add(dir));

        group.userData = {
            type: 'spectral_hound',
            dir: dir.clone().normalize(),
            speed: 36,
            life: 3.0,
            dmg: 28
        };

        this.scene.add(group);
        this.projectiles.push(group);
    }

    spawnSparks(pos, colorHex, count = 15) {
        for (let i = 0; i < count; i++) {
            const size = 0.15 + Math.random() * 0.2;
            const geo = new THREE.BoxGeometry(size, size, size);
            const mat = new THREE.MeshBasicMaterial({ color: colorHex });
            const p = new THREE.Mesh(geo, mat);
            p.position.copy(pos);

            const angle = Math.random() * Math.PI * 2;
            const speed = 4 + Math.random() * 12;
            p.userData = {
                vx: Math.cos(angle) * speed,
                vy: 3 + Math.random() * 9,
                vz: Math.sin(angle) * speed,
                life: 0.6 + Math.random() * 0.4,
                maxLife: 1.0
            };

            this.scene.add(p);
            this.particles.push(p);
        }
    }

    spawnDamageText(pos, amount, isCrit = false) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        ctx.font = isCrit ? '900 64px Cinzel, Inter, sans-serif' : 'bold 50px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 6;
        const text = isCrit ? `CRIT ${amount}!` : `${amount}`;
        ctx.strokeText(text, 128, 64);

        ctx.fillStyle = isCrit ? '#ffcc00' : '#ffffff';
        ctx.fillText(text, 128, 64);

        const tex = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.position.copy(pos);
        sprite.position.y += 3.2;
        sprite.scale.set(isCrit ? 4.8 : 3.4, isCrit ? 2.4 : 1.7, 1);

        sprite.userData = {
            life: 0.9,
            vy: 4.5
        };

        this.scene.add(sprite);
        this.damageTexts.push(sprite);
    }

    update(dt) {
        // 1. Update Projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.position.addScaledVector(p.userData.dir, p.userData.speed * dt);
            p.userData.life -= dt;

            if (p.userData.type === 'sun') {
                p.children[0].rotation.z += 25 * dt; // fast spinning chakram
            }

            if (p.userData.life <= 0) {
                this.scene.remove(p);
                this.projectiles.splice(i, 1);
            }
        }

        // 2. Update Flame Particles
        for (let i = this.flameParticles.length - 1; i >= 0; i--) {
            const f = this.flameParticles[i];
            f.position.addScaledVector(f.userData.dir, f.userData.speed * dt);
            f.userData.life -= dt;
            const progress = f.userData.life / f.userData.maxLife;
            f.scale.setScalar(progress * 1.8);
            f.material.opacity = progress;

            if (f.userData.life <= 0) {
                this.scene.remove(f);
                this.flameParticles.splice(i, 1);
            }
        }

        // 3. Update AOE Zones (Solar flare, Quake spikes, Kovil mandala)
        for (let i = this.aoeZones.length - 1; i >= 0; i--) {
            const zone = this.aoeZones[i];
            zone.userData.life -= dt;

            if (zone.geometry && zone.geometry.type === 'SphereGeometry') {
                // Expanding Solar Flare
                const progress = 1 - (zone.userData.life / zone.userData.maxLife);
                zone.scale.setScalar(1 + progress * zone.userData.maxRadius);
                zone.material.opacity = (1 - progress) * 0.9;
            } else if (zone.geometry && zone.geometry.type === 'ConeGeometry') {
                // Rising Rock Spike
                if (zone.position.y < zone.userData.targetY) {
                    zone.position.y += 18 * dt;
                }
            } else if (zone.children.length > 0) {
                // Kovil Mandala
                zone.rotation.y += 0.5 * dt;
            }

            if (zone.userData.life <= 0) {
                this.scene.remove(zone);
                this.aoeZones.splice(i, 1);
            }
        }

        // 4. Update Sparks
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.position.x += p.userData.vx * dt;
            p.position.y += p.userData.vy * dt;
            p.position.z += p.userData.vz * dt;
            p.userData.vy -= 18 * dt; // gravity
            p.userData.life -= dt;

            if (p.position.y < 0.1) {
                p.position.y = 0.1;
                p.userData.vx *= 0.6;
                p.userData.vz *= 0.6;
            }

            p.scale.setScalar(Math.max(0, p.userData.life));
            if (p.userData.life <= 0) {
                this.scene.remove(p);
                this.particles.splice(i, 1);
            }
        }

        // 5. Update Floating Damage Texts
        for (let i = this.damageTexts.length - 1; i >= 0; i--) {
            const txt = this.damageTexts[i];
            txt.position.y += txt.userData.vy * dt;
            txt.userData.life -= dt;
            txt.material.opacity = Math.max(0, txt.userData.life / 0.9);

            if (txt.userData.life <= 0) {
                this.scene.remove(txt);
                txt.material.map.dispose();
                txt.material.dispose();
                this.damageTexts.splice(i, 1);
            }
        }
    }
}
