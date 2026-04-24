// === PRODUCTION LOGIC ===
const TEST_MODE = false; 
const SESSION_LIMIT = TEST_MODE ? 10000 : 660000; 
const MARK_555 = 355 / 660; 

const briefingBtn = document.getElementById('briefingBtn');
const startBtn = document.getElementById('startBtn');
const video = document.getElementById('briefingVideo');
const timerEl = document.getElementById('timer');
const timeFill = document.getElementById('timeFill');

let audioCtx, masterGain, whiteGain, pinkGain;

function initAudio() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.connect(audioCtx.destination);
    
    // White Noise (SATA)
    const whiteBuf = audioCtx.createBuffer(1, audioCtx.sampleRate*2, audioCtx.sampleRate);
    const d = whiteBuf.getChannelData(0);
    for(let i=0; i<d.length; i++) d[i]=Math.random()*2-1;
    
    const whiteSrc = audioCtx.createBufferSource();
    whiteSrc.buffer = whiteBuf; whiteSrc.loop = true;
    whiteGain = audioCtx.createGain();
    whiteGain.gain.value = 0.4;
    whiteSrc.connect(whiteGain).connect(masterGain);
    whiteSrc.start();

    // Pink Noise (CODA)
    pinkGain = audioCtx.createGain();
    pinkGain.gain.value = 0;
    const pinkNode = audioCtx.createScriptProcessor(4096, 1, 1);
    let b0=0, b1=0, b2=0, b3=0, b4=0, b5=0, b6=0;
    pinkNode.onaudioprocess = (e) => {
        const out = e.outputBuffer.getChannelData(0);
        for (let i=0; i<4096; i++) {
            const w = Math.random()*2-1;
            b0=0.99886*b0+w*0.0555179; b1=0.99332*b1+w*0.0750759; b2=0.969*b2+w*0.153852;
            b3=0.8665*b3+w*0.3104856; b4=0.55*b4+w*0.5329522; b5=-0.7616*b5-w*0.016898;
            out[i]=(b0+b1+b2+b3+b4+b5+b6+w*0.5362)*0.11; b6=w*0.115926;
        }
    };
    pinkNode.connect(pinkGain).connect(masterGain);
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

briefingBtn.onclick = () => { document.getElementById('videoContainer').classList.remove('hidden'); video.play(); };
video.onended = () => { document.getElementById('videoContainer').classList.add('hidden'); briefingBtn.classList.add('hidden'); startBtn.classList.remove('hidden'); };

startBtn.onclick = () => {
    try {
        initAudio();
        document.getElementById('mainUi').classList.add('hidden');
        document.getElementById('vesselCanvas').style.display = 'block';
        document.getElementById('hud').classList.remove('hidden');
        startCalibration();
    } catch (e) { console.error("Ritual Start Error:", e); }
};

function startCalibration() {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: vesselCanvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.position.z = 5;
    scene.background = new THREE.Color(0x05070f);

    const material = new THREE.MeshBasicMaterial({ color: 0x4b5bdc });
    const group = new THREE.Group();
    // THE VESSEL: Center point + 4 rings
    group.add(new THREE.Mesh(new THREE.CircleGeometry(0.1, 32), material));
    for(let i=1; i<=4; i++) {
        group.add(new THREE.Mesh(new THREE.RingGeometry(i*0.4, i*0.42, 64), material));
    }
    scene.add(group);

    let startTime = Date.now();
    function animate() {
        let elapsed = Date.now() - startTime;
        let pct = Math.min(elapsed / SESSION_LIMIT, 1);

        group.children.forEach((r, i) => { if(i>0) r.rotation.z += 0.005 * i; });
        const rem = Math.max(0, SESSION_LIMIT - elapsed);
        timerEl.textContent = `${Math.floor(rem/60000)}:${Math.floor((rem%60000)/1000).toString().padStart(2,'0')}`;
        timeFill.style.width = (pct * 100) + "%";

        // Sound & Color Transition
        whiteGain.gain.value = 0.4 * (1 - pct);
        pinkGain.gain.value = 0.4 * pct;

        if (pct > MARK_555) {
            let cPct = (pct - MARK_555) / (1 - MARK_555);
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
