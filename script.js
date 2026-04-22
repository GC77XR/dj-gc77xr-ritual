const circle = document.getElementById('ritualCircle');
const startBtn = document.getElementById('startBtn');
const backBtn = document.getElementById('backBtn');
const meter = document.getElementById('meterFill');
const status = document.getElementById('statusText');
const timerText = document.getElementById('timerText');
const dialog = document.getElementById('completionDialog');
const giftDialog = document.getElementById('giftDialog');
const mainCard = document.getElementById('mainCard');
const completionScreen = document.getElementById('completionScreen');
const circleShell = document.getElementById('circleShell');

let active = false;
let start = 0;
let tick = null;
let audioCtx, master, toneOsc, filter, lfo, lfoGain, whiteGain, pinkGain, bufferSrc, pinkNode;
let streak = Number(localStorage.getItem('sata_coda_streak') || 0);
let points = Number(localStorage.getItem('sata_coda_points') || 0);

const DURATION = 11 * 60 * 1000;
const SWITCH_AT = 5.5 * 60 * 1000;

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
  whiteGain = audioCtx.createGain();
  pinkGain = audioCtx.createGain();
  bufferSrc = audioCtx.createBufferSource();
  pinkNode = audioCtx.createScriptProcessor(4096, 1, 1);

  toneOsc.type = 'sine';
  toneOsc.frequency.value = 118;
  filter.type = 'lowpass';
  filter.frequency.value = 760;
  filter.Q.value = 0.9;
  master.gain.value = 0.0001;
  whiteGain.gain.value = 0.03;
  pinkGain.gain.value = 0.0001;

  lfo.type = 'sine';
  lfo.frequency.value = 1.96;
  lfoGain.gain.value = 22;
  lfo.connect(lfoGain).connect(filter.frequency);
  toneOsc.connect(filter).connect(master);

  const whiteBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 2, audioCtx.sampleRate);
  const whiteData = whiteBuffer.getChannelData(0);
  for (let i = 0; i < whiteData.length; i++) whiteData[i] = Math.random() * 2 - 1;
  bufferSrc.buffer = whiteBuffer;
  bufferSrc.loop = true;
  bufferSrc.connect(whiteGain).connect(master);

  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  pinkNode.onaudioprocess = function(e) {
    const out = e.outputBuffer.getChannelData(0);
    for (let i = 0; i < out.length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      out[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
  };
  pinkNode.connect(pinkGain).connect(master);

  toneOsc.start();
  lfo.start();
  bufferSrc.start();
}

function pulseBeat() {
  if (!audioCtx || !master || !active) return;
  const now = audioCtx.currentTime;
  master.gain.cancelScheduledValues(now);
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.035, now + 0.04);
  master.gain.exponentialRampToValueAtTime(0.012, now + 0.18);
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

function updateNoiseMix(elapsed) {
  const fade = Math.max(0, Math.min(1, (elapsed - SWITCH_AT) / 1000));
  if (whiteGain && pinkGain) {
    whiteGain.gain.value = elapsed < SWITCH_AT ? 0.03 : Math.max(0, 0.03 * (1 - fade));
    pinkGain.gain.value = elapsed < SWITCH_AT ? 0.0001 : Math.min(0.03, 0.0001 + 0.03 * fade);
  }
}

function finishExperience() {
  active = false;
  document.body.classList.remove('coda');
  clearInterval(tick);
  if (master) master.gain.setTargetAtTime(0.0001, audioCtx.currentTime, 0.03);
  if (toneOsc) toneOsc.stop?.();
  if (lfo) lfo.stop?.();
  if (bufferSrc) bufferSrc.stop?.();
  if (pinkNode) pinkNode.disconnect();
  points += 10;
  streak += 1;
  saveRewards();
  circle.classList.remove('core-pulse');
  timerText.classList.remove('timer-pulse');
  circleShell.classList.add('hidden');
  mainCard.querySelector('.rewards').style.display = 'none';
  mainCard.querySelector('.guides').style.display = 'none';
  mainCard.querySelector('.disclaimer').style.display = 'none';
  status.textContent = 'SATA-CODA calibration is completed.';
  if (dialog && !dialog.open) dialog.showModal();
  if (streak > 0 && streak % 77 === 0 && giftDialog && !giftDialog.open) giftDialog.showModal();
}

function update() {
  const elapsed = Date.now() - start;
  const remaining = Math.max(0, DURATION - elapsed);
  const pct = Math.min(100, (elapsed / DURATION) * 100);
  const t = pct / 100;
  const indigo = [75, 91, 220];
  const gold = [245, 197, 66];
  const mixed = blendColor(indigo, gold, t);

  updateNoiseMix(elapsed);
  meter.style.width = `${pct}%`;
  meter.style.background = `linear-gradient(90deg, ${blendColor(indigo, indigo, t)}, ${blendColor(indigo, gold, t)})`;
  circle.style.background = `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.20), transparent 18%), radial-gradient(circle at 35% 35%, rgba(255,255,255,0.14), transparent 40%), radial-gradient(circle at 50% 50%, ${blendColor([75,91,220,0.5], [245,197,66,0.5], t)}, ${blendColor([75,91,220,0.98], [245,197,66,0.98], t)})`;
  circle.style.boxShadow = `inset 0 10px 24px rgba(255,255,255,0.16), inset 0 -18px 28px rgba(0,0,0,0.24), 0 0 0 14px ${blendColor([75,91,220,0.12], [245,197,66,0.14], t)}, 0 0 0 28px ${blendColor([75,91,220,0.06], [245,197,66,0.07], t)}, 0 0 60px ${blendColor([75,91,220,0.48], [245,197,66,0.5], t)}`;
  timerText.textContent = format(remaining);
  timerText.style.color = mixed;
  status.textContent = remaining > 0 ? 'Calming the mind. Observe the signal.' : 'Experience complete. Return to stillness.';

  if (remaining <= 0 && active) finishExperience();
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
backBtn.addEventListener('click', () => {
  completionScreen.classList.remove('show');
  completionScreen.classList.add('hidden');
  mainCard.style.display = 'block';
  circleShell.classList.remove('hidden');
  mainCard.querySelector('.rewards').style.display = 'grid';
  mainCard.querySelector('.guides').style.display = 'grid';
  mainCard.querySelector('.disclaimer').style.display = 'block';
  status.textContent = 'Ready. Press START HERE.';
  timerText.textContent = '11:00';
  meter.style.width = '0%';
  meter.style.background = 'linear-gradient(90deg, var(--indigo), var(--gold))';
});

circle.addEventListener('pointermove', (e) => {
  const rect = circle.getBoundingClientRect();
  const x = e.clientX - rect.left - rect.width / 2;
  const y = e.clientY - rect.top - rect.height / 2;
  const distance = Math.min(Math.sqrt(x * x + y * y), rect.width / 2);
  const pct = Math.round((distance / (rect.width / 2)) * 100);
  document.documentElement.style.setProperty('--p', pct);
  circle.style.transform = `rotateX(${16 - pct / 18}deg) rotateY(${pct / 20 - 18}deg) scale(${1 + pct / 800})`;
});

circle.addEventListener('pointerleave', () => { circle.style.transform = 'rotateX(16deg) rotateY(-18deg)'; });
circle.addEventListener('pointerdown', (e) => circle.setPointerCapture(e.pointerId));

dialog?.addEventListener('close', () => {
  mainCard.style.display = 'none';
  completionScreen.classList.add('show');
  completionScreen.classList.remove('hidden');
  status.textContent = 'Completed.';
});

update();
