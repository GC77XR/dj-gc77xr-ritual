const phaseLabel = document.getElementById('phaseLabel');
const phaseCopy = document.getElementById('phaseCopy');
const stateChip = document.getElementById('stateChip');
const freqValue = document.getElementById('freqValue');
const modeValue = document.getElementById('modeValue');
const quote = document.getElementById('quote');
const instruction = document.getElementById('instruction');
const dailyAction = document.getElementById('dailyAction');
const startBtn = document.getElementById('startBtn');
const soundBtn = document.getElementById('soundBtn');
const checkinBtn = document.getElementById('checkinBtn');
const resetBtn = document.getElementById('resetBtn');
const progressBar = document.getElementById('progressBar');
const streakValue = document.getElementById('streakValue');
const lastCheckin = document.getElementById('lastCheckin');
const canvas = document.getElementById('bg');
const ctx = canvas.getContext('2d');

let audioCtx = null;
let oscillator = null;
let gain = null;
let soundOn = false;
let state = 'sata';
let ritualTimer = null;
let breathTimer = null;
let breathStep = 0;
let particles = [];
let animId = null;

const breathPhases = [
  'Inhale for 4.',
  'Hold for 4.',
  'Exhale for 4.',
  'Observe for 4.'
];

const dailyPrompts = [
  "Today's action: breathe, focus, move.",
  "Today's action: complete one important task.",
  "Today's action: protect your calm.",
  "Today's action: act from clarity."
];

function nowKey() {
  return new Date().toISOString().slice(0, 10);
}

function loadStreak() {
  const data = JSON.parse(localStorage.getItem('gc77xr-streak') || '{}');
  return { count: data.count || 0, last: data.last || '' };
}

function saveStreak(data) {
  localStorage.setItem('gc77xr-streak', JSON.stringify(data));
}

function updateStreakUI() {
  const s = loadStreak();
  streakValue.textContent = s.count;
  lastCheckin.textContent = s.last === nowKey()
    ? 'Checked in today.'
    : (s.last ? 'Last check-in: ' + s.last : 'No check-in yet today.');
}

function checkIn() {
  const today = nowKey();
  const s = loadStreak();
  if (s.last === today) {
    lastCheckin.textContent = 'Already checked in today.';
    return;
  }
  s.count = s.last ? s.count + 1 : 1;
  s.last = today;
  saveStreak(s);
  updateStreakUI();
  dailyAction.textContent = 'Check-in saved. Keep the streak alive tomorrow.';
}

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function makeParticles() {
  particles = Array.from({ length: 70 }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    r: Math.random() * 1.7 + 0.4,
    vx: (Math.random() - 0.5) * 0.45,
    vy: (Math.random() - 0.5) * 0.45,
  }));
}

function drawBg() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  const isCoda = document.body.classList.contains('coda');

  const grad = ctx.createRadialGradient(
    window.innerWidth / 2,
    window.innerHeight * 0.16,
    40,
    window.innerWidth / 2,
    window.innerHeight * 0.16,
    window.innerWidth * 0.9
  );

  if (isCoda) {
    grad.addColorStop(0, 'rgba(255, 195, 86, 0.16)');
    grad.addColorStop(0.5, 'rgba(175, 94, 14, 0.08)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
  } else {
    grad.addColorStop(0, 'rgba(126, 141, 255, 0.16)');
    grad.addColorStop(0.5, 'rgba(34, 38, 104, 0.08)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
  }

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;

    if (p.x < -10) p.x = window.innerWidth + 10;
    if (p.x > window.innerWidth + 10) p.x = -10;
    if (p.y < -10) p.y = window.innerHeight + 10;
    if (p.y > window.innerHeight + 10) p.y = -10;

    ctx.beginPath();
    ctx.fillStyle = isCoda
      ? 'rgba(255, 210, 111, 0.32)'
      : 'rgba(158, 168, 255, 0.26)';
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  });

  animId = requestAnimationFrame(drawBg);
}

function setSata() {
  state = 'sata';
  document.body.classList.remove('coda');
  phaseLabel.textContent = 'SATA';
  phaseCopy.textContent = 'Sensory Attunement and Tranquility Activation';
  stateChip.textContent = 'QUIET';
  freqValue.textContent = 'Indigo Field';
  modeValue.textContent = 'Settling';
  quote.textContent = 'Breathe. Observe. Settle.';
  instruction.textContent = 'Press Start Ritual to begin your daily transition.';
  startBtn.textContent = 'Enter CODA';
  progressBar.style.width = '0%';
  dailyAction.textContent = dailyPrompts[0];
}

function setCoda() {
  state = 'coda';
  document.body.classList.add('coda');
  phaseLabel.textContent = 'CODA';
  phaseCopy.textContent = 'Conscious Observance and Daily Acceptance';
  stateChip.textContent = 'ACTIVATED';
  freqValue.textContent = 'Golden Fire';
  modeValue.textContent = 'Ignition';
  quote.textContent = 'Observe. Accept. Act.';
  instruction.textContent = 'Your calm is now becoming action.';
  startBtn.textContent = 'Return to SATA';
  progressBar.style.width = '100%';
  dailyAction.textContent = dailyPrompts[Math.floor(Math.random() * dailyPrompts.length)];
}

function ensureAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    oscillator = audioCtx.createOscillator();
    gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = 118;
    gain.gain.value = 0.0001;
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
  }
}

function setTone(level) {
  if (!audioCtx || !gain) return;
  const t = audioCtx.currentTime;
  gain.gain.cancelScheduledValues(t);
  gain.gain.setTargetAtTime(level, t, 0.03);
}

function toggleSound() {
  soundOn = !soundOn;
  soundBtn.textContent = soundOn ? 'Sound On' : 'Enable Sound';
  if (soundOn) {
    ensureAudio();
    setTone(0.05);
  } else {
    setTone(0.0001);
  }
}

function runBreathSequence() {
  clearInterval(breathTimer);
  breathStep = 0;
  breathTimer = setInterval(() => {
    if (state !== 'sata') {
      clearInterval(breathTimer);
      return;
    }
    instruction.textContent = breathPhases[breathStep % breathPhases.length];
    breathStep += 1;
  }, 1200);
}

function startRitual() {
  clearTimeout(ritualTimer);
  setSata();
  runBreathSequence();
  progressBar.style.transition = 'width 6s linear';
  requestAnimationFrame(() => progressBar.style.width = '100%');

  ritualTimer = setTimeout(() => {
    clearInterval(breathTimer);
    setCoda();
    if (soundOn) {
      ensureAudio();
      setTone(0.06);
    }
  }, 6000);
}

function resetRitual() {
  clearTimeout(ritualTimer);
  clearInterval(breathTimer);
  setSata();
  progressBar.style.transition = 'none';
  progressBar.style.width = '0%';
  if (soundOn) setTone(0.05);
}

startBtn.addEventListener('click', () => {
  if (state === 'sata') startRitual();
  else resetRitual();
});

soundBtn.addEventListener('click', toggleSound);
checkinBtn.addEventListener('click', checkIn);
resetBtn.addEventListener('click', resetRitual);

window.addEventListener('resize', () => {
  resizeCanvas();
  makeParticles();
});

resizeCanvas();
makeParticles();
drawBg();
setSata();
updateStreakUI();
