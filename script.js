document.addEventListener('DOMContentLoaded', () => {
    const SESSION_LIMIT = 11 * 60 * 1000;
    const SATA_DURATION = 5.5 * 60 * 1000;
    const FADE_DURATION = 5000; 
    const FADE_START = SATA_DURATION - (FADE_DURATION / 2); 
    
    const startBtn = document.getElementById('startButton');
    const timerEl = document.getElementById('timer');
    const timeFill = document.getElementById('timeFill');
    const canvas = document.getElementById('vesselCanvas');

    let audioCtx, whiteGain, pinkGain, timerStart, appState = 'LOBBY';

    // Three.js Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.position.z = 3;

    const geometry = new THREE.SphereGeometry(1, 64, 64);
    const material = new THREE.MeshBasicMaterial({ color: 0x4b5bdc });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);
    scene.background = new THREE.Color(0x05070f); // Starts dark

    function createPinkNoise() {
        const bufferSize = 4096;
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        const node = audioCtx.createScriptProcessor(bufferSize, 1, 1);
        node.onaudioprocess = (e) => {
            const output = e.outputBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                b3 = 0.86650 * b3 + white * 0.3104856;
                b4 = 0.55000 * b4 + white * 0.5329522;
                b5 = -0.7616 * b5 - white * 0.0168980;
                output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
                output[i] *= 0.11; b6 = white * 0.115926;
            }
        };
        return node;
    }

    function initAudio() {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        // White Noise Source
        const whiteBuf = audioCtx.createBuffer(1, audioCtx.sampleRate * 2, audioCtx.sampleRate);
        const d = whiteBuf.getChannelData(0);
        for (let i=0; i<d.length; i++) d[i] = Math.random() * 2 - 1;
        const whiteSrc = audioCtx.createBufferSource();
        whiteSrc.buffer = whiteBuf; 
        whiteSrc.loop = true;
        
        whiteGain = audioCtx.createGain();
        whiteGain.gain.value = 0.05; 
        whiteSrc.connect(whiteGain).connect(audioCtx.destination);
        whiteSrc.start();

        // Pink Noise Source
        const pinkNode = createPinkNoise();
        pinkGain = audioCtx.createGain();
        pinkGain.gain.value = 0.0; 
        pinkNode.connect(pinkGain).connect(audioCtx.destination);
        
        if (audioCtx.state === 'suspended') audioCtx.resume();
    }

    startBtn.addEventListener('click', () => {
        initAudio();
        timerStart = Date.now();
        appState = 'ACTIVE';
        canvas.style.display = 'block';
        document.getElementById('mainUi').classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');
        
        // Initial SATA Colors
        scene.background = new THREE.Color(0xf5c542);
        sphere.material.color.set(0x4b5bdc);
        
        update();
    });

    document.getElementById('resetButton').addEventListener('click', () => {
        window.location.reload();
    });

    function update() {
        if (appState !== 'ACTIVE') return;
        requestAnimationFrame(update);
        const elapsed = Date.now() - timerStart;
        const remaining = Math.max(0, SESSION_LIMIT - elapsed);
        const pct = Math.min(elapsed / SESSION_LIMIT, 1);

        // Update Timer HUD
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        timerEl.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        document.getElementById('percent').textContent = Math.floor(pct * 100);
        timeFill.style.width = `${pct * 100}%`;

        // Crossfade Volume Logic
        whiteGain.gain.value = 0.05 * (1 - pct);
        pinkGain.gain.value = 0.05 * pct;

        // Visual Interpolation (Lerp) Logic for the 5-second breath
        let fadeLerp = Math.max(0, Math.min(1, (elapsed - FADE_START) / FADE_DURATION));
        
        let breathPulse = 1;
        if (elapsed >= FADE_START && elapsed <= FADE_START + FADE_DURATION) {
            breathPulse = 1 + (Math.sin(fadeLerp * Math.PI) * 0.15); 
        }
        sphere.scale.set(breathPulse, breathPulse, breathPulse);

        // The Color Flip
        const indigoColor = new THREE.Color(0x4b5bdc);
        const goldColor = new THREE.Color(0xf5c542);

        const currentBg = new THREE.Color().copy(goldColor).lerp(indigoColor, fadeLerp);
        const currentSphere = new THREE.Color().copy(indigoColor).lerp(goldColor, fadeLerp);

        scene.background = currentBg;
        sphere.material.color.set(currentSphere);
        
        // Progress bar color transition
        const barColor1 = new THREE.Color(0x4b5bdc).lerp(new THREE.Color(0xff8a1e), pct);
        timeFill.style.background = `rgb(${Math.floor(barColor1.r*255)}, ${Math.floor(barColor1.g*255)}, ${Math.floor(barColor1.b*255)})`;

        // Image Reveal Sequences
        if (elapsed >= SESSION_LIMIT - 18000) {
            document.getElementById('microHausReveal').classList.add('show');
        }
        
        if (elapsed >= SESSION_LIMIT) {
            appState = 'END';
            document.getElementById('endNosReveal').classList.add('show');
            if (audioCtx) {
                whiteGain.gain.setTargetAtTime(0.0001, audioCtx.currentTime, 1.5);
                pinkGain.gain.setTargetAtTime(0.0001, audioCtx.currentTime, 1.5);
            }
        }
        renderer.render(scene, camera);
    }

    // Handle window resizing
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
});
