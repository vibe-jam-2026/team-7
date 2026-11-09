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
export function card(show, { top = '', title = '', sub = '', hint = '', lost = false } = {}) {
  const c = $('card');
  c.hidden = !show;
  c.classList.toggle('lost', show && lost);
  if (!show) return;
  $('cardTop').textContent = top;
  $('cardTitle').textContent = title;
  $('cardSub').innerHTML = sub;
  $('cardHint').textContent = hint;
}

// The red "TRYCK INTE" button (src/knappen.js)
export function forbiddenButton(show) { $('forbidden').hidden = !show; }

// Big centred text, used for commands like "↑ HOPPA!".
export function shout(text) {
  const s = $('shout');
  s.hidden = !text;
  if (text) s.textContent = text;
}

// ---- Speech bubbles and labels in the world --------------------------------------
// Each bubble wants to sit with its bottom edge at (x, y). If it would overlap a bubble
// that is already placed, or HUD text (clock, goal, timer, meter, the red button),
// it is lifted above it, or pushed below the HUD when there is no room above.
// Station labels are placed first and stay put; speech bubbles move out of their way.
const pool = [];
const GAP = 2; // game pixels between bubbles (room for the little tail)
const HUD_IDS = ['clock', 'goal', 'timer', 'meter', 'forbidden'];

function hudRects() {
  const base = stage.getBoundingClientRect();
  const rects = [];
  for (const id of HUD_IDS) {
    const el = $(id);
    if (!el || el.hidden || !el.textContent && id !== 'meter') continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    rects.push({ l: r.left - base.left, r: r.right - base.left, t: r.top - base.top, b: r.bottom - base.top });
  }
  return rects;
}

const hits = (a, b) => a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t;

export function bubbles(list, camX) {
  const host = $('bubbles');
  while (pool.length < list.length) {
    const el = document.createElement('div');
    el.className = 'bubble';
    host.appendChild(el);
    pool.push(el);
  }
  const W = stage.clientWidth, H = stage.clientHeight;
  const shown = [];
  pool.forEach((el, i) => {
    const b = list[i];
    if (!b) { el.hidden = true; return; }
    // Hide bubbles for things off screen
    const sx = b.x - camX;
    if (sx < -10 || sx > W / scale + 10) { el.hidden = true; return; }
    el.hidden = false;
    if (el.textContent !== b.text) el.textContent = b.text;
    el.className = 'bubble' + (b.style ? ' ' + b.style : '');
    shown.push({ el, b, station: (b.style || '').startsWith('station') });
  });
  // Fixed labels first, then speech bubbles in the order they were given.
  shown.sort((a, c) => c.station - a.station);

  const gap = GAP * scale;
  const hud = hudRects();
  const placed = [];
  for (const { el, b } of shown) {
    const w = el.offsetWidth, h = el.offsetHeight;
    const half = w / 2;
    // Keep the bubble inside the screen sideways
    const cx = Math.max(half + 2 * scale, Math.min(W - half - 2 * scale, (b.x - camX) * scale));
    const box = (bottom) => ({ l: cx - half - gap, r: cx + half + gap, t: bottom - h - gap, b: bottom + gap });
    const want = b.y * scale;
    let bottom = want;
    // Lift above anything we overlap (a few rounds, since lifting can cause a new overlap)
    for (let n = 0; n < 12; n++) {
      const hit = [...placed, ...hud].find((o) => hits(box(bottom), o));
      if (!hit) break;
      bottom = hit.t - gap;
    }
    // No room above (ran into the top edge): go below the obstacles instead
    if (bottom - h < 0) {
      bottom = want;
      for (let n = 0; n < 12; n++) {
        const hit = [...placed, ...hud].find((o) => hits(box(bottom), o));
        if (!hit) break;
        bottom = hit.b + h + gap;
      }
      bottom = Math.min(bottom, H);
    }
    placed.push(box(bottom));
    el.style.left = cx + 'px';
    el.style.top = bottom + 'px';
  }
}

// ---- Dialogue choices -------------------------------------------------------------
// A panel with someone's line and up to three answers, used by minigames via g.choices().
// data: { who, text, mood: ''|'calm'|'angry', options: [{ key, text, state }], bar: 0–1 or null }
// state: '' | 'good' | 'bad' | 'dim' | 'hidden'. onPick(i) runs when an answer is clicked.
let choicesKey = '';
let choicesPick = null;
export function choices(data, onPick) {
  const c = $('choices');
  if (!data) { c.hidden = true; choicesKey = ''; return; }
  c.hidden = false;
  choicesPick = onPick;
  const key = JSON.stringify([data.who, data.text, data.mood, data.options]);
  if (key !== choicesKey) {
    choicesKey = key;
    c.className = data.mood || '';
    $('choicesWho').textContent = data.who || '';
    $('choicesText').textContent = data.text || '';
    const list = $('choicesList');
    list.innerHTML = '';
    data.options.forEach((o, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.tabIndex = -1;
      b.className = 'choice ' + (o.state || '');
      const k = document.createElement('b'); k.textContent = o.key;
      b.append(k, document.createTextNode(' ' + o.text));
      b.addEventListener('mousedown', (e) => e.preventDefault()); // never take focus (space is the action key)
      b.addEventListener('click', () => { b.blur(); choicesPick?.(i); });
      list.appendChild(b);
    });
  }
  const bar = $('choicesBar');
  bar.hidden = data.bar == null;
  if (data.bar != null) {
    bar.querySelector('i').style.width = Math.max(0, Math.min(1, data.bar)) * 100 + '%';
    bar.classList.toggle('urgent', data.bar < 0.35);
  }
}
