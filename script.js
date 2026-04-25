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

// 🎧 Initialize the external MP3 track
const ritualAudio = new Audio('sata-coda-master.mp3');

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
    // Play the MP3
    ritualAudio.play().catch(error => console.log("Audio playback failed:", error));
    
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
    
    // 📱 Screen Rotation Listener
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    // Initial Colors: Gold background, Indigo rings
    scene.background = new THREE.Color(0xd4af37); 
    const material = new THREE.MeshBasicMaterial({ color: 0x4b5bdc, wireframe: true }); 
    const group = new THREE.Group();
    
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

        // Color Transition Logic
        if (pct > MARK_555) {
            scene.background.lerp(new THREE.Color(0x05070f), 0.01);
            material.color.lerp(new THREE.Color(0xd4af37), 0.01);
        }

        // End Sequence
        if (pct >= 1) { 
            ritualAudio.pause(); // Stop audio in case the file runs slightly long
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
