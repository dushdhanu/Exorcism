import * as THREE from 'three';

export class Core3D {
    constructor(canvas) {
        this.canvas = canvas;
        
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0c14); // Deep nocturnal moonlight atmosphere
        this.scene.fog = new THREE.FogExp2(0x0a0c14, 0.015);

        // Camera setup (Cinematic Isometric Third-person)
        this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.cameraOffset = new THREE.Vector3(0, 24, 20);
        this.targetCameraPos = new THREE.Vector3();
        this.shakeOffset = new THREE.Vector3();
        this.shakeTimer = 0;
        this.shakeIntensity = 0;
        
        // Renderer setup with ACESFilmic Tone Mapping for rich vibrant colors
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.35;

        // Ambient lighting - Soft moonlight with deep navy undertone
        this.ambientLight = new THREE.AmbientLight(0x182438, 1.2);
        this.scene.add(this.ambientLight);

        // Directional Moonlight casting long dramatic shadows
        this.moonLight = new THREE.DirectionalLight(0x7da4d4, 1.8);
        this.moonLight.position.set(35, 60, 25);
        this.moonLight.castShadow = true;
        this.moonLight.shadow.mapSize.width = 2048;
        this.moonLight.shadow.mapSize.height = 2048;
        this.moonLight.shadow.camera.near = 10;
        this.moonLight.shadow.camera.far = 140;
        this.moonLight.shadow.camera.left = -60;
        this.moonLight.shadow.camera.right = 60;
        this.moonLight.shadow.camera.top = 60;
        this.moonLight.shadow.camera.bottom = -60;
        this.moonLight.shadow.bias = -0.0005;
        this.scene.add(this.moonLight);

        // Secondary rim/fill light (mystic red/violet undertone)
        this.rimLight = new THREE.DirectionalLight(0x772244, 0.6);
        this.rimLight.position.set(-30, 20, -30);
        this.scene.add(this.rimLight);

        // Dynamic player aura light
        this.playerAuraLight = new THREE.PointLight(0xffaa00, 2.5, 18, 1.5);
        this.playerAuraLight.position.set(0, 3, 0);
        this.scene.add(this.playerAuraLight);

        this.resizeHandler = () => this.onWindowResize();
        window.addEventListener('resize', this.resizeHandler);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    shake(duration, intensity) {
        this.shakeTimer = duration;
        this.shakeIntensity = intensity;
    }

    updateCamera(playerPos, dt = 0.016) {
        // Camera smoothly follows player with look-ahead
        this.targetCameraPos.copy(playerPos).add(this.cameraOffset);
        
        if (this.shakeTimer > 0) {
            this.shakeTimer -= dt;
            this.shakeOffset.set(
                (Math.random() - 0.5) * this.shakeIntensity,
                (Math.random() - 0.5) * this.shakeIntensity * 0.5,
                (Math.random() - 0.5) * this.shakeIntensity
            );
        } else {
            this.shakeOffset.set(0, 0, 0);
        }

        this.camera.position.lerp(this.targetCameraPos.clone().add(this.shakeOffset), 0.08);
        
        // Aim camera slightly ahead of player
        const lookTarget = playerPos.clone().add(new THREE.Vector3(0, 1.2, 0));
        this.camera.lookAt(lookTarget);

        // Move player aura light with player
        this.playerAuraLight.position.set(playerPos.x, playerPos.y + 2.5, playerPos.z);
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
}
