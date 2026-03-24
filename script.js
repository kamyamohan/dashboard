const wrap = document.getElementById('cloudWrap');
const particles = document.getElementById('particles');
const mouth = document.getElementById('mouth');
const blushL = document.getElementById('blushL');
const blushR = document.getElementById('blushR');
const puffL = document.getElementById('puffL');
const puffR = document.getElementById('puffR');
const puffT = document.getElementById('puffT');

const pupilL  = document.getElementById('pupilL');
const pupilR  = document.getElementById('pupilR');
const shineL  = document.getElementById('shineL');
const shineR  = document.getElementById('shineR');
const svg     = wrap.querySelector('.cloud-svg');

/* ── Googly eye tracking ── */
// Eye centres in SVG viewBox space
const EYE_L = { x: -14, y: 4 };
const EYE_R = { x:  14, y: 4 };
const MAX_TRAVEL = 3.5; // max pupil offset radius in SVG units

function movePupil(pupilEl, shineEl, eyeCenter, angle, dist) {
  const travel = Math.min(dist, MAX_TRAVEL);
  const px = eyeCenter.x + Math.cos(angle) * travel;
  const py = eyeCenter.y + Math.sin(angle) * travel;
  pupilEl.setAttribute('cx', px);
  pupilEl.setAttribute('cy', py);
  // shine offset slightly up-left of pupil centre
  shineEl.setAttribute('cx', px - 1.5);
  shineEl.setAttribute('cy', py - 1.8);
}

document.addEventListener('mousemove', (e) => {
  const svgRect = svg.getBoundingClientRect();
  if (svgRect.width === 0) return;

  // Scale factor: viewBox is 200 wide, rendered width is svgRect.width
  const vbW = 200, vbH = 160;
  const scaleX = vbW / svgRect.width;
  const scaleY = vbH / svgRect.height;

  // Cursor in viewBox coordinates (origin at top-left of viewBox = -100,-80)
  const cursorVBX = (e.clientX - svgRect.left)  * scaleX - 100;
  const cursorVBY = (e.clientY - svgRect.top)   * scaleY - 80;

  [
    { pupil: pupilL, shine: shineL, eye: EYE_L },
    { pupil: pupilR, shine: shineR, eye: EYE_R },
  ].forEach(({ pupil, shine, eye }) => {
    const dx = cursorVBX - eye.x;
    const dy = cursorVBY - eye.y;
    const dist  = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    movePupil(pupil, shine, eye, angle, dist * 0.12);
  });
});

let hoverTimer = null;
let idleTimer = null;
let isHovering = false;
let audioCtx = null;

/* ── Audio ── */
function playChime(freq = 520, delay = 0) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime + delay);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.3, audioCtx.currentTime + delay + 0.15);
    gain.gain.setValueAtTime(0.0, audioCtx.currentTime + delay);
    gain.gain.linearRampToValueAtTime(0.07, audioCtx.currentTime + delay + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + 0.55);
    osc.start(audioCtx.currentTime + delay);
    osc.stop(audioCtx.currentTime + delay + 0.6);
  } catch (e) {}
}

function playSoftAmbient() {
  playChime(480, 0);
  playChime(600, 0.1);
  playChime(720, 0.22);
}

function playClickSound() {
  playChime(600, 0);
  playChime(760, 0.1);
  playChime(900, 0.22);
  playChime(600, 0.38);
}

/* ── Blush helpers ── */
function showBlush() {
  blushL.setAttribute('opacity', '0.55');
  blushR.setAttribute('opacity', '0.55');
}

function hideBlush() {
  blushL.setAttribute('opacity', '0');
  blushR.setAttribute('opacity', '0');
}

/* ── Fluffy puffs ── */
function showPuffs() {
  puffL.setAttribute('rx', '28');
  puffL.setAttribute('ry', '22');
  puffR.setAttribute('rx', '28');
  puffR.setAttribute('ry', '22');
  puffT.setAttribute('rx', '24');
  puffT.setAttribute('ry', '20');
}

function hidePuffs() {
  ['rx','ry'].forEach(a => {
    puffL.setAttribute(a, '0');
    puffR.setAttribute(a, '0');
    puffT.setAttribute(a, '0');
  });
}

/* ── Mouth shapes ── */
const mouths = {
  neutral:  'M -8 18 Q 0 24 8 18',
  smile:    'M -10 17 Q 0 27 10 17',
  bigSmile: 'M -12 16 Q 0 30 12 16',
};

function setMouth(shape) {
  mouth.setAttribute('d', mouths[shape] || mouths.neutral);
}

/* ── Idle bob ── */
function startIdle() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    wrap.classList.add('idle');
  }, 400);
}

function stopIdle() {
  clearTimeout(idleTimer);
  wrap.classList.remove('idle');
}

/* ── Sparkles ── */
function spawnSparkles() {
  const rect = wrap.getBoundingClientRect();
  const sceneRect = document.getElementById('scene').getBoundingClientRect();
  const cx = rect.left + rect.width / 2 - sceneRect.left;
  const cy = rect.top + rect.height / 2 - sceneRect.top;

  const positions = [
    { x: -65, y: -60 }, { x: 65, y: -60 }, { x: -85, y: -5 },
    { x: 85, y: -5 },   { x: -35, y: -78 }, { x: 35, y: -78 },
    { x: 0, y: -82 },
  ];
  const glyphs = ['✦', '✧', '⋆', '★', '✩', '✦', '✧'];
  const colors = ['#e8a0f0', '#a0c8f8', '#f0c0d8', '#c0e0b0', '#f8d0a0', '#d0b8f8', '#a8d8f0'];

  positions.forEach((p, i) => {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'sparkle';
      el.textContent = glyphs[i];
      el.style.left = (cx + p.x * 0.82) + 'px';
      el.style.top  = (cy + p.y * 0.72) + 'px';
      el.style.color = colors[i];
      el.style.animationDelay = (i * 0.05) + 's';
      particles.appendChild(el);
      setTimeout(() => el.remove(), 1700);
    }, i * 35);
  });
}

/* ── Click hearts/stars ── */
function spawnParticles(originX, originY) {
  const items = ['💕', '🌸', '⭐', '💜', '🌷', '✨', '💛', '🩷', '🌟', '💫'];
  for (let i = 0; i < 12; i++) {
    const el = document.createElement('div');
    el.className = 'particle';
    el.textContent = items[Math.floor(Math.random() * items.length)];
    el.style.left = (originX + (Math.random() - 0.5) * 130) + 'px';
    el.style.top  = (originY - 10) + 'px';
    const dur = 1.1 + Math.random() * 0.9;
    el.style.animationDuration = dur + 's';
    el.style.animationDelay = (i * 0.06) + 's';
    particles.appendChild(el);
    setTimeout(() => el.remove(), (dur + 0.6 + i * 0.06) * 1000);
  }
}

/* ── State machine ── */
wrap.addEventListener('mouseenter', () => {
  isHovering = true;
  stopIdle();
  wrap.classList.remove('linger', 'fluffy');
  wrap.classList.add('hovered');
  showBlush();
  setMouth('smile');
  playSoftAmbient();

  hoverTimer = setTimeout(() => {
    if (!isHovering) return;
    wrap.classList.remove('hovered');
    wrap.classList.add('fluffy');
    showPuffs();
    setMouth('bigSmile');
    spawnSparkles();
  }, 1300);
});

wrap.addEventListener('mouseleave', () => {
  isHovering = false;
  clearTimeout(hoverTimer);

  wrap.classList.remove('hovered', 'fluffy');
  wrap.classList.add('linger');
  hidePuffs();
  setMouth('smile');

  setTimeout(() => {
    if (isHovering) return;
    wrap.classList.remove('linger');
    hideBlush();
    setMouth('neutral');
    startIdle();
  }, 2800);
});

wrap.addEventListener('click', (e) => {
  const sceneRect = document.getElementById('scene').getBoundingClientRect();
  const cx = e.clientX - sceneRect.left;
  const cy = e.clientY - sceneRect.top;
  spawnParticles(cx, cy);
  playClickSound();
});

/* ── Boot ── */
startIdle();
