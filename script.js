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

let audioCtx, masterGain, osc1, osc2;

// Smooth Audio Strategy
function initAudio() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    
    // Smooth fade in
    masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 2);
    masterGain.connect(audioCtx.destination);
    
    // Create a deep, smooth drone instead of harsh static
    osc1 = audioCtx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 110; // Low frequency hum
    
    osc2 = audioCtx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 114; // Slight offset for a pulse effect
    
    osc1.connect(masterGain);
    osc2.connect(masterGain);
    
    osc1.start();
    osc2.start();

    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// Video Logic
briefingBtn.onclick = () => { 
    videoContainer.classList.remove('hidden'); 
    video.play(); 
};

video.onended = () => { 
    videoContainer.classList.add('hidden'); 
};

// Calibration Logic
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
    scene.background = new THREE.Color(0x05070f);

    const material = new THREE.MeshBasicMaterial({ color: 0x4b5bdc });
    const group = new THREE.Group();
    
    group.add(new THREE.Mesh(new THREE.CircleGeometry(0.08, 32), material));
    for(let i = 1; i <= 4; i++) {
        const r = new THREE.Mesh(new THREE.RingGeometry(i * 0.4, i * 0.42, 64), material);
        group.add(r);
    }
    scene.add(group);

    let startTime = Date.now();
    
    function animate() {
        let elapsed = Date.now() - startTime;
        let pct = Math.min(elapsed / SESSION_LIMIT, 1);

        group.children.forEach((r, i) => { if(i > 0) r.rotation.z += 0.005 * i; });
        
        const rem = Math.max(0, SESSION_LIMIT - elapsed);
        const mins = Math.floor(rem / 60000);
        const secs = Math.floor((rem % 60000) / 1000).toString().padStart(2, '0');
        timerText.textContent = `${mins}:${secs}`;
        timeFill.style.width = (pct * 100) + "%";

        // Color transition at 5:55
        if (pct > MARK_555) {
            scene.background.lerp(new THREE.Color(0xf5c542), 0.01);
            material.color.lerp(new THREE.Color(0xff8a1e), 0.01);
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
