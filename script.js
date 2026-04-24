// output/script.js
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
  const microHausImg = microHausReveal ? microHausReveal.querySelector('img') : null;
  const endNosImg = endNosReveal ? endNosReveal.querySelector('img') : null;
  if (!canvas || !startButton || !resetButton || !hud || !timerEl || !percentEl || !timeFill || !statusLine || !mainUi || !microHausReveal || !endNosReveal) return;

  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  let audioCtx = null, master = null, pulseTimer = null;
  let whiteGainNode = null, pinkGainNode = null;
  let timerStart = 0, appState = 'LOBBY', microHausShown = false, endNosShown = false;

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

  const makeRing = (radius, opacity, speed) => {
    const geo = new THREE.TorusGeometry(radius, 0.01, 2, 96, Math.PI * 1.5);
    const mat = new THREE.MeshBasicMaterial({ color: 0x4b5bdc, transparent: true, opacity });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);
    return { mesh, speed };
  };
  const rings = [makeRing(1.1, 0.72, 0.012), makeRing(1.4, 0.32, -0.006)];

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const mix = (a, b, t) => Math.round(a + (b - a) * t);
  const colorMix = (c1, c2, t) => `rgb(${mix(c1[0], c2[0], t)}, ${mix(c1[1], c2[1], t)}, ${mix(c1[2], c2[2], t)})`;
  const indigo = [75, 91, 220];
  const gold = [245, 197, 66];
  const fire = [255, 138, 30];

  function formatTime(ms) {
    const total = Math.max(0, Math.ceil(ms / 1000));
    const m = String(Math.floor(total / 60)).padStart(2, '0');
    const s = String(total % 60).padStart(2, '0');
    return `${m}:${s}`;
  }

  function ensureAudio() {
    if (!AudioContextCtor) return false;
    if (!audioCtx) audioCtx = new AudioContextCtor();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (master) return true;

    master = audioCtx.createGain();
    master.gain.value = 0.0001;
    master.connect(audioCtx.destination);

    const oscillator = audioCtx.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.value = 58;
    const oscillatorGain = audioCtx.createGain();
    oscillatorGain.gain.value = 0.04;
    oscillator.connect(oscillatorGain).connect(master);

    const drift = audioCtx.createOscillator();
    drift.type = 'sine';
    drift.frequency.value = 0.12;
    const driftGain = audioCtx.createGain();
    driftGain.gain.value = 8;
    drift.connect(driftGain).connect(oscillator.frequency);

    const makeNoise = () => {
      const buf = audioCtx.createBuffer(1, audioCtx.sampleRate, audioCtx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      return buf;
    };

    const whiteSrc = audioCtx.createBufferSource();
    whiteSrc.buffer = makeNoise();
    whiteSrc.loop = true;
    whiteGainNode = audioCtx.createGain();
    whiteGainNode.gain.value = 0.025;
    whiteSrc.connect(whiteGainNode).connect(master);

    const pinkSrc = audioCtx.createBufferSource();
    pinkSrc.buffer = makeNoise();
    pinkSrc.loop = true;
    const pinkFilter1 = audioCtx.createBiquadFilter();
    pinkFilter1.type = 'lowpass';
    pinkFilter1.frequency.value = 1500;
    pinkFilter1.Q.value = 0.7;
    const pinkFilter2 = audioCtx.createBiquadFilter();
    pinkFilter2.type = 'lowpass';
    pinkFilter2.frequency.value = 650;
    pinkFilter2.Q.value = 0.8;
    pinkGainNode = audioCtx.createGain();
    pinkGainNode.gain.value = 0.0001;
    pinkSrc.connect(pinkFilter1).connect(pinkFilter2).connect(pinkGainNode).connect(master);

    oscillator.start();
    drift.start();
    whiteSrc.start();
    pinkSrc.start();
    return true;
  }

  function schedulePulse() {
    if (!audioCtx || appState !== 'ACTIVE') return;
    const now = audioCtx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.07, now + 0.02);
    master.gain.exponentialRampToValueAtTime(0.025, now + 0.16);
    pulseTimer = setTimeout(schedulePulse, 60000 / BPM * 1.05);
  }

  function updateVisuals(elapsed) {
    const t = clamp(elapsed / SESSION_LIMIT, 0, 1);
    const warmT = clamp((elapsed - SESSION_LIMIT * 0.22) / (SESSION_LIMIT * 0.78), 0, 1);
    const coreColor = colorMix(indigo, gold, t);
    const arcColor = colorMix(indigo, gold, warmT);
    core.material.color.set(coreColor);
    rings.forEach(r => r.mesh.material.color.set(arcColor));
    timeFill.style.width = `${t * 100}%`;
    timeFill.style.background = `linear-gradient(90deg, ${colorMix(indigo, [255,255,255], t * 0.25)} 0%, ${colorMix(indigo, gold, t)} 55%, ${colorMix(gold, fire, t)} 100%)`;
    document.body.style.background = t < 0.5 ? 'radial-gradient(circle at top, #11183a 0%, #f5c542 56%)' : 'radial-gradient(circle at top, #f5c542 0%, #11183a 56%)';
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
  }

  function finishExperience() {
    appState = 'END';
    clearTimeout(pulseTimer);
    if (master && audioCtx) master.gain.setTargetAtTime(0.0001, audioCtx.currentTime, 0.04);
    showEndNos();
    document.body.classList.remove('is-active');
    hud.classList.add('hidden');
    statusLine.textContent = 'STATUS: COMPLETE // RESET - IGNITE - INTEGRATE';
  }

  function update() {
    requestAnimationFrame(update);
    if (appState !== 'ACTIVE') { renderer.render(scene, camera); return; }
    const elapsed = Date.now() - timerStart;
    const remaining = Math.max(0, SESSION_LIMIT - elapsed);
    const pct = clamp((elapsed / SESSION_LIMIT) * 100, 0, 100);
    rings.forEach(r => r.mesh.rotation.z += r.speed);
    const pulse = 1 + Math.sin(Date.now() * 0.004) * 0.08;
    core.scale.set(pulse, pulse, 1);
    timerEl.textContent = formatTime(remaining);
    percentEl.textContent = Math.floor(pct);
    statusLine.textContent = `STATUS: CALIBRATING // ${timerEl.textContent} // ${Math.floor(pct)}% COMPLETE`;
    if (audioCtx && master) {
      const whiteAmt = clamp(1 - t, 0, 1);
      const pinkAmt = clamp(t, 0, 1);
      whiteGainNode.gain.setTargetAtTime(0.028 * whiteAmt, audioCtx.currentTime, 0.05);
      pinkGainNode.gain.setTargetAtTime(0.045 * pinkAmt, audioCtx.currentTime, 0.05);
      master.gain.setTargetAtTime(0.05, audioCtx.currentTime, 0.02);
    }
    updateVisuals(elapsed);
    if (elapsed >= MICRO_HAUS_FADE_AT) showMicroHaus();
    if (elapsed >= SESSION_LIMIT) {
      timerEl.textContent = '00:00';
      percentEl.textContent = '100';
      finishExperience();
    }
    renderer.render(scene, camera);
  }

  function startExperience() {
    if (!ensureAudio()) return;
    timerStart = Date.now();
    appState = 'ACTIVE';
    hud.classList.remove('hidden');
    document.body.classList.add('is-active');
    statusLine.textContent = 'STATUS: CALIBRATING // 11:00 // 0% COMPLETE';
    startButton.disabled = true;
    schedulePulse();
  }

  startButton.addEventListener('click', startExperience);
  resetButton.addEventListener('click', () => window.location.reload());
  window.addEventListener('resize', () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); });
  update();
});
