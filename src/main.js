import * as THREE from 'three';
import { Core3D } from './engine/Core3D.js';
import { Input } from './engine/Input.js';
import { AudioSystem } from './engine/Audio.js';
import { Environment3D } from './world/Environment3D.js';
import { Player3D } from './entities/Player3D.js';
import { Boss3D } from './entities/Bosses3D.js';
import { FXSystem3D } from './engine/FXSystem3D.js';

const canvas = document.getElementById('gameCanvas');

export const Game = {
    core: null,
    input: null,
    audio: null,
    env: null,
    player: null,
    fx: null,
    boss: null,
    minions: [],
    clock: new THREE.Clock(),
    gameState: 'menu', // 'menu', 'playing', 'gameover', 'levelclear', 'victory'

    // Wave & Progression
    currentWave: 1,
    maxWaves: 4,
    timeRemaining: 75,
    maxTime: 75,
    comboCount: 0,
    comboTimer: 0,

    // Boss Data per wave
    waveData: [
        { name: 'MOHINI', subtitle: 'THE ETHEREAL SIREN', demonType: 'Mohini' },
        { name: 'MAHASONA', subtitle: 'THE CEMETERY GIANT', demonType: 'Mahasona' },
        { name: 'KALU KUMARAYA', subtitle: 'THE SHADOW PRINCE', demonType: 'Kalu Kumaraya' },
        { name: 'GIRI YAKA', subtitle: 'THE AFFLICTION DEMON', demonType: 'Giri Yaka' }
    ],

    // UI Cache
    ui: {
        healthBar: document.getElementById('health-bar'),
        healthNum: document.getElementById('health-num'),
        pranaBar: document.getElementById('prana-bar'),
        pranaNum: document.getElementById('prana-num'),
        bossHud: document.getElementById('boss-hud'),
        bossName: document.getElementById('boss-name'),
        bossSub: document.getElementById('boss-sub'),
        bossHealthBar: document.getElementById('boss-health-bar'),
        levelDisplay: document.getElementById('level-display'),
        timerDisplay: document.getElementById('timer-display'),
        comboContainer: document.getElementById('combo-container'),
        comboCount: document.getElementById('combo-count'),
        primaryName: document.getElementById('current-primary-name'),
        specialName: document.getElementById('current-special-name'),
        specialCdOverlay: document.getElementById('special-cd-overlay'),
        flashOverlay: document.getElementById('flash-overlay')
    },

    init() {
        this.core = new Core3D(canvas);
        this.input = new Input(canvas);
        this.audio = new AudioSystem();
        this.env = new Environment3D(this.core.scene);
        this.fx = new FXSystem3D(this.core.scene);
        this.player = new Player3D(this.core.scene);

        this.bindEvents();
        this.updateAvatarUI();

        // Start render loop
        this.loop();
    },

    bindEvents() {
        // Start button
        document.getElementById('start-btn').addEventListener('click', () => {
            this.audio.init();
            document.getElementById('menu-screen').classList.add('hidden');
            document.getElementById('ui-layer').classList.remove('hidden');
            this.startWave(1);
        });

        // Restart button
        document.getElementById('restart-btn').addEventListener('click', () => {
            document.getElementById('game-over-screen').classList.add('hidden');
            this.startWave(this.currentWave);
        });

        // Next level button
        document.getElementById('next-level-btn').addEventListener('click', () => {
            document.getElementById('next-level-screen').classList.add('hidden');
            if (this.currentWave < this.maxWaves) {
                this.startWave(this.currentWave + 1);
            } else {
                this.triggerVictory();
            }
        });

        // Victory restart
        document.getElementById('victory-restart-btn').addEventListener('click', () => {
            document.getElementById('victory-screen').classList.add('hidden');
            this.startWave(1);
        });

        // Audio toggle button
        const audioBtn = document.getElementById('audio-toggle-btn');
        audioBtn.addEventListener('click', () => {
            this.audio.init();
            const muted = this.audio.toggleMute();
            audioBtn.innerText = muted ? '🔇 Muted' : '🔊 Sound';
        });

        // Clickable Avatar Dial items
        document.querySelectorAll('.dial-option').forEach(el => {
            el.addEventListener('click', () => {
                const key = el.getAttribute('data-key');
                if (key && this.player.currentAvatar !== key) {
                    this.player.setAvatar(key);
                    this.audio.play('transform');
                    this.core.shake(0.2, 0.4);
                    this.fx.spawnSparks(this.player.position, this.player.avatarData[key].color, 25);
                    this.updateAvatarUI();
                }
            });
        });
    },

    startWave(waveNum) {
        this.currentWave = waveNum;
        this.gameState = 'playing';
        this.timeRemaining = this.maxTime;
        this.comboCount = 0;

        // Reset player
        this.player.hp = this.player.maxHp;
        this.player.prana = this.player.maxPrana;
        this.player.position.set(0, 0, 0);

        // Remove old boss and minions
        if (this.boss) {
            this.core.scene.remove(this.boss.group);
            this.boss = null;
        }
        this.minions.forEach(m => this.core.scene.remove(m.group));
        this.minions = [];

        // Spawn Boss for this wave
        const wave = this.waveData[waveNum - 1];
        this.boss = new Boss3D(this.core.scene, wave.demonType, waveNum);
        this.boss.position.set(0, 0, 32);

        // Spawn a couple of minions
        this.spawnMinions(3 + waveNum);

        // Update Boss HUD
        this.ui.bossName.innerText = wave.name;
        this.ui.bossSub.innerText = wave.subtitle;
        this.ui.bossHud.classList.remove('hidden');
        this.ui.levelDisplay.innerText = `Wave ${waveNum}`;

        this.audio.play('demon_roar');
        this.audio.playDrum(55, 0.5);
    },

    spawnMinions(count) {
        const ghoulMat = new THREE.MeshStandardMaterial({ color: 0x223322, roughness: 0.8 });
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff3300 });

        for (let i = 0; i < count; i++) {
            const group = new THREE.Group();
            const angle = Math.random() * Math.PI * 2;
            const dist = 18 + Math.random() * 25;
            group.position.set(Math.cos(angle) * dist, 0.8, Math.sin(angle) * dist);

            // Small cemetery ghoul
            const body = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.2, 0.8), ghoulMat);
            body.position.y = 0.6;
            body.castShadow = true;
            group.add(body);

            const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), ghoulMat);
            head.position.y = 1.4;
            group.add(head);

            const eye = new THREE.Mesh(new THREE.SphereGeometry(0.08), eyeMat);
            eye.position.set(0, 1.45, 0.3);
            group.add(eye);

            group.userData = {
                hp: 35,
                maxHp: 35,
                speed: 13 + Math.random() * 4,
                dmg: 8,
                attackTimer: 0
            };

            this.core.scene.add(group);
            this.minions.push(group);
        }
    },

    updateAvatarUI() {
        const curKey = this.player.currentAvatar;
        const data = this.player.avatarData[curKey];

        // Update active class on dial
        document.querySelectorAll('.dial-option').forEach(el => {
            if (el.getAttribute('data-key') === curKey) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        });

        // Update quickbar ability names
        if (curKey === 'Digit1') {
            this.ui.primaryName.innerText = 'Solar Chakram';
            this.ui.specialName.innerText = 'Maha Surya Flare';
        } else if (curKey === 'Digit2') {
            this.ui.primaryName.innerText = 'Granite Smash';
            this.ui.specialName.innerText = 'Quake Shatter';
        } else if (curKey === 'Digit3') {
            this.ui.primaryName.innerText = 'Flurry Slashes';
            this.ui.specialName.innerText = 'Breeze-Step Dash';
        } else if (curKey === 'Digit4') {
            this.ui.primaryName.innerText = 'Pandama Flame';
            this.ui.specialName.innerText = 'Kovil Mandala';
        }
    },

    loop() {
        requestAnimationFrame(() => this.loop());
        const dt = Math.min(this.clock.getDelta(), 0.1);

        if (this.gameState === 'playing') {
            this.input.update(this.core.camera);
            this.updatePlayer(dt);
            this.updateCombat(dt);
            this.updateBoss(dt);
            this.updateMinions(dt);
            this.fx.update(dt);
            this.env.update(dt, this.player.position);
            this.core.updateCamera(this.player.position, dt);
            this.updateHUD(dt);
        } else {
            // Idle camera spin in menu/screens
            this.core.render();
            return;
        }

        this.core.render();
    },

    updatePlayer(dt) {
        const prevAvatar = this.player.currentAvatar;
        this.player.update(dt, this.input, this.env);

        // Check if avatar changed via keys 1-4
        if (this.player.currentAvatar !== prevAvatar) {
            this.audio.play('transform');
            this.core.shake(0.2, 0.4);
            this.fx.spawnSparks(this.player.position, this.player.avatarData[this.player.currentAvatar].color, 25);
            this.updateAvatarUI();
        }
    },

    updateCombat(dt) {
        const curAvatar = this.player.currentAvatar;
        const data = this.player.avatarData[curAvatar];

        // 1. Primary Attack (Left click or J key)
        const isAttacking = (this.input.mouse.down || this.input.keys['KeyJ']);
        if (isAttacking && this.player.attackTimer <= 0 && this.player.prana >= 4) {
            this.player.attackTimer = data.attackCd;
            this.player.prana -= 4;
            this.player.triggerAttackAnimation();

            const aimDir = this.getAimDirection();

            if (curAvatar === 'Digit1') {
                // Suriya Divya: Throw burning Solar Chakram
                this.fx.spawnChakram(this.player.position, aimDir, data.dmg);
                this.audio.play('shoot_chakram');
            } else if (curAvatar === 'Digit2') {
                // Maha Gaja: Heavy Granite Club Slam
                this.core.shake(0.35, 1.2);
                this.audio.play('club_slam');
                const hitPos = this.player.position.clone().add(aimDir.clone().multiplyScalar(3.2));
                this.fx.spawnSparks(hitPos, 0xa87c4f, 25);
                this.checkMeleeHits(hitPos, 4.2, data.dmg, 'earth');
            } else if (curAvatar === 'Digit3') {
                // Vayu Yodheya: Fast Wind Crescent Slashes
                this.audio.play('wind_slash');
                this.fx.spawnWindSlash(this.player.position, aimDir, data.dmg);
                this.checkMeleeHits(this.player.position, 3.8, data.dmg, 'gale');
            } else if (curAvatar === 'Digit4') {
                // Shanthikarma: Roaring Holy Flame Cone
                this.audio.play('flame_whoosh');
                this.fx.spawnFlameJet(this.player.position, aimDir, data.dmg);
                this.checkFlameHits(aimDir, data.dmg);
            }
        }

        // 2. Avatar Special / Ultimate (Right click or K key)
        const isSpecial = (this.input.mouse.rightDown || this.input.keys['KeyK']);
        if (isSpecial && this.player.specialCooldown <= 0 && this.player.prana >= 25) {
            this.player.specialCooldown = data.specialCd;
            this.player.prana -= 25;
            const aimDir = this.getAimDirection();

            if (curAvatar === 'Digit1') {
                // Solar Flare AOE
                this.audio.play('special_flare');
                this.core.shake(0.4, 1.5);
                this.fx.spawnSolarFlareAOE(this.player.position);
                this.checkRadialDamage(this.player.position, 16, 65, 'sun');
            } else if (curAvatar === 'Digit2') {
                // Earth Quake Fissure
                this.audio.play('club_slam');
                this.core.shake(0.5, 2.0);
                this.fx.spawnQuakeFissure(this.player.position, aimDir);
            } else if (curAvatar === 'Digit3') {
                // Breeze-Step Supersonic Dash
                this.audio.play('dash');
                this.audio.play('wind_slash');
                // Teleport forward 16 units, damaging all in path
                const startPos = this.player.position.clone();
                const targetPos = this.player.position.clone().add(aimDir.clone().multiplyScalar(14));
                this.fx.spawnSparks(startPos, 0x00f3ff, 20);
                this.player.position.copy(targetPos);
                this.fx.spawnSparks(targetPos, 0x00f3ff, 25);
                this.checkLineDamage(startPos, targetPos, 2.5, 45, 'gale');
            } else if (curAvatar === 'Digit4') {
                // Kovil Sacred Protection Mandala
                this.audio.play('transform');
                this.fx.spawnKovilMandala(this.player.position);
            }
        }

        // Check Projectile Collisions
        this.fx.projectiles.forEach(p => {
            // Check Boss
            if (this.boss && p.position.distanceTo(this.boss.position) < 3.2) {
                this.hitBoss(this.boss, p.userData.dmg, p.userData.type, p.position);
                p.userData.life = 0;
            }
            // Check Minions
            this.minions.forEach(m => {
                if (p.position.distanceTo(m.position) < 1.8) {
                    this.hitMinion(m, p.userData.dmg, p.userData.type, p.position);
                    p.userData.life = 0;
                }
            });
        });

        // Check Flame Particle Collisions
        this.fx.flameParticles.forEach(f => {
            if (this.boss && f.position.distanceTo(this.boss.position) < 3.0) {
                this.hitBoss(this.boss, f.userData.dmg * 0.4, 'mystic', f.position);
            }
            this.minions.forEach(m => {
                if (f.position.distanceTo(m.position) < 1.6) {
                    this.hitMinion(m, f.userData.dmg * 0.4, 'mystic', f.position);
                }
            });
        });

        // Check AOE Zone effects
        this.fx.aoeZones.forEach(z => {
            if (z.children && z.children.length > 0 && z.userData.radius) {
                // Kovil Mandala: Heals player, burns demons
                const pDist = this.player.position.distanceTo(z.position);
                if (pDist < z.userData.radius) {
                    this.player.hp = Math.min(this.player.maxHp, this.player.hp + 8 * dt);
                }
                if (this.boss && this.boss.position.distanceTo(z.position) < z.userData.radius) {
                    this.hitBoss(this.boss, 15 * dt, 'mystic', this.boss.position);
                }
                this.minions.forEach(m => {
                    if (m.position.distanceTo(z.position) < z.userData.radius) {
                        this.hitMinion(m, 20 * dt, 'mystic', m.position);
                    }
                });
            }
        });
    },

    getAimDirection() {
        if (this.input.mouse.worldPoint) {
            const dir = new THREE.Vector3().subVectors(this.input.mouse.worldPoint, this.player.position);
            dir.y = 0;
            if (dir.length() > 0.1) return dir.normalize();
        }
        return this.player.facingDir.clone();
    },

    checkMeleeHits(centerPos, range, dmg, type) {
        if (this.boss && centerPos.distanceTo(this.boss.position) < range + 2.0) {
            this.hitBoss(this.boss, dmg, type, this.boss.position);
        }
        this.minions.forEach(m => {
            if (centerPos.distanceTo(m.position) < range + 1.0) {
                this.hitMinion(m, dmg, type, m.position);
            }
        });
    },

    checkFlameHits(dir, dmg) {
        const coneOrigin = this.player.position;
        if (this.boss) {
            const toBoss = new THREE.Vector3().subVectors(this.boss.position, coneOrigin);
            if (toBoss.length() < 9.0 && toBoss.normalize().dot(dir) > 0.6) {
                this.hitBoss(this.boss, dmg * 0.6, 'mystic', this.boss.position);
            }
        }
        this.minions.forEach(m => {
            const toM = new THREE.Vector3().subVectors(m.position, coneOrigin);
            if (toM.length() < 8.0 && toM.normalize().dot(dir) > 0.6) {
                this.hitMinion(m, dmg * 0.6, 'mystic', m.position);
            }
        });
    },

    checkRadialDamage(center, radius, dmg, type) {
        if (this.boss && center.distanceTo(this.boss.position) < radius + 2.0) {
            this.hitBoss(this.boss, dmg, type, this.boss.position);
        }
        this.minions.forEach(m => {
            if (center.distanceTo(m.position) < radius) {
                this.hitMinion(m, dmg, type, m.position);
            }
        });
    },

    checkLineDamage(start, end, width, dmg, type) {
        const line = new THREE.Line3(start, end);
        const closest = new THREE.Vector3();

        if (this.boss) {
            line.closestPointToPoint(this.boss.position, true, closest);
            if (closest.distanceTo(this.boss.position) < width + 2.0) {
                this.hitBoss(this.boss, dmg, type, this.boss.position);
            }
        }
        this.minions.forEach(m => {
            line.closestPointToPoint(m.position, true, closest);
            if (closest.distanceTo(m.position) < width) {
                this.hitMinion(m, dmg, type, m.position);
            }
        });
    },

    hitBoss(boss, amount, type, pos) {
        const result = boss.damage(amount, type);
        this.audio.play('hit');
        this.fx.spawnSparks(pos, result.isCrit ? 0xffcc00 : 0xff3300, result.isCrit ? 22 : 10);
        this.fx.spawnDamageText(pos, result.dmg, result.isCrit);

        // Counter-attack parry mechanic: If boss is telegraphing Blue Glint
        if (boss.telegraphType === 'blue') {
            this.audio.play('parry');
            this.core.shake(0.3, 1.2);
            boss.isStunned = 2.5;
            boss.telegraphType = null;
            this.fx.spawnDamageText(pos, 'PERFECT PARRY!', true);
            this.fx.spawnSparks(pos, 0x00f3ff, 35);
        }

        // Combo system
        this.addCombo();

        if (result.hp <= 0) {
            this.defeatBoss();
        }
    },

    hitMinion(minion, amount, type, pos) {
        minion.userData.hp -= amount;
        this.audio.play('hit');
        this.fx.spawnSparks(pos, 0xff2200, 8);
        this.fx.spawnDamageText(pos, Math.floor(amount));
        this.addCombo();

        if (minion.userData.hp <= 0) {
            this.core.scene.remove(minion);
            this.minions = this.minions.filter(m => m !== minion);
            this.fx.spawnSparks(pos, 0x44ff44, 25);
            // Drop Prana
            this.player.prana = Math.min(this.player.maxPrana, this.player.prana + 15);
        }
    },

    addCombo() {
        this.comboCount++;
        this.comboTimer = 3.5;
        this.ui.comboCount.innerText = this.comboCount;
        this.ui.comboContainer.classList.remove('hidden');
    },

    updateBoss(dt) {
        if (!this.boss) return;
        this.boss.update(dt, this.player.position, this.audio);

        // Periodic Attack Logic with Universal Telegraphs
        this.boss.attackCooldown -= dt;
        if (this.boss.attackCooldown <= 0 && this.boss.isStunned <= 0) {
            const dist = this.boss.position.distanceTo(this.player.position);

            if (dist < 6.5) {
                // Red Glint: Unblockable heavy strike (must dodge!)
                this.boss.setTelegraph('red', 1.0);
                this.boss.attackCooldown = 3.0;
                setTimeout(() => {
                    if (this.boss && this.gameState === 'playing') {
                        if (this.boss.position.distanceTo(this.player.position) < 7.0 && !this.player.isDashing) {
                            this.damagePlayer(25);
                            this.core.shake(0.4, 1.8);
                        }
                    }
                }, 1000);
            } else if (dist < 14) {
                // Blue Glint: Parriable attack window!
                this.boss.setTelegraph('blue', 1.2);
                this.boss.attackCooldown = 4.0;
                setTimeout(() => {
                    if (this.boss && this.boss.isStunned <= 0 && this.gameState === 'playing') {
                        if (this.boss.position.distanceTo(this.player.position) < 8.0 && !this.player.isDashing) {
                            this.damagePlayer(18);
                        }
                    }
                }, 1200);
            }
        }
    },

    updateMinions(dt) {
        this.minions.forEach(m => {
            const dir = new THREE.Vector3().subVectors(this.player.position, m.position);
            dir.y = 0;
            const dist = dir.length();

            if (dist > 1.5) {
                dir.normalize();
                m.position.addScaledVector(dir, m.userData.speed * dt);
                m.lookAt(this.player.position);
            } else {
                // Attack player
                m.userData.attackTimer -= dt;
                if (m.userData.attackTimer <= 0) {
                    m.userData.attackTimer = 1.2;
                    this.damagePlayer(m.userData.dmg);
                }
            }
        });
    },

    damagePlayer(amount) {
        if (this.player.isDashing) return; // Invincible during dash!
        const isDead = this.player.damage(amount);
        this.audio.play('hit');
        this.core.shake(0.3, 1.0);
        this.comboCount = 0;
        this.ui.comboContainer.classList.add('hidden');

        // Red screen damage flash
        this.ui.flashOverlay.style.background = 'rgba(255, 0, 0, 0.4)';
        this.ui.flashOverlay.style.opacity = '1';
        setTimeout(() => { this.ui.flashOverlay.style.opacity = '0'; }, 120);

        if (isDead) {
            this.triggerGameOver();
        }
    },

    defeatBoss() {
        this.core.scene.remove(this.boss.group);
        this.boss = null;
        this.audio.play('demon_roar');
        this.audio.play('transform');
        this.core.shake(0.5, 2.5);

        // Flash white victory
        this.ui.flashOverlay.style.background = 'rgba(255, 255, 255, 0.8)';
        this.ui.flashOverlay.style.opacity = '1';
        setTimeout(() => { this.ui.flashOverlay.style.opacity = '0'; }, 200);

        if (this.currentWave < this.maxWaves) {
            this.gameState = 'levelclear';
            document.getElementById('next-level-screen').classList.remove('hidden');
        } else {
            this.triggerVictory();
        }
    },

    triggerGameOver() {
        this.gameState = 'gameover';
        document.getElementById('game-over-screen').classList.remove('hidden');
    },

    triggerVictory() {
        this.gameState = 'victory';
        document.getElementById('victory-screen').classList.remove('hidden');
    },

    updateHUD(dt) {
        // Player HP & Prana
        const hpPct = Math.max(0, (this.player.hp / this.player.maxHp) * 100);
        const pranaPct = Math.max(0, (this.player.prana / this.player.maxPrana) * 100);
        this.ui.healthBar.style.width = `${hpPct}%`;
        this.ui.healthNum.innerText = `${Math.ceil(this.player.hp)}/${this.player.maxHp}`;
        this.ui.pranaBar.style.width = `${pranaPct}%`;
        this.ui.pranaNum.innerText = `${Math.ceil(this.player.prana)}/${this.player.maxPrana}`;

        // Boss Health
        if (this.boss) {
            const bPct = Math.max(0, (this.boss.hp / this.boss.maxHp) * 100);
            this.ui.bossHealthBar.style.width = `${bPct}%`;
        } else {
            this.ui.bossHealthBar.style.width = '0%';
        }

        // Special Cooldown Overlay
        const curData = this.player.avatarData[this.player.currentAvatar];
        if (this.player.specialCooldown > 0) {
            const cdPct = (this.player.specialCooldown / curData.specialCd) * 100;
            this.ui.specialCdOverlay.style.width = `${cdPct}%`;
        } else {
            this.ui.specialCdOverlay.style.width = '0%';
        }

        // Wave Timer
        this.timeRemaining -= dt;
        this.ui.timerDisplay.innerText = `Time: ${Math.ceil(this.timeRemaining)}s`;
        if (this.timeRemaining <= 0) {
            this.damagePlayer(999);
        }

        // Combo decay
        if (this.comboTimer > 0) {
            this.comboTimer -= dt;
            if (this.comboTimer <= 0) {
                this.comboCount = 0;
                this.ui.comboContainer.classList.add('hidden');
            }
        }
    }
};

// Initialize game on load
window.addEventListener('DOMContentLoaded', () => {
    Game.init();
});
