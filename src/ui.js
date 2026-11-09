// Text on top of the game (HUD, dialogue box, title cards, speech bubbles) is plain HTML,
// so it stays sharp and readable on a projector. The game only calls these functions.
const $ = (id) => document.getElementById(id);
const stage = $('stage');

let scale = 1;
export function setScale(s) {
  scale = s;
  stage.style.setProperty('--px', s + 'px');
}

// ---- HUD ----------------------------------------------------------------------
export function hud({ clock = '', goal = '', timer = null, meter = null, meterLabel = '' }) {
  $('clock').textContent = clock;
  $('goal').textContent = goal;
  $('goal').hidden = !goal;
  const t = $('timer');
  t.hidden = timer == null;
  if (timer != null) {
    const s = Math.max(0, Math.ceil(timer));
    t.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    t.classList.toggle('urgent', s <= 5);
  }
  const m = $('meter');
  m.hidden = meter == null;
  if (meter != null) {
    m.querySelector('i').style.width = Math.max(0, Math.min(100, meter)) + '%';
    m.querySelector('span').textContent = meterLabel;
    m.classList.toggle('urgent', meter < 25);
  }
}

// ---- Dialogue -------------------------------------------------------------------
export function dialog(speaker, text, drawPortrait) {
  const d = $('dialog');
  if (!speaker) { d.hidden = true; return; }
  d.hidden = false;
  $('speaker').textContent = speaker.name + (speaker.role ? ` · ${speaker.role}` : '');
  $('speaker').style.color = speaker.color;
  $('line').textContent = text;
  const pc = $('portrait').getContext('2d');
  pc.imageSmoothingEnabled = false;
  pc.clearRect(0, 0, 24, 24);
  drawPortrait(pc);
}
export function dialogText(text, done) {
  $('line').textContent = text;
  $('next').style.visibility = done ? 'visible' : 'hidden';
}

// ---- Title cards ----------------------------------------------------------------
export function card(show, { top = '', title = '', sub = '', hint = '' } = {}) {
  const c = $('card');
  c.hidden = !show;
  if (!show) return;
  $('cardTop').textContent = top;
  $('cardTitle').textContent = title;
  $('cardSub').innerHTML = sub;
  $('cardHint').textContent = hint;
}

// Big centred text, used for commands like "↑ HOPPA!".
export function shout(text) {
  const s = $('shout');
  s.hidden = !text;
  if (text) s.textContent = text;
}

// ---- Speech bubbles and labels in the world --------------------------------------
const pool = [];
export function bubbles(list, camX) {
  const host = $('bubbles');
  while (pool.length < list.length) {
    const el = document.createElement('div');
    el.className = 'bubble';
    host.appendChild(el);
    pool.push(el);
  }
  pool.forEach((el, i) => {
    const b = list[i];
    if (!b) { el.hidden = true; return; }
    el.hidden = false;
    if (el.textContent !== b.text) el.textContent = b.text;
    el.className = 'bubble' + (b.style ? ' ' + b.style : '');
    // Hide bubbles for things off screen; keep the others inside the screen
    const sx = b.x - camX;
    if (sx < -10 || sx > stage.clientWidth / scale + 10) { el.hidden = true; return; }
    const half = el.offsetWidth / 2;
    const max = stage.clientWidth - half - 2 * scale;
    el.style.left = Math.max(half + 2 * scale, Math.min(max, (b.x - camX) * scale)) + 'px';
    el.style.top = b.y * scale + 'px';
  });
}
