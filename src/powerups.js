// Power-ups that FLY IN on screen now and then. Say the cliché on the card before its time runs
// out (Swedish speech recognition) and you catch it; a short line explains what you got.
// Without a microphone, P catches it instead (only while voice control is off).
// Active power-ups are shown in the top-right corner. Add more in POWERUPS below.
import { sfx } from './ljud.js';

const OFFER_TIME = 6;        // seconds to say the phrase
const FIRST_OFFER = 5;       // seconds before the first one shows up
const BETWEEN = [9, 15];     // seconds between offers

// timed: only offered in minigames with a clock. instant: no duration, happens at once.
export const POWERUPS = [
  { id: 'speed', icon: '⚡', phrase: 'Effektivisera', time: 10, match: /effektivi/,
    explain: 'Du springer nästan dubbelt så fort i 10 sekunder.' },
  { id: 'jump', icon: '🦘', phrase: 'Högt i tak', time: 10, match: /h[öo]g[a-z]* i tak/,
    explain: 'Superhopp i 10 sekunder. Hoppa över allt och alla.' },
  { id: 'shield', icon: '🛡️', phrase: 'Vi tar det offline', time: 10, match: /off ?-?line|ofline|offlajn|of lajn/,
    explain: 'Sköld i 10 sekunder: möten, synergi och felrutor studsar av.' },
  { id: 'slow', icon: '🐌', phrase: 'Vi parkerar det', time: 6, timed: true, match: /parker/,
    explain: 'Allt utom du går i slowmotion i 6 sekunder, och klockan står still.' },
  { id: 'magnet', icon: '🧲', phrase: 'Lågt hängande frukt', time: 10, match: /l[åa]gt? ?h[äa]ngande|h[äa]ngande frukt/,
    explain: 'Idéer, sladdar och kaffe dras till dig i 10 sekunder.' },
  { id: 'quickwin', icon: '🏆', phrase: 'Quick win', instant: true, timed: true, match: /quick ?win|kvick ?vin|kwick|quickwin|kvikk/,
    explain: '+6 sekunder på klockan!' },
];
const byId = Object.fromEntries(POWERUPS.map((p) => [p.id, p]));

// Seconds left of each power-up; the player and the engine read these.
export const power = Object.fromEntries(POWERUPS.filter((p) => !p.instant).map((p) => [p.id, 0]));

let onActivate = null; // set by the game (bubble over the player, extra time for quick win)
export function onPowerUp(fn) { onActivate = fn; }

function activate(pu) {
  if (!pu.instant) power[pu.id] = pu.time;
  sfx.powerUp();
  onActivate?.(pu);
}

// ---- The flying offer card --------------------------------------------------------
const stage = document.getElementById('stage');
const card = document.createElement('div');
card.id = 'pu-offer';
card.innerHTML = '<span class="o-icon"></span><span class="o-text"><b></b><small></small></span><i class="o-bar"></i>';
stage.appendChild(card);
const cIcon = card.querySelector('.o-icon'), cTitle = card.querySelector('b'), cSmall = card.querySelector('small'), cBar = card.querySelector('.o-bar');

let offer = null;      // { pu, left }
let showT = 0;         // how long the caught/missed message stays
let nextOffer = FIRST_OFFER;

function showOffer(pu) {
  offer = { pu, left: OFFER_TIME };
  cIcon.textContent = pu.icon;
  cTitle.textContent = `Säg: ”${pu.phrase}”`;
  cSmall.textContent = micStatus === 'on' ? 'innan tiden tar slut!' : 'innan tiden tar slut! (utan mikrofon: tryck P)';
  card.className = 'show';
  sfx.slide();
}

function resolve(caught) {
  const pu = offer.pu;
  offer = null;
  showT = caught ? 3 : 1.4;
  cBar.style.width = '0%';
  if (caught) {
    card.className = 'show caught';
    cTitle.textContent = `${pu.phrase.toUpperCase()}!`;
    cSmall.textContent = pu.explain;
    activate(pu);
  } else {
    card.className = 'show missed';
    cTitle.textContent = 'För sent!';
    cSmall.textContent = `Power-upen ”${pu.phrase}” flög iväg.`;
    sfx.nope();
  }
  nextOffer = BETWEEN[0] + Math.random() * (BETWEEN[1] - BETWEEN[0]);
}

// Called every frame. canOffer: the player can act right now. timed: the minigame has a clock.
export function updatePowerUps(dt, { canOffer, timed }) {
  for (const k in power) power[k] = Math.max(0, power[k] - dt);

  if (showT > 0) { showT -= dt; if (showT <= 0) card.className = ''; }
  if (offer) {
    if (!canOffer) { offer = null; card.className = ''; return; } // the scene changed; let it go quietly
    offer.left -= dt;
    cBar.style.width = (offer.left / OFFER_TIME) * 100 + '%';
    if (offer.left <= 0) resolve(false);
    return;
  }
  if (!canOffer || showT > 0) return;
  nextOffer -= dt;
  if (nextOffer > 0) return;
  const choices = POWERUPS.filter((p) => (!p.timed || timed) && !(power[p.id] > 0));
  if (choices.length) showOffer(choices[Math.floor(Math.random() * choices.length)]);
}

// ---- Active power-ups in the corner -------------------------------------------------
const panel = document.createElement('div');
panel.id = 'powerups';
stage.appendChild(panel);
const rows = {};
for (const pu of POWERUPS.filter((p) => !p.instant)) {
  const row = document.createElement('div');
  row.className = 'pu active';
  row.innerHTML = `<span class="pu-icon">${pu.icon}</span><span class="pu-text"><b>${pu.phrase}</b></span><i class="pu-bar"></i>`;
  panel.appendChild(row);
  rows[pu.id] = row;
}
const heard = document.createElement('div');
heard.className = 'pu-heard';
panel.appendChild(heard);

let heardText = '', heardT = 0;
export function render(dt = 0) {
  for (const id in rows) {
    const left = power[id];
    rows[id].hidden = !(left > 0);
    rows[id].classList.toggle('ending', left > 0 && left < 3); // blink when it's about to run out
    rows[id].querySelector('.pu-bar').style.width = (left / byId[id].time) * 100 + '%';
  }
  heardT -= dt;
  heard.textContent = heardT > 0 ? `🎤 ”${heardText}”` : '';
}
export function setPanelVisible(v) { panel.hidden = !v; }

// ---- P catches the offer when there is no voice control ------------------------------
let keysBlocked = false; // e.g. while mashing the keyboard in the office intro
export function blockPowerKeys(v) { keysBlocked = v; }
addEventListener('keydown', (e) => {
  if (keysBlocked || e.repeat || !offer || micStatus === 'on') return;
  if (e.key === 'p' || e.key === 'P') resolve(true);
});

// ---- Speech recognition ------------------------------------------------------------
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let rec = null, wanted = false, micStatus = SR ? 'off' : 'unsupported';
const statusListeners = [];
export function onMicStatus(fn) { statusListeners.push(fn); fn(micStatus); }
function setStatus(s) { micStatus = s; statusListeners.forEach((fn) => fn(s)); }

function normalise(t) { return t.toLowerCase().replace(/[.,!?"”]/g, ' ').replace(/\s+/g, ' ').trim(); }

// Check what was heard. Only the phrase on the card that is flying right now counts.
export function hear(transcript) {
  const text = normalise(transcript);
  heardText = text; heardT = 2.5;
  if (offer && offer.pu.match.test(text)) { resolve(true); return true; }
  return false;
}

if (SR) {
  rec = new SR();
  rec.lang = 'sv-SE';
  rec.continuous = true;
  rec.interimResults = true; // react while you're still talking
  rec.onresult = (e) => {
    for (let i = e.resultIndex; i < e.results.length; i++) hear(e.results[i][0].transcript);
  };
  rec.onstart = () => setStatus('on');
  rec.onend = () => {
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

// For testing in the console: debugOffer('slow') shows that offer right away
export function debugOffer(id) { if (byId[id]) { offer = null; showT = 0; showOffer(byId[id]); } }
