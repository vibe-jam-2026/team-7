// Dev menu: press Ö (or §, or click DEV) to jump to any chapter or minigame. Handy when testing.
// ↑ ↓ choose · Enter: straight into the minigame · → : play the chapter from its start (dialogue + Haga) · Ö / Esc: close
import { STORY } from './story.js';
import { MINIGAMES } from './minispel/index.js';
import { devJump, devPlay } from './game.js';
import { keys, clearPressed } from './input.js';

const stage = document.getElementById('stage');
const box = document.createElement('div');
box.id = 'devmeny';
box.hidden = true;
stage.appendChild(box);

let open = false;
let sel = 0;
let items = [];

function buildItems() {
  const inStory = new Set(STORY.map((b) => b.play).filter(Boolean));
  items = STORY.map((b, i) => ({
    label: `${String(i).padStart(2, ' ')}  ${b.clock}  ${b.play ? (MINIGAMES[b.play]?.title ?? b.play) : b.title}`,
    go: (direct) => devJump(i, direct),
  }));
  for (const m of Object.values(MINIGAMES)) {
    if (!inStory.has(m.id)) items.push({ label: `--  utanför storyn  ${m.title}`, go: () => devPlay(m.id) });
  }
}

function render() {
  box.innerHTML = '';
  const h = document.createElement('div');
  h.className = 'dev-head';
  h.textContent = 'DEV-MENY';
  box.appendChild(h);
  items.forEach((it, i) => {
    const row = document.createElement('div');
    row.className = 'dev-row' + (i === sel ? ' sel' : '');
    row.textContent = (i === sel ? '▶ ' : '  ') + it.label;
    row.onclick = () => choose(i, true);
    box.appendChild(row);
  });
  const f = document.createElement('div');
  f.className = 'dev-foot';
  f.textContent = '↑↓ välj · Enter: direkt till minispelet · →: kapitlet från början · Ö/Esc: stäng';
  box.appendChild(f);
  box.querySelector('.sel')?.scrollIntoView({ block: 'nearest' });
}

function setOpen(v) {
  open = v;
  box.hidden = !v;
  for (const k in keys) keys[k] = false;
  clearPressed();
  if (v) { buildItems(); render(); }
}

function choose(i, direct) {
  setOpen(false);
  items[i].go(direct);
}

export function devMenuOpen() { return open; }

const isToggle = (e) => ['ö', 'Ö', '§', '½'].includes(e.key) || e.code === 'Semicolon' || e.code === 'Backquote';

// Capture phase on window runs before the game's own key handling, so the menu can swallow keys.
addEventListener('keydown', (e) => {
  if (isToggle(e)) { e.preventDefault(); e.stopImmediatePropagation(); setOpen(!open); return; }
  if (!open) return;
  e.preventDefault(); e.stopImmediatePropagation();
  if (e.key === 'Escape') setOpen(false);
  else if (e.key === 'ArrowDown') { sel = (sel + 1) % items.length; render(); }
  else if (e.key === 'ArrowUp') { sel = (sel - 1 + items.length) % items.length; render(); }
  else if (e.key === 'Enter' || e.key === ' ') choose(sel, true);
  else if (e.key === 'ArrowRight') choose(sel, false);
}, true);
addEventListener('keyup', (e) => { if (open || isToggle(e)) { e.preventDefault(); e.stopImmediatePropagation(); } }, true);

// A clickable DEV button, in case the keyboard layout has no Ö
const btn = document.getElementById('devbtn');
if (btn) btn.onclick = () => { btn.blur(); setOpen(!open); };
