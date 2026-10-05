import * as THREE from 'three';

export class Core3D {
    constructor(canvas) {
        this.canvas = canvas;
        
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050505);
        this.scene.fog = new THREE.FogExp2(0x050505, 0.02);

        // Camera setup (Third-person)
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.cameraOffset = new THREE.Vector3(0, 15, 20);
        
        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x222233);
        this.scene.add(ambientLight);

        this.dirLight = new THREE.DirectionalLight(0x6688cc, 1.5);
        this.dirLight.position.set(20, 40, 20);
        this.dirLight.castShadow = true;
        this.dirLight.shadow.mapSize.width = 2048;
        this.dirLight.shadow.mapSize.height = 2048;
        this.dirLight.shadow.camera.near = 0.5;
        this.dirLight.shadow.camera.far = 100;
        this.dirLight.shadow.camera.left = -50;
        this.dirLight.shadow.camera.right = 50;
        this.dirLight.shadow.camera.top = 50;
        this.dirLight.shadow.camera.bottom = -50;
        this.scene.add(this.dirLight);

        // Point light (torch/mystic glow)
        this.pointLight = new THREE.PointLight(0xff5500, 2, 50);
        this.pointLight.position.set(0, 5, 0);
        this.scene.add(this.pointLight);

        this.resizeHandler = () => this.onWindowResize();
        window.addEventListener('resize', this.resizeHandler);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    updateCamera(playerPos) {
        // Smoothly follow player
        const targetPos = playerPos.clone().add(this.cameraOffset);
        this.camera.position.lerp(targetPos, 0.1);
        this.camera.lookAt(playerPos);
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
}
