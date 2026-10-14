export class AudioSystem {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.ambientGain = null;
    }
    
    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
            this.startAmbience();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        if (this.ambientGain) {
            this.ambientGain.gain.setValueAtTime(this.muted ? 0 : 0.08, this.ctx.currentTime);
        }
        return this.muted;
    }

    startAmbience() {
        if (!this.ctx) return;
        
        // Brown noise / rain generator
        const bufferSize = this.ctx.sampleRate * 2;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5;
        }

        const rainSource = this.ctx.createBufferSource();
        rainSource.buffer = noiseBuffer;
        rainSource.loop = true;

        const rainFilter = this.ctx.createBiquadFilter();
        rainFilter.type = 'lowpass';
        rainFilter.frequency.value = 800;

        this.ambientGain = this.ctx.createGain();
        this.ambientGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

        rainSource.connect(rainFilter);
        rainFilter.connect(this.ambientGain);
        this.ambientGain.connect(this.ctx.destination);
        rainSource.start();

        // Dark ambient eerie sub-drone
        const drone = this.ctx.createOscillator();
        const droneGain = this.ctx.createGain();
        drone.type = 'sawtooth';
        drone.frequency.value = 55; // A1 low ritual drone
        
        const droneFilter = this.ctx.createBiquadFilter();
        droneFilter.type = 'lowpass';
        droneFilter.frequency.value = 140;

        droneGain.gain.value = 0.05;
        drone.connect(droneFilter);
        droneFilter.connect(droneGain);
        droneGain.connect(this.ctx.destination);
        drone.start();
    }
    
    play(type, pitchVar = 0.1) {
        if (!this.ctx || this.muted) return;
        const now = this.ctx.currentTime;
        let p = 1 + (Math.random() * pitchVar * 2 - pitchVar);

        if (type === 'shoot_chakram') {
            // High metallic spinning hum
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600 * p, now);
            osc.frequency.exponentialRampToValueAtTime(1200 * p, now + 0.15);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(now); osc.stop(now + 0.18);
        } else if (type === 'club_slam') {
            // Heavy bass thud & seismic impact
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(160 * p, now);
            osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(now); osc.stop(now + 0.35);

            // Sub rumble
            this.playDrum(50, 0.4);
        } else if (type === 'wind_slash') {
            // Rapid razor slice
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(900 * p, now);
            osc.frequency.exponentialRampToValueAtTime(200 * p, now + 0.12);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(now); osc.stop(now + 0.12);
        } else if (type === 'flame_whoosh') {
            // Resin fire burst
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(220 * p, now);
            osc.frequency.linearRampToValueAtTime(110 * p, now + 0.2);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(now); osc.stop(now + 0.2);
        } else if (type === 'hit') {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(240 * p, now);
            osc.frequency.exponentialRampToValueAtTime(60, now + 0.15);
            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(now); osc.stop(now + 0.15);
        } else if (type === 'transform') {
            // Mystical ritual bell / chime
            [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + idx * 0.05);
                gain.gain.setValueAtTime(0.15, now + idx * 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6 + idx * 0.05);
                osc.connect(gain); gain.connect(this.ctx.destination);
                osc.start(now + idx * 0.05);
                osc.stop(now + 0.7 + idx * 0.05);
            });
            this.playDrum(70, 0.4);
        } else if (type === 'special_flare') {
            // Divine blast
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.exponentialRampToValueAtTime(1200, now + 0.3);
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(now); osc.stop(now + 0.5);
        } else if (type === 'dash') {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.exponentialRampToValueAtTime(80, now + 0.18);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(now); osc.stop(now + 0.18);
        } else if (type === 'demon_roar') {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(110 * p, now);
            osc.frequency.linearRampToValueAtTime(70 * p, now + 0.4);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(now); osc.stop(now + 0.45);
        } else if (type === 'parry') {
            // Crisp metal clang
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(1400, now);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.25);
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(now); osc.stop(now + 0.3);
        }
    }

    playDrum(freq = 60, decay = 0.3) {
        if (!this.ctx || this.muted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(20, now + decay);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + decay);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(now); osc.stop(now + decay);
    }
}
