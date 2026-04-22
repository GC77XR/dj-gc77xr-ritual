const circle = document.getElementById('ritualCircle');
const startBtn = document.getElementById('startBtn');
const meter = document.getElementById('meterFill');
const status = document.getElementById('statusText');
const timerText = document.getElementById('timerText');
const dialog = document.getElementById('completionDialog');

let active = false;
let start = 0;
let tick = null;
let audioCtx, master, toneOsc, filter, lfo, lfoGain;

const DURATION = 11 * 60 * 1000;

function ensureAudio() {
  if (audioCtx) return;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  audioCtx = new Ctx();
  master = audioCtx.createGain();
  filter = audioCtx.createBiquadFilter();
  toneOsc = audioCtx.createOscillator();
  lfo = audioCtx.createOscillator();
  lfoGain = audioCtx.createGain();

  toneOsc.type = 'sine';
  toneOsc.frequency.value = 118;
  filter.type = 'lowpass';
  filter.frequency.value = 760;
  filter.Q.value = 0.9;
  master.gain.value = 0.0001;

  lfo.type = 'sine';
  lfo.frequency.value = 1.96;
  lfoGain.gain.value = 66;
  lfo.connect(lfoGain).connect(filter.frequency);
  toneOsc.connect(filter).connect(master).connect(audioCtx.destination);

  toneOsc.start();
  lfo.start();
}

function pulseBeat() {
  if (!audioCtx || !master || !active) return;
  const now = audioCtx.currentTime;
  master.gain.cancelScheduledValues(now);
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.11, now + 0.05);
  master.gain.exponentialRampToValueAtTime(0.028, now + 0.18);
  setTimeout(pulseBeat, 508);
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
  const blend = pct;

  meter.style.width = `${pct}%`;
  meter.style.background = `linear-gradient(90deg, rgb(${Math.round(75 + blend*1.7)}, ${Math.round(91 + blend*1.1)}, ${Math.round(220 - blend*1.2)}), rgb(${Math.round(245 - blend*0.2)}, ${Math.round(197 - blend*0.05)}, ${Math.round(66 + blend*0.2)}))`;
  timerText.textContent = format(remaining);
  status.textContent = remaining > 0 ? 'Calming the mind. Observe the signal.' : 'Experience complete. Return to stillness.';

  if (remaining <= 0 && active) {
    active = false;
    document.body.classList.remove('coda');
    status.textContent = 'SATA-CODA calibration is completed.';
    clearInterval(tick);
    if (master) master.gain.setTargetAtTime(0.0001, audioCtx.currentTime, 0.03);
    if (dialog && !dialog.open) dialog.showModal();
  }
}

function startExperience() {
  active = true;
  document.body.classList.add('coda');
  status.textContent = 'Calming the mind. Observe the signal.';
  start = Date.now();
  ensureAudio();
  if (audioCtx?.state === 'suspended') audioCtx.resume();
  pulseBeat();
  clearInterval(tick);
  tick = setInterval(update, 250);
  update();
}

startBtn.addEventListener('click', startExperience);
circle.addEventListener('click', () => {});

circle.addEventListener('pointermove', (e) => {
  const rect = circle.getBoundingClientRect();
  const x = e.clientX - rect.left - rect.width / 2;
  const y = e.clientY - rect.top - rect.height / 2;
  const distance = Math.min(Math.sqrt(x * x + y * y), rect.width / 2);
  const pct = Math.round((distance / (rect.width / 2)) * 100);
  document.documentElement.style.setProperty('--p', pct);
  circle.style.transform = `rotateX(${16 - pct / 18}deg) rotateY(${pct / 20 - 18}deg) scale(${1 + pct / 800})`;
});

circle.addEventListener('pointerleave', () => {
  circle.style.transform = 'rotateX(16deg) rotateY(-18deg)';
});

circle.addEventListener('pointerdown', (e) => circle.setPointerCapture(e.pointerId));
update();
