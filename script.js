document.addEventListener('DOMContentLoaded', () => {
    const SESSION_LIMIT = 11 * 60 * 1000;
    const SATA_DURATION = 5.5 * 60 * 1000;
    const MICRO_HAUS_FADE_AT = SESSION_LIMIT - 18000;

    const canvas = document.getElementById('vesselCanvas');
    const startBtn = document.getElementById('startButton');
    const resetBtn = document.getElementById('resetButton');
    const mainUi = document.getElementById('mainUi');

    let audioCtx, whiteGain, pinkGain, timerStart, appState = 'LOBBY';

    // Three.js Setup (Visuals)
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    camera.position.z = 3;

    function initAudio() {
        if (audioCtx) return;
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Setup Noise nodes here... (White to Pink crossfade logic)
        // White noise node setup
        const whiteBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 2, audioCtx.sampleRate);
        const data = whiteBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        const whiteSource = audioCtx.createBufferSource();
        whiteSource.buffer = whiteBuffer;
        whiteSource.loop = true;

        whiteGain = audioCtx.createGain();
        whiteGain.gain.value = 0.05;
        whiteSource.connect(whiteGain).connect(audioCtx.destination);
        whiteSource.start();

        // Resume for iOS/Mobile
        if (audioCtx.state === 'suspended') audioCtx.resume();
    }

    startBtn.addEventListener('click', () => {
        initAudio();
        timerStart = Date.now();
        appState = 'ACTIVE';
        canvas.style.display = 'block';
        mainUi.classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');
        update();
    });

    function update() {
        if (appState !== 'ACTIVE') return;
        requestAnimationFrame(update);
        const elapsed = Date.now() - timerStart;
        const pct = elapsed / SESSION_LIMIT;

        // SATA to CODA Color Logic
        let colorT = 0;
        if (elapsed >= SATA_DURATION) {
            colorT = (elapsed - SATA_DURATION) / (SESSION_LIMIT - SATA_DURATION);
        }
        // Update Three.js colors based on colorT (Indigo to Gold)

        if (elapsed >= MICRO_HAUS_FADE_AT) document.getElementById('microHausReveal').classList.add('show');
        if (elapsed >= SESSION_LIMIT) finish();
        
        renderer.render(scene, camera);
    }

    function finish() {
        appState = 'END';
        document.getElementById('endNosReveal').classList.add('show');
        if (audioCtx) audioCtx.close();
    }

    resetBtn.addEventListener('click', () => window.location.reload());
});
