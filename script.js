document.addEventListener('DOMContentLoaded', () => {
  const BPM = 118;
  const SESSION_LIMIT = 11 * 60 * 1000;
  const MICRO_HAUS_FADE_AT = SESSION_LIMIT - 18000;
  const canvas = document.getElementById('vesselCanvas');
  const startButton = document.getElementById('startButton');
  const resetButton = document.getElementById('resetButton');
  const hud = document.getElementById('hud');
  const timerEl = document.getElementById('timer');
  const percentEl = document.getElementById('percent');
  const timeFill = document.getElementById('timeFill');
  const statusLine = document.getElementById('statusLine');
  const mainUi = document.getElementById('mainUi');
  const microHausReveal = document.getElementById('microHausReveal');
  const endNosReveal = document.getElementById('endNosReveal');
  const circle = document.getElementById('startButton');
  const microHausImg = microHausReveal ? microHausReveal.querySelector('img') : null;
  const endNosImg = endNosReveal ? endNosReveal.querySelector('img') : null;

  if (!canvas || !startButton || !resetButton || !hud || !timerEl || !percentEl || !timeFill || !statusLine || !mainUi || !microHausReveal || !endNosReveal || !circle) {
    console.error('Missing required DOM elements.', { canvas, startButton, resetButton, hud, timerEl, percentEl, timeFill, statusLine, mainUi, microHausReveal, endNosReveal, circle });
    return;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  camera.position.z = 3;

  const coreGeo = new THREE.CircleGeometry(0.25, 64);
  const coreMat = new THREE.MeshBasicMaterial({ color: 0x4b5bdc, transparent: true, opacity: 0.95 });
  const core = new THREE.Mesh(coreGeo, coreMat);
  scene.add(core);

  const createArc = (radius, opacity, speed) => {
    const geo = new THREE.TorusGeometry(radius, 0.01, 2, 100, Math.PI * 1.5);
    const mat = new THREE.MeshBasicMaterial({ color: 0x4b5bdc, transparent: true, opacity });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);
    return { mesh, speed };
  };
  const arcs = [createArc(1.1, 0.72, 0.012), createArc(1.4, 0.32, -0.006)];

  let audioCtx = null, master = null, whiteGain = null, pinkGain = null, toneOsc = null, lfo = null, lfoGain = null, whiteBufferSource = null, pinkNode = null;
  let timerStart = 0, appState = 'LOBBY', microHausShown = false, endNosShown = false, pulseTimer = null;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const mix = (a, b, t) => Math.round(a + (b - a) * t);
  const colorMix = (c1, c2, t) => `rgb(${mix(c1[0], c2[0], t)}, ${mix(c1[1], c2[1], t)}, ${mix(c1[2], c2[2], t)})`;
  const indigo = [75, 91, 220];
  const gold = [245, 197, 66];
  const fire = [255, 138, 30];

  function formatTime(ms) { const total = Math.max(0, Math.ceil(ms / 1000)); const m = String(Math.floor(total / 60)).padStart(2, '0'); const s = String(total % 60).padStart(2, '0'); return `${m}:${s}`; }

  function ensureAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (master) return;
    master = audioCtx.createGain(); master.gain.value = 0.0001; master.connect(audioCtx.destination);
    toneOsc = audioCtx.createOscillator(); toneOsc.type = 'sine'; toneOsc.frequency.value = 58;
    const toneGain = audioCtx.createGain(); toneGain.gain.value = 0.02; toneOsc.connect(toneGain).connect(master);
    lfo = audioCtx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 1.66;
    lfoGain = audioCtx.createGain(); lfoGain.gain.value = 18; lfo.connect(lfoGain).connect(toneOsc.frequency);
    whiteGain = audioCtx.createGain(); whiteGain.gain.value = 0.03;
    whiteBufferSource = audioCtx.createBufferSource();
    const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 2, audioCtx.sampleRate);
    const data = buf.getChannelData(0); for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    whiteBufferSource.buffer = buf; whiteBufferSource.loop = true; whiteBufferSource.connect(whiteGain).connect(master);
    pinkGain = audioCtx.createGain(); pinkGain.gain.value = 0.0001;
    pinkNode = audioCtx.createScriptProcessor(4096, 1, 1);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    pinkNode.onaudioprocess = e => { const out = e.outputBuffer.getChannelData(0); for (let i = 0; i < out.length; i++) { const white = Math.random() * 2 - 1; b0 = 0.99886 * b0 + white * 0.0555179; b1 = 0.99332 * b1 + white * 0.0750759; b2 = 0.96900 * b2 + white * 0.1538520; b3 = 0.86650 * b3 + white * 0.3104856; b4 = 0.55000 * b4 + white * 0.5329522; b5 = -0.7616 * b5 - white * 0.0168980; out[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11; b6 = white * 0.115926; } };
    pinkNode.connect(pinkGain).connect(master);
    toneOsc.start(); lfo.start(); whiteBufferSource.start();
  }

  function schedulePulse() {
    if (!audioCtx || appState !== 'ACTIVE') return;
    const now = audioCtx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.03, now + 0.03);
    master.gain.exponentialRampToValueAtTime(0.010, now + 0.18);
    pulseTimer = setTimeout(schedulePulse, 60000 / BPM * 1.05);
  }

  function updateVisuals(elapsed) {
    const t = clamp(elapsed / SESSION_LIMIT, 0, 1);
    const warmT = clamp((elapsed - SESSION_LIMIT * 0.22) / (SESSION_LIMIT * 0.78), 0, 1);
    const coreColor = colorMix(indigo, gold, t);
    const arcColor = colorMix(indigo, gold, warmT);
    const fillColor = `linear-gradient(90deg, ${colorMix(indigo, [143, 91, 255], t * 0.7)} 0%, ${colorMix([143, 91, 255], gold, t)} 52%, ${colorMix(gold, fire, t)} 100%)`;
    core.material.color.set(coreColor); arcs.forEach(a => a.mesh.material.color.set(arcColor));
    timeFill.style.width = `${t * 100}%`; timeFill.style.background = fillColor;
    document.body.style.background = t < 0.5 ? 'radial-gradient(circle at top, #11183a 0%, #05070f 56%)' : 'radial-gradient(circle at top, #1c1807 0%, #05070f 56%)';
    circle.style.background = `radial-gradient(circle at 35% 30%, rgba(255,255,255,.22), transparent 18%), radial-gradient(circle at 50% 50%, ${colorMix(indigo, gold, t * 0.8)}, ${colorMix(gold, indigo, 1 - t)})`;
    circle.style.boxShadow = `inset 0 10px 24px rgba(255,255,255,.12), inset 0 -18px 28px rgba(0,0,0,.24), 0 0 0 10px rgba(75,91,220,${0.10 * (1 - t)}), 0 0 0 24px rgba(245,197,66,${0.06 + 0.10 * t}), 0 0 60px rgba(245,197,66,${0.20 + 0.18 * t})`;
  }

  function showMicroHaus() {
    if (microHausShown) return;
    microHausShown = true;
    microHausReveal.classList.remove('hidden');
    if (microHausImg) microHausImg.src = 'micro-haus.png';
    requestAnimationFrame(() => microHausReveal.classList.add('show'));
  }

  function showEndNos() {
    if (endNosShown) return;
    endNosShown = true;
    endNosReveal.classList.remove('hidden');
    if (endNosImg) endNosImg.src = 'end-NOS.png';
    requestAnimationFrame(() => endNosReveal.classList.add('show'));
    const a = document.createElement('a');
    a.href = 'about:blank';
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = 'OPEN DISCLOSURE WINDOW';
    a.id = 'disclosureLink';
    a.style.cssText = 'margin-top:12px;padding:12px 16px;border:1px solid rgba(255,255,255,.2);border-radius:12px;color:white;text-decoration:none;letter-spacing:.14em;text-transform:uppercase;background:rgba(75,91,220,.75)';
    endNosReveal.appendChild(a);
  }

  function finishExperience() {
    appState = 'END'; clearTimeout(pulseTimer);
    if (master && audioCtx) master.gain.setTargetAtTime(0.0001, audioCtx.currentTime, 0.04);
    showEndNos(); document.body.classList.remove('is-active'); hud.classList.add('hidden'); statusLine.textContent = 'STATUS: COMPLETE // RESET - IGNITE - INTEGRATE';
  }

  function update() {
    requestAnimationFrame(update);
    if (appState !== 'ACTIVE') { renderer.render(scene, camera); return; }
    const elapsed = Date.now() - timerStart;
    const remaining = Math.max(0, SESSION_LIMIT - elapsed);
    const pct = clamp((elapsed / SESSION_LIMIT) * 100, 0, 100);
    arcs.forEach(a => a.mesh.rotation.z += a.speed);
    const pulse = 1 + Math.sin(Date.now() * 0.004) * 0.08; core.scale.set(pulse, pulse, 1);
    timerEl.textContent = formatTime(remaining); percentEl.textContent = Math.floor(pct); statusLine.textContent = `STATUS: CALIBRATING // ${timerEl.textContent} // ${Math.floor(pct)}% COMPLETE`;
    if (whiteGain && pinkGain) { whiteGain.gain.value = 0.03 * (1 - pct / 108); pinkGain.gain.value = 0.0001 + 0.022 * (pct / 100); }
    updateVisuals(elapsed);
    if (elapsed >= MICRO_HAUS_FADE_AT) showMicroHaus();
    if (elapsed >= SESSION_LIMIT) { timerEl.textContent = '00:00'; percentEl.textContent = '100'; finishExperience(); }
    renderer.render(scene, camera);
  }

  function startExperience() {
    ensureAudio(); timerStart = Date.now(); appState = 'ACTIVE'; hud.classList.remove('hidden'); document.body.classList.add('is-active'); statusLine.textContent = 'STATUS: CALIBRATING // 11:00 // 0% COMPLETE'; startButton.disabled = true; startButton.style.cursor = 'default'; schedulePulse();
  }

  startButton.addEventListener('click', startExperience);
  resetButton.addEventListener('click', () => window.location.reload());
  window.addEventListener('resize', () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); });
  update();
});
