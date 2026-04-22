const circle = document.getElementById('ritualCircle');
const label = document.getElementById('circleLabel');
const meter = document.getElementById('meterFill');
const status = document.getElementById('statusText');
const timerText = document.getElementById('timerText');

let active = false;
let start = 0;
let tick = null;
let audioCtx, master, modOsc, modGain, toneOsc;

const DURATION = 11 * 60 * 1000;

function ensureAudio() {
  if (audioCtx) return;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;

  audioCtx = new Ctx();
  master = audioCtx.createGain();
  master.gain.value = 0.0001;

  modOsc = audioCtx.createOscillator();
  modGain = audioCtx.createGain();
  toneOsc = audioCtx.createOscillator();

  modOsc.type = 'sine';
  toneOsc.type = 'sine';

  modOsc.frequency.value = 0.08;
  modGain.gain.value = 0.012;
  toneOsc.frequency.value = 118;

  modOsc.connect(modGain).connect(master.gain);
  toneOsc.connect(master).connect(audioCtx.destination);

  modOsc.start();
  toneOsc.start();
}

function pulseShape() {
  if (!audioCtx || !master || !active) return;

  const now = audioCtx.currentTime;
  const soft = 0.012;
  const wave = 0.018;

  master.gain.cancelScheduledValues(now);
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(soft + wave, now + 0.08);
  master.gain.exponentialRampToValueAtTime(soft, now + 0.26);

  setTimeout(pulseShape, 510);
}

function format(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = String(Math.floor(s / 60)).padStart(2, '0');
  const r = String(s % 60).padStart(2, '0');
  return `${m}:${r}`;
}

function update() {
  const elapsed = Date.now() - start;
  const remaining = Math.max(0, DURATION - elapsed);
  const pct = Math.min(100, (elapsed / DURATION) * 100);

  document.documentElement.style.setProperty('--p', pct.toFixed(2));
  meter.style.width = `${pct}%`;
  timerText.textContent = format(remaining);

  if (active) status.textContent = remaining > 0 ? 'Calming the mind. Observe the signal.' : 'Experience complete. Return to stillness.';

  if (remaining <= 0 && active) {
    active = false;
    document.body.classList.remove('coda');
    label.textContent = 'SATA';
    clearInterval(tick);
    if (master) master.gain.setTargetAtTime(0.0001, audioCtx.currentTime, 0.03);
  }
}

function startExperience() {
  active = true;
  document.body.classList.add('coda');
  label.textContent = 'CODA';
  status.textContent = 'Calming the mind. Observe the signal.';
  start = Date.now();

  ensureAudio();
  if (audioCtx?.state === 'suspended') audioCtx.resume();

  pulseShape();
  clearInterval(tick);
  tick = setInterval(update, 250);
  update();
}

circle.addEventListener('click', () => {
  if (!active) startExperience();
  else {
    active = false;
    document.body.classList.remove('coda');
    label.textContent = 'SATA';
    status.textContent = 'Quiet indigo state. Tap to begin.';
    meter.style.width = '0%';
    timerText.textContent = '11:00';
    clearInterval(tick);
    if (master) master.gain.setTargetAtTime(0.0001, audioCtx.currentTime, 0.03);
  }
});

circle.addEventListener('pointermove', (e) => {
  if (e.buttons !== 1) return;
  const rect = circle.getBoundingClientRect();
  const x = e.clientX - rect.left - rect.width / 2;
  const y = e.clientY - rect.top - rect.height / 2;
  const distance = Math.min(Math.sqrt(x * x + y * y), rect.width / 2);
  const pct = Math.round((distance / (rect.width / 2)) * 100);
  document.documentElement.style.setProperty('--p', pct);
  if (pct > 58 && !active) startExperience();
});

circle.addEventListener('pointerdown', (e) => circle.setPointerCapture(e.pointerId));
update();
