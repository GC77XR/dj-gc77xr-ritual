const SESSION_LIMIT = 660000; 
const MARK_555 = 355 / 660; 

const briefingBtn = document.getElementById('briefingBtn');
const startBtn = document.getElementById('startBtn');
const video = document.getElementById('briefingVideo');
const videoContainer = document.getElementById('videoContainer');
const mainUi = document.getElementById('mainUi');
const vesselCanvas = document.getElementById('vesselCanvas');
const hud = document.getElementById('hud');
const timerText = document.getElementById('timer');
const timeFill = document.getElementById('timeFill');

let audioCtx, masterGain, sataOsc, sataGain, pinkGain, pinkFilter;

function initAudio() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.8, audioCtx.currentTime + 3);
    masterGain.connect(audioCtx.destination);
    
    // SATA Phase: Grounding 136.1 Hz Drone
    sataOsc = audioCtx.createOscillator();
    sataOsc.type = 'sine';
    sataOsc.frequency.value = 136.1; 
    
    sataGain = audioCtx.createGain();
    sataGain.gain.value = 0.5; 
    sataOsc.connect(sataGain).connect(masterGain);
    sataOsc.start();

    // CODA Phase: Pink Noise Generation
    const bufferSize = audioCtx.sampleRate * 2;
    const pinkBuf = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = pinkBuf.getChannelData(0);
    let b0=0, b1=0, b2=0, b3=0, b4=0, b5=0, b6=0;
    
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11; 
        b6 = white * 0.115926;
    }
    
    const pinkSrc = audioCtx.createBufferSource();
    pinkSrc.buffer = pinkBuf;
    pinkSrc.loop = true;
    
    pinkFilter = audioCtx.createBiquadFilter();
    pinkFilter.type = 'lowpass';
    pinkFilter.frequency.value = 50; 
    
    pinkGain = audioCtx.createGain();
    pinkGain.gain.value = 0; 
    
    pinkSrc.connect(pinkFilter).connect(pinkGain).connect(masterGain);
    pinkSrc.start();

    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// Briefing Video Logic
briefingBtn.onclick = () => { 
    videoContainer.classList.remove('hidden'); 
    video.play(); 
};

video.onended = () => { 
    videoContainer.classList.add('hidden'); 
};

// Start Calibration Logic
startBtn.onclick = () => {
    if (!audioCtx) initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    mainUi.style.display = 'none';
    vesselCanvas.style.display = 'block';
    hud.style.display = 'block';
    
    startCalibration();
};

function startCalibration() {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: vesselCanvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight); 
    camera.position.z = 5;
    
    // Initial Colors: Gold background, Indigo rings
    scene.background = new THREE.Color(0xd4af37); 
    const material = new THREE.MeshBasicMaterial({ color: 0x4b5bdc, wireframe: true }); 
    const group = new THREE.Group();
    
    // 3D Gyroscope Setup
    for(let i = 1; i <= 4; i++) {
        const torus = new THREE.Mesh(new THREE.TorusGeometry(i * 0.6, 0.05, 16, 100), material);
        torus.rotation.x = Math.random() * Math.PI; 
        group.add(torus);
    }
    scene.add(group);

    let startTime = Date.now();
    
    function animate() {
        let elapsed = Date.now() - startTime;
        let pct = Math.min(elapsed / SESSION_LIMIT, 1);

        group.children.forEach((r, i) => { 
            r.rotation.x += 0.002 * (i + 1);
            r.rotation.y += 0.003 * (i + 1);
        });
        
        const rem = Math.max(0, SESSION_LIMIT - elapsed);
        const mins = Math.floor(rem / 60000);
        const secs = Math.floor((rem % 60000) / 1000).toString().padStart(2, '0');
        timerText.textContent = `${mins}:${secs}`;
        timeFill.style.width = (pct * 100) + "%";

        // Color and Audio Transition Logic
        if (pct <= MARK_555) {
            sataGain.gain.value = 0.5;
            pinkGain.gain.value = 0;
        } else {
            let codaPct = (pct - MARK_555) / (1 - MARK_555);
            
            sataGain.gain.value = 0.5 * (1 - codaPct);
            pinkGain.gain.value = 0.8 * codaPct;
            
            pinkFilter.frequency.value = 50 + (3500 * codaPct);
            
            scene.background.lerp(new THREE.Color(0x05070f), 0.01);
            material.color.lerp(new THREE.Color(0xd4af37), 0.01);
        }

        if (pct >= 1) { 
            masterGain.gain.setTargetAtTime(0, audioCtx.currentTime, 1);
            document.getElementById('endReveal').classList.add('show'); 
            return; 
        }
        
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }
    animate();
}

// Form Navigation Logic
const openFormBtn = document.getElementById('openFormBtn');
const closeFormBtn = document.getElementById('closeFormBtn');
const endReveal = document.getElementById('endReveal');
const formReveal = document.getElementById('formReveal');

if (openFormBtn) {
    openFormBtn.onclick = () => {
        endReveal.classList.remove('show');
        formReveal.classList.add('show');
    };
}

if (closeFormBtn) {
    closeFormBtn.onclick = () => {
        formReveal.classList.remove('show');
        endReveal.classList.add('show');
    };
}
