const circle = document.getElementById('ritualCircle');
const startBtn = document.getElementById('startBtn');
const meter = document.getElementById('meterFill');
const status = document.getElementById('statusText');
const timerText = document.getElementById('timerText');
const dialog = document.getElementById('completionDialog');
const giftDialog = document.getElementById('giftDialog');

let active = false;
let start = 0;
let tick = null;
let audioCtx, master, toneOsc, filter, lfo, lfoGain;
let streak = Number(localStorage.getItem('sata_coda_streak') || 0);
let points = Number(localStorage.getItem('sata_coda_points') || 0);

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

function saveRewards() {
  localStorage.setItem('sata_coda_streak', streak);
  localStorage.setItem('sata_coda_points', points);
}

function blendColor(a, b, t) {
  const c = x => Math.round(x);
  return `rgb(${c(a[0] + (b[0] - a[0]) * t)}, ${c(a[1] + (b[1] - a[1]) * t)}, ${c(a[2] + (b[2] - a[2]) * t)})`;
}

function update() {
  const elapsed = Date.now() - start;
  const remaining = Math.max(0, DURATION - elapsed);
  const pct = Math.min(100, (elapsed / DURATION) * 100);
  const t = pct / 100;
  const indigo = [75, 91, 220];
  const gold = [245, 197, 66];
  const mixed = blendColor(indigo, gold, t);

  meter.style.width = `${pct}%`;
  meter.style.background = `linear-gradient(90deg, ${blendColor(indigo, indigo, t)}, ${blendColor(indigo, gold, t)})`;
  circle.style.background = `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.20), transparent 18%), radial-gradient(circle at 35% 35%, rgba(255,255,255,0.14), transparent 40%), radial-gradient(circle at 50% 50%, ${blendColor([75,91,220,0.5], [245,197,66,0.5], t)}, ${blendColor([75,91,220,0.98], [245,197,66,0.98], t)})`;
  circle.style.boxShadow = `inset 0 10px 24px rgba(255,255,255,0.16), inset 0 -18px 28px rgba(0,0,0,0.24), 0 0 0 14px ${blendColor([75,91,220,0.12], [245,197,66,0.14], t)}, 0 0 0 28px ${blendColor([75,91,220,0.06], [245,197,66,0.07], t)}, 0 0 60px ${blendColor([75,91,220,0.48], [245,197,66,0.5], t)}`;
  timerText.textContent = format(remaining);
  timerText.style.color = mixed;
  status.textContent = remaining > 0 ? 'Calming the mind. Observe the signal.' : 'Experience complete. Return to stillness.';

  if (remaining <= 0 && active) {
    active = false;
    document.body.classList.remove('coda');
    status.textContent = 'SATA-CODA calibration is completed.';
    clearInterval(tick);
    if (master) master.gain.setTargetAtTime(0.0001, audioCtx.currentTime, 0.03);
    points += 10;
    streak += 1;
    saveRewards();
    if (dialog && !dialog.open) dialog.showModal();
    if (streak > 0 && streak % 77 === 0 && giftDialog && !giftDialog.open) giftDialog.showModal();
  }
}

function startExperience() {
  active = true;
  document.body.classList.add('coda');
  status.textContent = 'Calming the mind. Observe the signal.';
  start = Date.now();
  ensureAudio();
  if (audioCtx?.state === 'suspended') audioCtx.resume();
  circle.classList.add('core-pulse');
  timerText.classList.add('timer-pulse');
  pulseBeat();
  clearInterval(tick);
  tick = setInterval(update, 120);
  update();
}

startBtn.addEventListener('click', startExperience);

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

