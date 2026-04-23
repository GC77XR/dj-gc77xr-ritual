document.addEventListener('DOMContentLoaded', () => {
    const BPM = 118;
    const BEAT_INTERVAL = 60 / BPM;
    const SESSION_LIMIT = 11 * 60;
    const MICRO_HAUS_FADE_IN_AT = SESSION_LIMIT - 18;

    let audioCtx, timerStart, nextBeatTime;
    let appState = 'LOBBY';
    let microHausShown = false;
    let endNosShown = false;

    const canvas = document.getElementById('vesselCanvas');
    const startBtn = document.getElementById('startButton');
    const resetButton = document.getElementById('resetButton');
    const hud = document.getElementById('hud');
    const timerEl = document.getElementById('timer');
    const percentEl = document.getElementById('percent');
    const mainUI = document.getElementById('main-ui');
    const overlay = document.getElementById('overlay');
    const finalState = document.getElementById('finalState');
    const microHausReveal = document.getElementById('microHausReveal');
    const endNosReveal = document.getElementById('endNosReveal');

    if (!canvas || !startBtn || !resetButton || !hud || !timerEl || !percentEl || !mainUI || !overlay || !finalState || !microHausReveal || !endNosReveal) {
        console.error('Missing required DOM elements.');
        return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 1);

    const coreGeo = new THREE.CircleGeometry(0.25, 64);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xffb300, transparent: true, opacity: 0.95 });
    const core = new THREE.Mesh(coreGeo, coreMat);
    scene.add(core);

    const createArc = (radius, op, speed) => {
        const geo = new THREE.TorusGeometry(radius, 0.01, 2, 100, Math.PI * 1.5);
        const mat = new THREE.MeshBasicMaterial({ color: 0xff6a00, transparent: true, opacity: op });
        const mesh = new THREE.Mesh(geo, mat);
        scene.add(mesh);
        return { mesh, speed };
    };

    const arcs = [
        createArc(1.1, 0.75, 0.012),
        createArc(1.4, 0.35, -0.006)
    ];

    camera.position.z = 3;

    function initAudio() {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
    }

    function playHeartbeat(time) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(55, time);
        gain.gain.setValueAtTime(0.7, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(time);
        osc.stop(time + 0.12);
    }

    function showMicroHaus() {
        if (microHausShown) return;
        microHausShown = true;
        microHausReveal.classList.add('show');
    }

    function showEndNos() {
        if (endNosShown) return;
        endNosShown = true;
        endNosReveal.classList.add('show');
    }

    function animate() {
        requestAnimationFrame(animate);

        if (appState === 'ACTIVE') {
            arcs.forEach(a => a.mesh.rotation.z += a.speed);

            const pulse = 1 + Math.sin(Date.now() * 0.004) * 0.08;
            core.scale.set(pulse, pulse, 1);

            while (nextBeatTime < audioCtx.currentTime + 0.1) {
                playHeartbeat(nextBeatTime);
                nextBeatTime += BEAT_INTERVAL;
            }

            const elapsed = (Date.now() - timerStart) / 1000;
            const remaining = Math.max(0, SESSION_LIMIT - elapsed);

            timerEl.innerText = `${Math.floor(remaining / 60)}:${Math.floor(remaining % 60).toString().padStart(2, '0')}`;
            percentEl.innerText = Math.floor((elapsed / SESSION_LIMIT) * 100);

            if (elapsed >= MICRO_HAUS_FADE_IN_AT && !microHausShown) {
                showMicroHaus();
            }

            if (elapsed >= SESSION_LIMIT) {
                appState = 'END';
                core.material.color.set(0xffffff);
                arcs.forEach(a => a.mesh.material.color.set(0xffffff));
                finalState.style.display = 'flex';
                showEndNos();
            }
        }

        renderer.render(scene, camera);
    }

    function startExperience() {
        initAudio();
        nextBeatTime = audioCtx.currentTime;
        timerStart = Date.now();
        appState = 'ACTIVE';

        mainUI.classList.add('boot-flicker');
        setTimeout(() => {
            mainUI.classList.remove('boot-flicker');
            document.body.classList.add('is-active');
            overlay.style.display = 'none';
            hud.style.display = 'block';
        }, 400);
    }

    startBtn.addEventListener('click', startExperience);

    resetButton.addEventListener('click', () => {
        window.location.reload();
    });

    animate();
});
