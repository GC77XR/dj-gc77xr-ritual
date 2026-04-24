function updateVisuals(elapsed) {
  const t = clamp(elapsed / SESSION_LIMIT, 0, 1);
  const SATA_DURATION = 330000; 
  
  let colorT = 0;
  if (elapsed >= SATA_DURATION) {
    colorT = clamp((elapsed - SATA_DURATION) / (SESSION_LIMIT - SATA_DURATION), 0, 1);
  }

  const coreColor = colorMix(indigo, gold, colorT);
  const arcColor = colorMix(indigo, gold, colorT);
  
  const fillColor = `linear-gradient(90deg, ${colorMix(indigo, [143, 91, 255], t * 0.7)} 0%, ${colorMix([143, 91, 255], gold, t)} 52%, ${colorMix(gold, fire, t)} 100%)`;
  
  core.material.color.set(coreColor);
  arcs.forEach(a => a.mesh.material.color.set(arcColor));
  timeFill.style.width = `${t * 100}%`;
  timeFill.style.background = fillColor;
  
  document.body.style.background = t < 0.5 ? 'radial-gradient(circle at top, #11183a 0%, #05070f 56%)' : 'radial-gradient(circle at top, #1c1807 0%, #05070f 56%)';
  
  circle.style.background = `radial-gradient(circle at 35% 30%, rgba(255,255,255,.22), transparent 18%), radial-gradient(circle at 50% 50%, ${colorMix(fire, gold, colorT * 0.8)}, ${colorMix(gold, indigo, 1 - colorT)})`;
  circle.style.boxShadow = `inset 0 10px 24px rgba(255,255,255,.12), inset 0 -18px 28px rgba(0,0,0,.24), 0 0 0 10px rgba(75,91,220,${0.10 * (1 - colorT)}), 0 0 0 24px rgba(245,197,66,${0.06 + 0.10 * colorT}), 0 0 60px rgba(245,197,66,${0.20 + 0.18 * colorT})`;
}

function finishExperience() { 
  appState = 'END'; 
  clearTimeout(pulseTimer); 
  
  if (master && audioCtx) {
    master.gain.setTargetAtTime(0.0001, audioCtx.currentTime, 1.5); 
  }
  
  showEndNos(); 
  document.body.classList.remove('is-active'); 
  hud.classList.add('hidden'); 
  statusLine.textContent = 'STATUS: COMPLETE // RESET - IGNITE - INTEGRATED'; 
}
