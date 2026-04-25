* { box-sizing: border-box; margin: 0; padding: 0; }
:root { --indigo: #4b5bdc; --gold: #d4af37; --fire: #ff8a1e; --bg: #05070f; }
body { background: var(--bg); color: #fff; font-family: 'Space Grotesk', sans-serif; min-height: 100vh; overflow-x: hidden; }

#vesselCanvas { position: fixed; inset: 0; z-index: 0; display: none; }
.hidden { display: none !important; }

/* Main UI Layout */
.panel { position: relative; z-index: 2; min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 40px 20px 100px; text-align: center; gap: 20px; }

/* Typography */
#vesselTitle { font-family: 'Montserrat', sans-serif; font-size: clamp(1.8rem, 5vw, 2.5rem); letter-spacing: 6px; color: var(--gold); }
.subtitle-text { color: var(--indigo); letter-spacing: 4px; font-weight: 700; text-transform: uppercase; font-size: clamp(0.9rem, 3vw, 1.1rem); }
.mantra-main { font-family: 'Montserrat', sans-serif; font-size: clamp(1.1rem, 4vw, 1.3rem); line-height: 1.6; max-width: 600px; margin: 0 auto; }
.highlight { color: var(--gold); font-weight: 900; }
.embark-text { font-size: clamp(1.1rem, 4vw, 1.3rem); color: var(--indigo); font-weight: 700; text-transform: uppercase; margin-top: 15px; letter-spacing: 1px; }

/* Buttons */
#actionArea { display: flex; flex-direction: column; align-items: center; gap: 15px; width: 100%; margin-top: 20px; }
.btn { padding: 18px; font-size: 1rem; font-weight: bold; letter-spacing: 3px; cursor: pointer; border-radius: 4px; width: 90%; max-width: 350px; font-family: 'Montserrat', sans-serif; border: none; transition: 0.3s; }
.btn-primary { background: var(--gold); color: #000; }
.btn-secondary { background: transparent; border: 2px solid var(--gold); color: var(--gold); }

/* Video and HUD */
#videoContainer { position: fixed; inset: 0; z-index: 100; background: #000; display: flex; align-items: center; justify-content: center; }
video { width: 100%; max-height: 100vh; }
#hud { position: fixed; top: 20px; width: 100%; z-index: 5; text-align: center; font-size: 0.9rem; letter-spacing: 2px; display: none; }
#timeBar { width: 80%; height: 6px; background: rgba(255,255,255,0.1); margin: 10px auto; border-radius: 3px; overflow: hidden; }
#timeFill { height: 100%; width: 0%; background: var(--indigo); }

/* End Screen, Forms, and Footer */
.reveal { position: fixed; inset: 0; z-index: 10; background: rgba(5,7,15,0.98); display: flex; flex-direction: column; align-items: center; justify-content: center; opacity: 0; transition: 0.8s; pointer-events: none; padding: 20px; gap: 10px; overflow-y: auto; }
.reveal.show { opacity: 1; pointer-events: auto; }
.disclaimerFooter { position: fixed; bottom: 0; width: 100%; padding: 15px; background: rgba(0,0,0,0.85); text-align: center; font-size: 0.7rem; color: rgba(255,255,255,0.4); z-index: 10; }

/* 18-Second Fade Animation */
.fade-in-18s {
    opacity: 0;
    animation: fadeIn 18s ease-in forwards;
}

@keyframes fadeIn {
    to { opacity: 1; }
}

/* 📱 Mobile Landscape Orientation Fix */
@media screen and (max-height: 500px) and (orientation: landscape) {
    .panel { padding: 10px; gap: 10px; justify-content: center; }
    #vesselTitle { font-size: 1.5rem; }
    .subtitle-text { font-size: 0.8rem; }
    .mantra-main { font-size: 0.9rem; margin: 5px 0; max-width: 80%; }
    .embark-text { font-size: 0.9rem; margin-top: 5px; }
    #actionArea { flex-direction: row; justify-content: center; gap: 15px; margin-top: 10px; }
    .btn { padding: 10px 20px; font-size: 0.8rem; width: auto; }
    .reveal img { max-height: 40vh; margin-bottom: 5px; }
    .contact-form { flex-direction: row; flex-wrap: wrap; justify-content: center; }
    .contact-form input { padding: 10px; width: 45%; }
    .disclaimerFooter { position: static; padding: 5px; }
}
