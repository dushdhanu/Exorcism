import * as THREE from 'three';

export class Environment3D {
    constructor(scene) {
        this.scene = scene;
        this.torches = [];
        this.rainSystem = null;
        this.mistSystem = null;
        this.obstacles = []; // Collision bounding boxes/spheres
        
        this.buildGround();
        this.buildRain();
        this.buildMist();
        this.buildStupa(new THREE.Vector3(0, 0, -35));
        this.buildMoonstoneAltar(new THREE.Vector3(0, 0.05, 0));
        this.buildPillars();
        this.buildTorches();
        this.buildGraveyardMonuments();
        this.buildBanyanTrees();
    }

    createNoiseTexture() {
        // Generate procedural dark stone / wet mud texture
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Dark slate/mud base
        ctx.fillStyle = '#111718';
        ctx.fillRect(0, 0, size, size);

        // Stone tiles pattern
        ctx.strokeStyle = '#080c0d';
        ctx.lineWidth = 4;
        const tileSize = 64;
        for (let x = 0; x < size; x += tileSize) {
            for (let y = 0; y < size; y += tileSize) {
                const shift = ((y / tileSize) % 2 === 0) ? 0 : tileSize / 2;
                const tileX = (x + shift) % size;
                
                // Varied stone shade
                const shade = Math.floor(20 + Math.random() * 25);
                const moss = Math.random() < 0.25 ? 'rgba(25, 45, 25, 0.4)' : 'rgba(0,0,0,0)';
                ctx.fillStyle = `rgb(${shade}, ${shade + 3}, ${shade + 1})`;
                ctx.fillRect(tileX + 2, y + 2, tileSize - 4, tileSize - 4);
                
                // Moss overlay
                ctx.fillStyle = moss;
                ctx.fillRect(tileX + 2, y + 2, tileSize - 4, tileSize - 4);

                ctx.strokeRect(tileX, y, tileSize, tileSize);
            }
        }

        // Noise flecks for wet grime
        for (let i = 0; i < 4000; i++) {
            const nx = Math.random() * size;
            const ny = Math.random() * size;
            const radius = Math.random() * 2;
            ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.2)';
            ctx.beginPath();
            ctx.arc(nx, ny, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(16, 16);
        return texture;
    }

    buildGround() {
        const groundGeo = new THREE.PlaneGeometry(280, 280, 32, 32);
        const texture = this.createNoiseTexture();
        
        const groundMat = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.65,
            metalness: 0.25,
            color: 0x445555
        });

        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Dark boundary mountain/forest wall illusion
        const boundaryGeo = new THREE.CylinderGeometry(140, 140, 30, 32, 1, true);
        const boundaryMat = new THREE.MeshBasicMaterial({
            color: 0x05070a,
            side: THREE.BackSide,
            fog: true
        });
        const boundary = new THREE.Mesh(boundaryGeo, boundaryMat);
        boundary.position.y = 15;
        this.scene.add(boundary);
    }

    buildRain() {
        const count = 1200;
        const positions = new Float32Array(count * 6); // 2 points per rain streak line
        this.rainVelocities = [];

        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * 160;
            const y = Math.random() * 40 + 2;
            const z = (Math.random() - 0.5) * 160;
            const len = 1.2 + Math.random() * 0.8;

            positions[i * 6] = x;
            positions[i * 6 + 1] = y;
            positions[i * 6 + 2] = z;

            positions[i * 6 + 3] = x - 0.2; // slight wind slant
            positions[i * 6 + 4] = y - len;
            positions[i * 6 + 5] = z - 0.1;

            this.rainVelocities.push(28 + Math.random() * 12);
        }

        const rainGeo = new THREE.BufferGeometry();
        rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const rainMat = new THREE.LineBasicMaterial({
            color: 0x90b4d4,
            transparent: true,
            opacity: 0.45,
            depthWrite: false
        });

        this.rainSystem = new THREE.LineSegments(rainGeo, rainMat);
        this.scene.add(this.rainSystem);
    }

    buildMist() {
        // Swirling graveyard mist particles
        const mistCount = 60;
        const mistGroup = new THREE.Group();
        this.mistPlanes = [];

        const mistCanvas = document.createElement('canvas');
        mistCanvas.width = 128;
        mistCanvas.height = 128;
        const mctx = mistCanvas.getContext('2d');
        const grad = mctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        grad.addColorStop(0, 'rgba(180, 210, 240, 0.22)');
        grad.addColorStop(0.5, 'rgba(120, 160, 200, 0.08)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        mctx.fillStyle = grad;
        mctx.fillRect(0, 0, 128, 128);

        const mistTexture = new THREE.CanvasTexture(mistCanvas);
        const mistGeo = new THREE.PlaneGeometry(16, 16);
        const mistMat = new THREE.MeshBasicMaterial({
            map: mistTexture,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        for (let i = 0; i < mistCount; i++) {
            const mesh = new THREE.Mesh(mistGeo, mistMat);
            mesh.rotation.x = -Math.PI / 2;
            mesh.position.set(
                (Math.random() - 0.5) * 180,
                0.4 + Math.random() * 1.5,
                (Math.random() - 0.5) * 180
            );
            mesh.userData = {
                rotSpeed: (Math.random() - 0.5) * 0.2,
                vx: (Math.random() - 0.5) * 1.5,
                vz: (Math.random() - 0.5) * 1.5
            };
            mistGroup.add(mesh);
            this.mistPlanes.push(mesh);
        }

        this.scene.add(mistGroup);
    }

    buildStupa(pos) {
        // Ancient Sri Lankan Dagoba (Stupa) in the background
        const stupaGroup = new THREE.Group();
        stupaGroup.position.copy(pos);

        const stoneMat = new THREE.MeshStandardMaterial({
            color: 0x2e353b,
            roughness: 0.9,
            metalness: 0.1
        });
        const mossStoneMat = new THREE.MeshStandardMaterial({
            color: 0x232d29,
            roughness: 0.95,
            metalness: 0.05
        });

        // 3 concentric stepped terraces (Pesawa)
        const base1 = new THREE.Mesh(new THREE.CylinderGeometry(14, 15, 2, 24), stoneMat);
        base1.position.y = 1;
        base1.receiveShadow = true; base1.castShadow = true;
        stupaGroup.add(base1);

        const base2 = new THREE.Mesh(new THREE.CylinderGeometry(12, 13, 1.8, 24), stoneMat);
        base2.position.y = 2.8;
        base2.receiveShadow = true; base2.castShadow = true;
        stupaGroup.add(base2);

        const base3 = new THREE.Mesh(new THREE.CylinderGeometry(10.5, 11.2, 1.5, 24), stoneMat);
        base3.position.y = 4.2;
        base3.receiveShadow = true; base3.castShadow = true;
        stupaGroup.add(base3);

        // Hemispherical Dome (Garbhaya)
        const domeGeo = new THREE.SphereGeometry(9, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const dome = new THREE.Mesh(domeGeo, mossStoneMat);
        dome.position.y = 4.9;
        dome.castShadow = true; dome.receiveShadow = true;
        stupaGroup.add(dome);

        // Square Tee (Hatharas Kotuwa)
        const tee = new THREE.Mesh(new THREE.BoxGeometry(3.6, 3.2, 3.6), stoneMat);
        tee.position.y = 15;
        tee.castShadow = true;
        stupaGroup.add(tee);

        // Conical Spire (Devatha Kotuwa & Kotha)
        const spire = new THREE.Mesh(new THREE.ConeGeometry(2.2, 8, 16), stoneMat);
        spire.position.y = 20;
        spire.castShadow = true;
        stupaGroup.add(spire);

        // Golden Pinnacle Finial (Chudamanikya)
        const goldMat = new THREE.MeshStandardMaterial({
            color: 0xffcc33,
            roughness: 0.2,
            metalness: 0.9,
            emissive: 0xaa8800,
            emissiveIntensity: 0.3
        });
        const finial = new THREE.Mesh(new THREE.OctahedronGeometry(0.8), goldMat);
        finial.position.y = 24.5;
        stupaGroup.add(finial);

        this.scene.add(stupaGroup);
        this.obstacles.push({ x: pos.x, z: pos.z, radius: 15 });
    }

    buildMoonstoneAltar(pos) {
        // Sandakada Pahana (Moonstone) carved ritual circle in the center
        const altarGroup = new THREE.Group();
        altarGroup.position.copy(pos);

        // Carved stone concentric rings
        const ringGeo1 = new THREE.RingGeometry(0.1, 7, 32);
        const ringMat1 = new THREE.MeshStandardMaterial({
            color: 0x1d2226,
            roughness: 0.7,
            metalness: 0.2,
            side: THREE.DoubleSide
        });
        const moonstone = new THREE.Mesh(ringGeo1, ringMat1);
        moonstone.rotation.x = -Math.PI / 2;
        moonstone.receiveShadow = true;
        altarGroup.add(moonstone);

        // Glowing ritual runes etched inside
        const runeMat = new THREE.MeshBasicMaterial({
            color: 0x00f3ff,
            transparent: true,
            opacity: 0.35,
            side: THREE.DoubleSide
        });
        const innerRing = new THREE.Mesh(new THREE.RingGeometry(4.5, 4.8, 32), runeMat);
        innerRing.rotation.x = -Math.PI / 2;
        innerRing.position.y = 0.02;
        altarGroup.add(innerRing);

        const outerRing = new THREE.Mesh(new THREE.RingGeometry(6.6, 6.9, 32), runeMat);
        outerRing.rotation.x = -Math.PI / 2;
        outerRing.position.y = 0.02;
        altarGroup.add(outerRing);

        this.scene.add(altarGroup);
    }

    buildPillars() {
        const pillarMat = new THREE.MeshStandardMaterial({
            color: 0x333b40,
            roughness: 0.85,
            metalness: 0.1
        });

        // 8 Ancient carved stone pillars (Tam) forming a ceremonial perimeter
        const radius = 28;
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;

            const pillarGroup = new THREE.Group();
            pillarGroup.position.set(x, 0, z);

            const isBroken = (i === 2 || i === 5);
            const height = isBroken ? 3.5 : 7.0;

            // Octagonal column shaft
            const shaft = new THREE.Mesh(
                new THREE.CylinderGeometry(0.7, 0.85, height, 8),
                pillarMat
            );
            shaft.position.y = height / 2;
            shaft.castShadow = true;
            shaft.receiveShadow = true;
            pillarGroup.add(shaft);

            // Carved stone capital
            if (!isBroken) {
                const capital = new THREE.Mesh(
                    new THREE.BoxGeometry(1.9, 0.7, 1.9),
                    pillarMat
                );
                capital.position.y = height + 0.35;
                capital.castShadow = true;
                pillarGroup.add(capital);
            }

            this.scene.add(pillarGroup);
            this.obstacles.push({ x, z, radius: 1.2 });
        }
    }

    buildTorches() {
        // Traditional Sri Lankan Pandam (Fire torches) placed strategically
        const torchPositions = [
            [-18, 18], [18, 18], [-18, -18], [18, -18],
            [-38, 0], [38, 0], [0, 24], [0, -20]
        ];

        torchPositions.forEach(([x, z]) => {
            const torchGroup = new THREE.Group();
            torchGroup.position.set(x, 0, z);

            // Wooden post
            const post = new THREE.Mesh(
                new THREE.CylinderGeometry(0.18, 0.22, 4.5, 8),
                new THREE.MeshStandardMaterial({ color: 0x3a2414, roughness: 0.9 })
            );
            post.position.y = 2.25;
            post.castShadow = true;
            torchGroup.add(post);

            // Clay bowl
            const bowl = new THREE.Mesh(
                new THREE.CylinderGeometry(0.7, 0.3, 0.5, 8),
                new THREE.MeshStandardMaterial({ color: 0x6e3820, roughness: 0.85 })
            );
            bowl.position.y = 4.6;
            torchGroup.add(bowl);

            // Glowing flame core
            const flameMat = new THREE.MeshBasicMaterial({ color: 0xff6600 });
            const flame = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), flameMat);
            flame.position.y = 5.0;
            flame.scale.set(1, 1.8, 1);
            torchGroup.add(flame);

            // Dynamic flickering PointLight
            const light = new THREE.PointLight(0xff7711, 2.8, 22, 1.6);
            light.position.set(0, 5.2, 0);
            torchGroup.add(light);

            this.scene.add(torchGroup);
            this.torches.push({ flame, light, baseIntensity: 2.8, timeOffset: Math.random() * 10 });
            this.obstacles.push({ x, z, radius: 0.6 });
        });
    }

    buildGraveyardMonuments() {
        const tombMat = new THREE.MeshStandardMaterial({
            color: 0x222629,
            roughness: 0.92,
            metalness: 0.05
        });

        // Scatter 45 ancient weathered tombstones and crypts
        for (let i = 0; i < 45; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 14 + Math.random() * 85;
            const x = Math.cos(angle) * dist;
            const z = Math.sin(angle) * dist;

            // Avoid center sanctuary
            if (dist < 10) continue;

            const isCrypt = Math.random() < 0.2;
            const tombGroup = new THREE.Group();
            tombGroup.position.set(x, 0, z);
            tombGroup.rotation.y = Math.random() * Math.PI * 2;
            tombGroup.rotation.z = (Math.random() - 0.5) * 0.15; // slightly tilted

            if (isCrypt) {
                // Stone sarcophagus / small colonial crypt
                const crypt = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.4, 4.0), tombMat);
                crypt.position.y = 0.7;
                crypt.castShadow = true; crypt.receiveShadow = true;
                tombGroup.add(crypt);

                const roof = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.4, 4.2), tombMat);
                roof.position.y = 1.6;
                roof.castShadow = true;
                tombGroup.add(roof);

                this.obstacles.push({ x, z, radius: 1.8 });
            } else {
                // Arched stone headstone
                const h = 1.6 + Math.random() * 1.2;
                const stone = new THREE.Mesh(new THREE.BoxGeometry(1.2, h, 0.35), tombMat);
                stone.position.y = h / 2;
                stone.castShadow = true; stone.receiveShadow = true;
                tombGroup.add(stone);

                const top = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.35, 12), tombMat);
                top.rotation.x = Math.PI / 2;
                top.position.y = h;
                top.castShadow = true;
                tombGroup.add(top);

                this.obstacles.push({ x, z, radius: 0.8 });
            }

            this.scene.add(tombGroup);
        }
    }

    buildBanyanTrees() {
        const barkMat = new THREE.MeshStandardMaterial({
            color: 0x1f1812,
            roughness: 0.95
        });

        // 6 Gnarled Banyan / Bo trees on perimeter
        const treeLocs = [
            [-50, -40], [45, -45], [-55, 35], [50, 40], [0, 60], [-60, 0]
        ];

        treeLocs.forEach(([x, z]) => {
            const treeGroup = new THREE.Group();
            treeGroup.position.set(x, 0, z);

            // Twisted trunk
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 3.2, 14, 8), barkMat);
            trunk.position.y = 7;
            trunk.castShadow = true;
            treeGroup.add(trunk);

            // Creeping aerial roots
            for (let r = 0; r < 5; r++) {
                const rAngle = (r / 5) * Math.PI * 2;
                const root = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, 9, 6), barkMat);
                root.position.set(Math.cos(rAngle) * 2.8, 4.5, Math.sin(rAngle) * 2.8);
                root.rotation.z = (Math.random() - 0.5) * 0.3;
                root.castShadow = true;
                treeGroup.add(root);
            }

            // Dark canopy crown
            const foliageMat = new THREE.MeshStandardMaterial({
                color: 0x142017,
                roughness: 0.9
            });
            const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(8), foliageMat);
            crown.position.y = 15;
            crown.castShadow = true;
            treeGroup.add(crown);

            this.scene.add(treeGroup);
            this.obstacles.push({ x, z, radius: 3.5 });
        });
    }

    update(dt, playerPos) {
        const time = performance.now() * 0.001;

        // Animate flickering torches (pandam)
        this.torches.forEach(t => {
            const flicker = Math.sin(time * 12 + t.timeOffset) * 0.4 +
                            Math.sin(time * 23 + t.timeOffset * 2) * 0.2;
            t.light.intensity = t.baseIntensity + flicker;
            t.flame.scale.y = 1.6 + flicker * 0.4;
            t.flame.position.x = Math.sin(time * 8 + t.timeOffset) * 0.05;
        });

        // Animate falling rain tracking player
        if (this.rainSystem && playerPos) {
            const posAttr = this.rainSystem.geometry.attributes.position;
            const arr = posAttr.array;

            for (let i = 0; i < this.rainVelocities.length; i++) {
                const vel = this.rainVelocities[i];
                arr[i * 6 + 1] -= vel * dt;
                arr[i * 6 + 4] -= vel * dt;

                // Reset rain drop if it hits ground or wanders too far from player
                if (arr[i * 6 + 4] < 0) {
                    const nx = playerPos.x + (Math.random() - 0.5) * 120;
                    const nz = playerPos.z + (Math.random() - 0.5) * 120;
                    const ny = 35 + Math.random() * 15;
                    const len = 1.2 + Math.random() * 0.8;

                    arr[i * 6] = nx;
                    arr[i * 6 + 1] = ny;
                    arr[i * 6 + 2] = nz;

                    arr[i * 6 + 3] = nx - 0.2;
                    arr[i * 6 + 4] = ny - len;
                    arr[i * 6 + 5] = nz - 0.1;
                }
            }
            posAttr.needsUpdate = true;
        }

        // Animate swirling ground mist
        this.mistPlanes.forEach(m => {
            m.rotation.z += m.userData.rotSpeed * dt;
            m.position.x += m.userData.vx * dt;
            m.position.z += m.userData.vz * dt;

            // Wrap within arena boundary
            if (m.position.x > 100) m.position.x = -100;
            if (m.position.x < -100) m.position.x = 100;
            if (m.position.z > 100) m.position.z = -100;
            if (m.position.z < -100) m.position.z = 100;
        });
    }

    checkCollision(x, z, radius) {
        for (let i = 0; i < this.obstacles.length; i++) {
            const obs = this.obstacles[i];
            const dx = x - obs.x;
            const dz = z - obs.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < radius + obs.radius) {
                return true;
            }
        }
        // Arena outer boundary circle check
        if (Math.hypot(x, z) > 120 - radius) {
            return true;
        }
        return false;
    }
}
