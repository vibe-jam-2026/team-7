// Power-ups you activate by SAYING corporate clichés out loud (Swedish speech recognition),
// or with the keys 1, 2, 3 as a fallback. Shown in the top-right corner with their phrase.
//   "Effektivisera"       → faster for a while
//   "Högt i tak"          → super jump
//   "Vi tar det offline"  → shield: meetings, SYNERGI notes and pop-ups bounce off you
// Speech uses the browser's Web Speech API (works in Edge and Chrome, needs the microphone).
import { sfx } from './ljud.js';

const DURATION = 10; // seconds each power-up lasts

export const POWERUPS = [
  { id: 'speed', icon: '⚡', phrase: 'Effektivisera', effect: 'Snabbare', key: '1', match: /effektivi/ },
  { id: 'jump', icon: '🦘', phrase: 'Högt i tak', effect: 'Superhopp', key: '2', match: /h[öo]g[a-z]* i tak/ },
  { id: 'shield', icon: '🛡', phrase: 'Vi tar det offline', effect: 'Möten studsar av', key: '3', match: /off ?-?line|ofline|offlajn|of lajn/ },
];

// Seconds left of each power-up; the player and the engine read these.
export const power = { speed: 0, jump: 0, shield: 0 };

let onActivate = null; // set by the game, to show a bubble over the player
export function onPowerUp(fn) { onActivate = fn; }

export function activate(id) {
  const pu = POWERUPS.find((p) => p.id === id);
  if (!pu) return;
  power[id] = DURATION;
  sfx.powerUp();
  onActivate?.(pu);
  render();
}

export function updatePowerUps(dt) {
  for (const k in power) power[k] = Math.max(0, power[k] - dt);
}

// ---- The panel in the corner -------------------------------------------------------
const stage = document.getElementById('stage');
const panel = document.createElement('div');
panel.id = 'powerups';
stage.appendChild(panel);
const rows = {};
for (const pu of POWERUPS) {
  const row = document.createElement('div');
  row.className = 'pu';
  row.innerHTML = `<span class="pu-icon">${pu.icon}</span><span class="pu-text"><b>”${pu.phrase}”</b><small>${pu.effect} · ${pu.key}</small></span><i class="pu-bar"></i>`;
  panel.appendChild(row);
  rows[pu.id] = row;
}
const heard = document.createElement('div');
heard.className = 'pu-heard';
panel.appendChild(heard);

let heardText = '', heardT = 0;
export function render(dt = 0) {
  for (const pu of POWERUPS) {
    const left = power[pu.id];
    rows[pu.id].classList.toggle('active', left > 0);
    rows[pu.id].querySelector('.pu-bar').style.width = (left / DURATION) * 100 + '%';
  }
  heardT -= dt;
  heard.textContent = heardT > 0 ? `🎤 ”${heardText}”` : '';
}
export function setPanelVisible(v) { panel.hidden = !v; }

// ---- Keys 1, 2, 3 as a fallback ----------------------------------------------------
let keysBlocked = false; // e.g. while mashing the keyboard in the office intro
export function blockPowerKeys(v) { keysBlocked = v; }
addEventListener('keydown', (e) => {
  if (keysBlocked) return;
  const pu = POWERUPS.find((p) => p.key === e.key);
  if (pu && !e.repeat) activate(pu.id);
});

// ---- Speech recognition ------------------------------------------------------------
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let rec = null, listening = false, wanted = false, status = SR ? 'off' : 'unsupported';
const statusListeners = [];
export function onMicStatus(fn) { statusListeners.push(fn); fn(status); }
function setStatus(s) { status = s; statusListeners.forEach((fn) => fn(s)); }

function normalise(t) { return t.toLowerCase().replace(/[.,!?"”]/g, ' ').replace(/\s+/g, ' ').trim(); }

// Check what was heard against the phrases. `done` remembers what already fired for this phrase.
export function hear(transcript, done = new Set()) {
  const text = normalise(transcript);
  heardText = text; heardT = 2.5;
  for (const pu of POWERUPS) {
    if (!done.has(pu.id) && pu.match.test(text)) { done.add(pu.id); activate(pu.id); }
  }
  return done;
}

if (SR) {
  rec = new SR();
  rec.lang = 'sv-SE';
  rec.continuous = true;
  rec.interimResults = true; // react while you're still talking
  const fired = new Map();   // result index -> power-ups already fired for that phrase
  rec.onresult = (e) => {
    for (let i = e.resultIndex; i < e.results.length; i++) {
      fired.set(i, hear(e.results[i][0].transcript, fired.get(i)));
      if (e.results[i].isFinal) fired.delete(i);
    }
  };
  rec.onstart = () => { listening = true; setStatus('on'); };
  rec.onend = () => {
    listening = false;
    fired.clear();
    // Browsers stop listening after a pause; start again as long as voice control is on
    if (wanted) setTimeout(() => { try { rec.start(); } catch { /* already started */ } }, 250);
    else setStatus('off');
  };
  rec.onerror = (e) => {
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { wanted = false; setStatus('denied'); }
    // 'no-speech' and 'aborted' are normal; onend restarts
  };
}

// Turn voice control on or off (must be called from a click: the browser asks for the microphone)
export function toggleVoice() {
  if (!rec) return;
  wanted = !wanted;
  if (wanted) { setStatus('starting'); try { rec.start(); } catch { /* already started */ } }
  else { try { rec.stop(); } catch { /* not started */ } }
}
