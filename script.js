* { box-sizing: border-box; }
:root {
  --bg: #07111f;
  --indigo: #4b5bdc;
  --gold: #f5c542;
  --text: #f3f6ff;
}
body {
  margin: 0; min-height: 100vh; display: grid; place-items: center;
  background: radial-gradient(circle at top, #12213b, var(--bg)); color: var(--text);
  font-family: Inter, system-ui, sans-serif;
}
.stage { width: min(92vw, 760px); padding: 24px; }
.card, .screen {
  background: rgba(10, 18, 35, 0.76); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 28px; padding: 30px; backdrop-filter: blur(16px);
  box-shadow: 0 24px 80px rgba(0,0,0,0.35); text-align: center;
}
.eyebrow, h1 { font-family: 'Space Grotesk', sans-serif; }
.eyebrow { margin: 0 0 10px; font-size: 0.82rem; letter-spacing: 0.22em; text-transform: uppercase; opacity: 0.82; }
h1 { margin: 0 0 12px; font-size: clamp(2rem, 5vw, 3.3rem); line-height: 1.04; }
.copy, .status, .timer, .guides, .disclaimer { line-height: 1.5; opacity: 0.93; }
.copy { max-width: 46ch; margin: 0 auto; }
.circle-shell { perspective: 1200px; display: grid; place-items: center; margin: 28px 0 18px; }
.circle {
  position: relative; width: min(72vw, 310px); aspect-ratio: 1; border: 0; border-radius: 50%;
  cursor: pointer; transform-style: preserve-3d; transform: rotateX(16deg) rotateY(-18deg);
  background:
    radial-gradient(circle at 50% 50%, rgba(255,255,255,0.20), transparent 18%),
    radial-gradient(circle at 35% 35%, rgba(255,255,255,0.14), transparent 40%),
    radial-gradient(circle at 50% 50%, rgba(75,91,220,0.5), rgba(75,91,220,0.98));
  box-shadow:
    inset 0 10px 24px rgba(255,255,255,0.16), inset 0 -18px 28px rgba(0,0,0,0.24),
    0 0 0 14px rgba(75,91,220,0.12), 0 0 0 28px rgba(75,91,220,0.06), 0 0 60px rgba(75, 91, 220, 0.48);
  transition: transform 180ms ease, box-shadow 350ms ease, filter 350ms ease, background 300ms ease;
}
.circle::before {
  content: ''; position: absolute; inset: 10%; border-radius: 50%;
  background: radial-gradient(circle at 30% 28%, rgba(255,255,255,0.35), transparent 30%);
  transform: translateZ(20px);
}
.circle::after {
  content: ''; position: absolute; inset: 0; border-radius: 50%;
  background: radial-gradient(circle at 50% 70%, rgba(0,0,0,0.22), transparent 42%);
  transform: translateZ(-1px);
}
.circle:hover { transform: rotateX(20deg) rotateY(-10deg) scale(1.02); }
.circle.core-pulse { animation: heartbeat 1.02s ease-in-out infinite; }
.meter { height: 14px; border-radius: 999px; background: rgba(255,255,255,0.08); overflow: hidden; }
.meter-fill { width: 0%; height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--indigo), var(--gold)); transition: width 90ms linear, background 250ms linear; }
.hud { display: flex; justify-content: space-between; gap: 12px; align-items: center; margin-top: 14px; }
.timer { font-variant-numeric: tabular-nums; font-size: 1.2rem; font-weight: 700; transition: transform 220ms ease, color 220ms ease, text-shadow 220ms ease; }
.timer.timer-pulse { animation: clockBeat 1.02s ease-in-out infinite; }
.start-btn {
  margin-top: 18px; width: 100%; border: 0; border-radius: 16px; padding: 16px 18px;
  background: linear-gradient(135deg, rgba(75,91,220,0.95), rgba(245,197,66,0.95)); color: #fff;
  font-family: 'Space Grotesk', sans-serif; font-weight: 700; letter-spacing: 0.12em;
  cursor: pointer; box-shadow: 0 14px 30px rgba(0,0,0,0.28);
}
.start-btn:active { transform: scale(0.99); }
.rewards { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 18px; }
.reward-pill { padding: 10px 12px; border-radius: 999px; background: rgba(255,255,255,0.06); font-size: 0.9rem; }
.guides { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 18px; font-size: 0.92rem; }
.guides div { padding: 12px; border-radius: 16px; background: rgba(255,255,255,0.05); }
.disclaimer { margin-top: 18px; padding: 14px; border-radius: 18px; background: rgba(255,255,255,0.04); font-size: 0.85rem; text-align: left; }
body.coda .circle {
  background:
    radial-gradient(circle at 50% 50%, rgba(255,255,255,0.24), transparent 18%),
    radial-gradient(circle at 35% 35%, rgba(255,255,255,0.18), transparent 38%),
    radial-gradient(circle at 50% 50%, rgba(245,197,66,0.5), rgba(245,197,66,0.98));
  box-shadow:
    inset 0 10px 24px rgba(255,255,255,0.14), inset 0 -18px 28px rgba(0,0,0,0.22),
    0 0 0 14px rgba(245,197,66,0.14), 0 0 0 28px rgba(245,197,66,0.07), 0 0 60px rgba(245, 197, 66, 0.5);
  filter: saturate(1.12) brightness(1.08);
}
.completion-dialog { border: 0; border-radius: 26px; padding: 0; background: transparent; color: var(--text); }
.completion-dialog::backdrop { background: rgba(5,10,18,0.72); backdrop-filter: blur(6px); }
.dialog-card {
  min-width: min(90vw, 460px);
  background: rgba(10, 18, 35, 0.96); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 26px; padding: 24px; text-align: center; box-shadow: 0 24px 80px rgba(0,0,0,0.45);
}
.dialog-title { font-family: 'Space Grotesk', sans-serif; font-size: 1.35rem; font-weight: 700; margin: 14px 0 10px; }
.dialog-line, .dialog-sign { margin: 0 0 10px; opacity: 0.92; }
.dialog-btn {
  border: 0; border-radius: 14px; padding: 12px 18px; cursor: pointer;
  background: linear-gradient(135deg, var(--indigo), var(--gold)); color: white; font-family: 'Space Grotesk', sans-serif; font-weight: 700;
}
.dialog-image, .hero-image { width: 100%; border-radius: 18px; display: block; object-fit: cover; }
.screen { display: none; }
.screen.hidden { display: none; }
.screen.show { display: block; }
@keyframes heartbeat {
  0% { transform: scale(0.88); opacity: 0.85; }
  12% { transform: scale(1.03); }
  24% { transform: scale(0.95); }
  36% { transform: scale(1.10); }
  50% { transform: scale(1.00); }
  100% { transform: scale(0.88); opacity: 0.85; }
}
@keyframes clockBeat {
  0% { transform: scale(1); text-shadow: 0 0 0 rgba(255,255,255,0); }
  12% { transform: scale(1.05); text-shadow: 0 0 16px rgba(245,197,66,0.18); }
  24% { transform: scale(0.98); }
  36% { transform: scale(1.08); text-shadow: 0 0 18px rgba(245,197,66,0.22); }
  50% { transform: scale(1); }
  100% { transform: scale(1); }
}
@media (max-width: 640px) {
  .hud, .guides, .rewards { grid-template-columns: 1fr; display: grid; }
}
