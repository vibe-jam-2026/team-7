// FinalFinalBoss: keynote med den inhyrda motivationstalaren John Vantage. Ett bullet hell.
// John står på en saxlift till höger och skjuter företagsslogans. Du kan inte slå tillbaka:
// överlev i 2:00. Piltangenterna styr fritt i alla riktningar, Shift = långsamt och visar
// träffpunkten (pricken på bröstet), mellanslag = tysta John (rensar skärmen, 2 gånger).
// Sex agendapunkter à 20 sekunder, var och en med egna mönster (se PATTERNS).
// Ingår inte i berättelsen än: nås via dev-menyn (Ö). Lägg till ett steg med play: 'finalfinalboss'
// i src/story.js och en `station` nedan för att ta med det.
import { keys, wasPressed } from '../input.js';
import { WIDTH as W, HEIGHT as H, pick, rand } from '../world.js';
import { drawPerson, PLAYER } from '../sprites.js';

const TAU = Math.PI * 2, PI = Math.PI;
const LIVES = 3, MUTES = 2, PHASE_LEN = 20, FIRE_STOP = 117.5;
const FLOOR = 172;                       // golvet på scenen
const AREA = { x0: 6, x1: 238, y0: 40, y1: 162 }; // där din träffpunkt får vara

// Shift = fokus (långsam rörelse). Motorns input har ingen Shift, så vi lyssnar själva.
let shift = false;
addEventListener('keydown', (e) => { if (e.key === 'Shift') shift = true; });
addEventListener('keyup', (e) => { if (e.key === 'Shift') shift = false; });
addEventListener('blur', () => { shift = false; });

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

// ---- Texten ---------------------------------------------------------------------------------
const SHORT = ['SYNERGI', 'DRIV', 'GNET', 'PIVOTERA', 'LINJERA', '10X', 'KPI', 'OKR', 'ROI', 'SKALA', 'WIN-WIN', 'DISRUPTA',
  'KÖR!', 'ÄG DET', 'AGILT', 'IMPACT', 'PASSION', 'TILLVÄXT', 'ROCKSTJÄRNA', 'KROSSA', 'NINJA', 'HÄVSTÅNG'];
const LONG = ['ÅTERKOPPLA', 'DJUPDYK', 'FLYTTA NÅLEN', 'BANDBREDD', 'TÄNK UTANFÖR BOXEN', 'LÅGT HÄNGANDE FRUKT', 'GE 110%',
  'INGET JAG I LAG', 'MISSLYCKAS SNABBT', 'VAR FÖRÄNDRINGEN', 'UPP OCH GNETA', 'TA DET OFFLINE', 'PARADIGMSKIFTE',
  'BÄSTA PRAXIS', 'VI ÄR EN FAMILJ', 'KOKA HAVET', 'VI STÄMMER AV', 'JOBBA HÅRT, LEK HÅRT', 'ENLIGT MITT SENASTE MEJL'];
const BIG = ['DRIV!', 'GNETA!', '10X!', 'DRÖM STORT!', 'INGA URSÄKTER!', 'KROSSA!', 'KÖR KÖR KÖR!'];
const WALL = ['DISRUPTA', 'PIVOT', 'SKALA', '10X'];
const TAUNTS = ['Säg det med mig!', 'Misslyckande är bara data!', 'Skriver ni ner det här?', 'Jag vaknar 03:45!',
  'Din komfortzon ringde!', 'Energicheck!', 'Var en svamp!', 'Ge grannen en high five!'];
const HIT_LINES = ['+1 att göra-punkt', 'Bokad på avstämning 16:00', 'Kopia på mejltråd', 'Jour i helgen', 'Ny intressent', 'Svara alla-storm'];
const PHASES = [
  { name: 'TANKESÄTT', line: 'Nu blir vi motiverade!' },
  { name: 'DRIV', line: 'Vem är hungrig på framgång?' },
  { name: 'SYNERGI', line: 'Tillsammans är vi starka!' },
  { name: 'DISRUPTION', line: 'Dags att disrupta dig själv!' },
  { name: 'GNET', line: 'Sömn är för dem som ger upp!' },
  { name: '10X ALLT', line: 'Nu 10X:ar vi allt!!' },
];

// ---- 3×5-pixeltypsnitt för slogans på canvasen (Å Ä Ö ritas som A/O med märken ovanför) ------
const GLYPH = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111',
  F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010',
  K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010',
  P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
  U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010',
  Z: '111001010100111', 0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110',
  4: '101101111001001', 5: '111100110001110', 6: '011100111101111', 7: '111001010010010', 8: '111101111101111',
  9: '111101111001110', ' ': '000000000000000', '!': '010010010000010', '?': '110001010000010', '.': '000000000000010',
  ',': '000000000010100', '-': '000000111000000', ':': '000010000010000', "'": '010010000000000', '/': '001001010100100',
  '%': '101001010100101', '+': '000010111010000',
};
const ACCENT = { Å: ['A', [[1, -2]]], Ä: ['A', [[0, -2], [2, -2]]], Ö: ['O', [[0, -2], [2, -2]]] };
const textCache = new Map();
function textSprite(str, o) {
  str = str.toUpperCase();
  const key = `${str}|${o.color}|${o.plate}|${o.border}|${o.pad}|${o.scale}`;
  let c = textCache.get(key);
  if (c) return c;
  const s = o.scale || 1, pad = o.pad || 0, top = /[ÅÄÖ]/.test(str) ? 2 * s : 0;
  c = mk(str.length * 4 * s - s + pad * 2, 5 * s + top + pad * 2);
  const x = c.getContext('2d');
  if (o.plate) {
    x.fillStyle = o.border || o.plate;
    x.fillRect(1, 0, c.width - 2, c.height); x.fillRect(0, 1, c.width, c.height - 2);
    if (o.border) { x.fillStyle = o.plate; x.fillRect(1, 1, c.width - 2, c.height - 2); }
  }
  x.fillStyle = o.color;
  for (let i = 0; i < str.length; i++) {
    const acc = ACCENT[str[i]];
    const g = GLYPH[acc ? acc[0] : str[i]] || GLYPH['?'];
    const gx = pad + i * 4 * s, gy = pad + top;
    for (let p = 0; p < 15; p++) if (g[p] === '1') x.fillRect(gx + (p % 3) * s, gy + ((p / 3) | 0) * s, s, s);
    if (acc) for (const [mx, my] of acc[1]) x.fillRect(gx + mx * s, gy + my * s, s, s);
  }
  textCache.set(key, c);
  return c;
}
function drawText(ctx, str, x, y, o, align = 'left') {
  const spr = textSprite(str, o);
  const dx = align === 'center' ? x - spr.width / 2 : align === 'right' ? x - spr.width : x;
  ctx.drawImage(spr, Math.round(dx), Math.round(y));
}
const WS = {
  w1: { color: '#ffc23d', plate: '#120f26', border: '#ffc23d', pad: 2 },
  w2: { color: '#ff5a86', plate: '#120f26', border: '#ff5a86', pad: 2 },
  w3: { color: '#5ee0ff', plate: '#120f26', border: '#5ee0ff', pad: 2 },
  big: { color: '#120f26', plate: '#ffc23d', border: '#fff3c9', pad: 3, scale: 2 },
  banner: { color: '#f1ede0', plate: '#2a3a8c', border: '#f1ede0', pad: 2 },
};

// ---- John Vantage (ritas i dubbel storlek) ------------------------------------------------
const BOSS_ROWS = [
  '........hhhhhh', '......hhHHHhhhhh', '.....hhHHhhhhhhhh', '.....hhhhhhhhhhhh', '.....hskksssskksh',
  '....gsswksssswkssg', '....gsssssSSsssssg', '....gsSssssssssSsg', '....gskTTTTTTTTks', '.....GkTmmmmmmTks',
  '.....sskTTTTTTkss', '......sskkkkkkss', '.......ssssssss', '.........ssss', '.....nnnwwyywwnnn',
  '...nnnnnnwyywnnnnnn', '...nnNnnnnyynnnnNnn', '...nnNnnnnyynnnnNnn', '....nnNnnnyynnnNnn', '....nnnnnnyynnnnnn',
  '....kkkkkkyykkkkkk', '.....ppppp..ppppp', '.....ppppp..ppppp', '.....ppppp..ppppp', '....kkkkkk..kkkkkk',
];
const BOSS_PAL = { h: '#2b1a12', H: '#7a5236', s: '#e7a873', S: '#c07f52', k: '#1a0f1a', w: '#ffffff', T: '#fffbe8',
  m: '#8c1d33', g: '#9aa0b4', G: '#2a2a30', n: '#2a3a8c', N: '#4459c4', y: '#ffc23d', p: '#1b2252' };
function makeSprite(rows, pal, solid) {
  const c = mk(Math.max(...rows.map((r) => r.length)), rows.length), x = c.getContext('2d');
  rows.forEach((r, y) => { for (let i = 0; i < r.length; i++) if (pal[r[i]]) { x.fillStyle = solid || pal[r[i]]; x.fillRect(i, y, 1, 1); } });
  return c;
}
let sprBoss, sprBossFlash; // skapas först när minispelet startar
const ORB_COL = { pink: '#ff5a86', cyan: '#5ee0ff', amber: '#ffc23d', blue: '#8aa4ff' };
const ORBS = {};
function makeOrb(r, col) {
  const s = r * 2 + 3, c = mk(s, s), x = c.getContext('2d'), cc = r + 1;
  for (let py = 0; py < s; py++) for (let px = 0; px < s; px++) {
    const d = Math.hypot(px - cc, py - cc);
    if (d > r + 0.6) continue;
    x.fillStyle = d <= r - 0.4 ? col : '#0a0818';
    if (Math.hypot(px - cc + r * 0.35, py - cc + r * 0.35) <= r * 0.45) x.fillStyle = '#ffffff';
    x.fillRect(px, py, 1, 1);
  }
  return c;
}
function initSprites() {
  if (sprBoss) return;
  sprBoss = makeSprite(BOSS_ROWS, BOSS_PAL);
  sprBossFlash = makeSprite(BOSS_ROWS, BOSS_PAL, '#f1ede0');
  for (const k in ORB_COL) ORBS[k] = { 2: makeOrb(2, ORB_COL[k]), 3: makeOrb(3, ORB_COL[k]) };
}

// ---- Bakgrund: hörsal med projektorduk, ritas om när agendapunkten byts --------------------
function buildBG(phase) {
  const c = mk(W, H), x = c.getContext('2d');
  const r = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
  r(0, 0, W, H, '#120f26');
  r(0, 0, W, 120, '#17133a');
  // strålkastare snett uppifrån mot scenen, rastrerad
  x.fillStyle = '#231d52';
  for (let y = 0; y < FLOOR; y++) {
    const a0 = 300 - y * 0.55, a1 = 314 - y * 0.05;
    for (let xx = Math.max(0, Math.floor(a0 - y * 0.3)); xx < Math.min(W, a1); xx++) if (((xx + y) & 1) === 0) x.fillRect(xx, y, 1, 1);
  }
  // projektorduk
  r(41, 31, 182, 72, '#0a0818'); r(40, 29, 182, 72, '#3d3678'); r(41, 30, 180, 70, '#221d4a');
  const dim = '#3f3a80', muted = '#5b54a6';
  drawTo(x, 'VÄCK DIN INRE 10X - JOHN VANTAGE', 131, 35, { color: dim }, 'center');
  drawTo(x, PHASES[phase].name, 131, 50, { color: muted, scale: 3 }, 'center');
  drawTo(x, `AGENDAPUNKT ${phase + 1}/6`, 46, 92, { color: dim });
  for (let i = 0; i < 5; i++) { const h = 4 + i * 5 + (i === 4 ? 8 : 0); r(184 + i * 7, 96 - h, 5, h, dim); }
  // scen till höger och publikens stolsrader längst ner
  r(244, FLOOR, W - 244, H - FLOOR, '#2b2250'); r(244, FLOOR, W - 244, 1, '#5a4520');
  r(0, FLOOR + 1, 244, H - FLOOR, '#0d0b1d');
  x.fillStyle = '#1a1638';
  for (let xx = 4; xx < 236; xx += 16) { r(xx, 160, 11, 1, '#1a1638'); r(xx - 1, 161, 13, 7, '#1a1638'); r(xx, 168, 2, 4, '#1a1638'); r(xx + 9, 168, 2, 4, '#1a1638'); }
  // UTGÅNG-skyltar som man aldrig når
  r(6, 112, 27, 9, '#0d2a1c'); drawTo(x, 'UTGÅNG', 8, 113, { color: '#3ddc84' });
  return c;
}
function drawTo(x, str, px, py, o, align = 'left') {
  const spr = textSprite(str, o);
  const dx = align === 'center' ? px - spr.width / 2 : align === 'right' ? px - spr.width : px;
  x.drawImage(spr, Math.round(dx), Math.round(py));
}

// ---- Skott --------------------------------------------------------------------------------
function push(f, b) { if (f.bullets.length < 650) f.bullets.push(b); return b; }
function orb(f, x, y, ang, spd, col, r, o = {}) {
  return push(f, { k: 0, x, y, ang, spd, spr: ORBS[col][r], r, col: ORB_COL[col], acc: 0, dang: 0, max: 999, age: 0, ...o });
}
function word(f, x, y, ang, spd, text, style = 'w1', o = {}) {
  const spr = textSprite(text, WS[style]);
  return push(f, { k: 1, x, y, ang, spd, spr, hw: spr.width / 2 - 1, hh: spr.height / 2 - 1, col: WS[style].border, acc: 0, dang: 0, max: 999, age: 0, ...o });
}
const mouth = (f) => [f.boss.x, f.boss.fy - 31];
const aim = (f) => { const [mx, my] = mouth(f); return Math.atan2(f.pl.y - my, f.pl.x - mx); };
function every(f, key, iv, dt) { f.timers[key] = (f.timers[key] || 0) + dt; let n = 0; while (f.timers[key] >= iv) { f.timers[key] -= iv; n++; } return n; }
function ring(f, n, spd, col, r, off, o) { const [mx, my] = mouth(f); for (let k = 0; k < n; k++) orb(f, mx, my, off + k * TAU / n, spd, col, r, o); }
function rainWord(f, lo, hi) {
  const b = word(f, rand(14, 236), -6, PI / 2, rand(lo, hi), pick(SHORT), pick(['w1', 'w2', 'w3']));
  b.wob = rand(8, 18); b.wf = rand(1.5, 3); b.wp = rand(0, TAU);
}
function wall(f) { // en kolumn ord som glider in från höger, med en lucka någonstans
  const gy = rand(AREA.y0 + 14, AREA.y1 - 14), gh = 34;
  for (let y = 24; y < H; y += 12) if (Math.abs(y - gy) > gh / 2 + 5) word(f, W + 20, y, PI, 40, pick(WALL), 'w2');
}
function banner(f) { word(f, rand(30, 220), -8, PI / 2, 32, pick(LONG), 'banner'); }

const PATTERNS = [
  (f, dt) => { // TANKESÄTT: siktade ord i solfjäder + ringar
    const [mx, my] = mouth(f);
    for (let i = every(f, 'a', 1.0, dt); i--;) { const a = aim(f); [-0.3, 0, 0.3].forEach((o) => word(f, mx, my, a + o, 52, pick(SHORT), pick(['w1', 'w2', 'w3']))); f.boss.point = 0.4; }
    for (let i = every(f, 'b', 2.6, dt); i--;) ring(f, 16, 42, 'pink', 2, rand(0, TAU));
  },
  (f, dt) => { // DRIV: dubbelspiral + stora ord
    const [mx, my] = mouth(f);
    for (let i = every(f, 'a', 0.07, dt); i--;) { f.spin += 0.21; orb(f, mx, my, f.spin, 56, 'cyan', 2); orb(f, mx, my, f.spin + PI, 56, 'cyan', 2); }
    for (let i = every(f, 'b', 1.7, dt); i--;) { word(f, mx, my, aim(f), 70, pick(BIG), 'big'); f.boss.point = 0.4; }
  },
  (f, dt) => { // SYNERGI: ord regnar från taket + två spiraler som korsar varandra
    for (let i = every(f, 'a', 0.42, dt); i--;) rainWord(f, 34, 56);
    for (let i = every(f, 'b', 2.0, dt); i--;) {
      const off = rand(0, TAU);
      ring(f, 12, 40, 'amber', 2, off, { dang: 0.45 });
      ring(f, 12, 40, 'blue', 2, off, { dang: -0.45 });
    }
  },
  (f, dt) => { // DISRUPTION: ordväggar med en lucka + siktade kulor
    const [mx, my] = mouth(f);
    for (let i = every(f, 'a', 2.3, dt); i--;) wall(f);
    for (let i = every(f, 'b', 0.85, dt); i--;) { const a = aim(f); [-0.2, 0, 0.2].forEach((o) => orb(f, mx, my, a + o, 72, 'pink', 3)); f.boss.point = 0.4; }
  },
  (f, dt) => { // GNET: femarmad blomma som accelererar + långa banderoller från taket
    const [mx, my] = mouth(f);
    if (every(f, 'flip', 3.2, dt)) f.spinDir *= -1;
    for (let i = every(f, 'a', 0.14, dt); i--;) { f.spin += 0.19 * f.spinDir; for (let k = 0; k < 5; k++) orb(f, mx, my, f.spin + k * TAU / 5, 22, 'amber', 3, { acc: 40, max: 82 }); }
    for (let i = every(f, 'b', 2.6, dt); i--;) banner(f);
  },
  (f, dt) => { // 10X ALLT: lite av allt
    const [mx, my] = mouth(f);
    for (let i = every(f, 'a', 0.1, dt); i--;) { f.spin += 0.27; for (let k = 0; k < 3; k++) orb(f, mx, my, f.spin + k * TAU / 3, 54, 'pink', 2); }
    for (let i = every(f, 'b', 1.5, dt); i--;) { word(f, mx, my, aim(f), 68, pick(BIG), 'big'); f.boss.point = 0.4; }
    for (let i = every(f, 'c', 0.85, dt); i--;) rainWord(f, 38, 56);
  },
];

// ---- Effekter -----------------------------------------------------------------------------
function part(f, x, y, vx, vy, life, col, s = 1, grav = 0) { if (f.parts.length < 800) f.parts.push({ x, y, vx, vy, life, max: life, col, s, grav }); }
function clearBullets(f) {
  for (const b of f.bullets) part(f, b.x, b.y, rand(-10, 10), rand(-30, -10), rand(0.3, 0.6), b.col);
  f.bullets.length = 0;
}
function johnSay(g, text, ttl = 2.2) {
  const f = g.flags;
  g.say(text, f.john, '', ttl);
}

function enterPhase(g, ph) {
  const f = g.flags;
  f.phase = ph; f.timers = {};
  if (ph > 0) { clearBullets(f); g.sfx.slide(); }
  f.bg = buildBG(ph);
  g.shout(`${ph + 1}/6 ${PHASES[ph].name}`);
  f.shoutT = 1.4;
  johnSay(g, PHASES[ph].line, 2.4);
  f.tauntT = rand(7, 10);
}

function hit(g) {
  const f = g.flags, p = f.pl;
  f.lives--;
  g.stats.hits++;
  g.sfx.bonk();
  f.shake = 5; f.flash = 0.35;
  for (let i = 0; i < 22; i++) part(f, p.x, p.y, rand(-70, 70), rand(-90, 20), rand(0.5, 1.1), pick(['#f1ede0', '#ffc23d', '#9fd0ff']), 2, 160);
  clearBullets(f);
  p.inv = 2.2;
  g.say(pick(HIT_LINES), { x: p.x, y: p.y - 16 }, 'me', 1.6);
}

function mute(g) {
  const f = g.flags;
  if (f.mutes <= 0) return;
  f.mutes--;
  clearBullets(f);
  f.boss.mutedUntil = g.t + 2.5;
  f.pl.inv = Math.max(f.pl.inv, 1);
  f.flash = 0.6;
  g.sfx.whoosh(); g.sfx.nope();
  johnSay(g, 'Hallå? Hörs jag?', 1.6);
}

// ---- Minispelet -----------------------------------------------------------------------------
export default {
  id: 'finalfinalboss',
  title: 'FinalFinalBoss',
  tagline: 'Överlev John Vantages keynote i två minuter',
  level: 'kontoret',
  lockPlayer: true,   // vi styr vår egen spelare i update()
  start: 100,         // håller kameran stilla (camX = 0)
  henrik: null,
  time: 120,
  timeoutWins: true,

  intro: [
    ['H', 'Och nu, vår inhyrda keynote-talare: JOHN VANTAGE! Han kostade mer än hela kaffebudgeten.'],
    ['D', 'Varför står han på en saxlift?'],
    ['H', 'Han skjuter slogans i två minuter. Ducka med piltangenterna, Shift för att smyga.'],
    ['H', 'Blir det för mycket: mellanslag tystar honom. Två gånger. Sen är det tekniska problem.'],
  ],
  goal: (g) => `Semesterdagar: ${g.flags.lives} · Tysta John (mellanslag): ${g.flags.mutes} · Duckat: ${g.flags.dodges}`,

  setup(g) {
    initSprites();
    g.flags = {
      lives: LIVES, mutes: MUTES, dodges: 0, phase: -1, timers: {}, spin: 0, spinDir: 1,
      bullets: [], parts: [], shake: 0, flash: 0, shoutT: 0, tauntT: 8, wrapSaid: false, won: false,
      pl: { x: 70, y: 100, inv: 0, moving: false, facing: 1 },
      boss: { x: 280, fy: 120, tx: 280, tfy: 120, t: 2, point: 0, mutedUntil: -1 },
      john: { x: 270, y: 60 },
      bg: buildBG(0),
      lastGraze: 0,
    };
  },

  update(g, dt) {
    const f = g.flags;
    const ph = Math.min(5, Math.floor(g.t / PHASE_LEN));
    if (ph !== f.phase) enterPhase(g, ph);
    const pt = g.t - ph * PHASE_LEN;

    // Du
    const p = f.pl;
    let dx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0), dy = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
    if (dx && dy) { dx *= 0.7071; dy *= 0.7071; }
    const spd = shift ? 50 : 115;
    p.x = clamp(p.x + dx * spd * dt, AREA.x0, AREA.x1);
    p.y = clamp(p.y + dy * spd * dt, AREA.y0, AREA.y1);
    p.moving = !!(dx || dy);
    if (dx) p.facing = Math.sign(dx);
    if (p.inv > 0) p.inv -= dt;
    if (wasPressed('action') && g.t > 0.4) mute(g); // inte samma tryck som stängde introt

    // John på saxliften
    const B = f.boss;
    B.t -= dt;
    if (B.t <= 0) {
      B.t = rand(1.8, 3);
      const narrow = ph === 1 || ph === 4 || ph === 5;
      B.tx = rand(266, 294);
      B.tfy = narrow ? rand(96, 130) : rand(80, 150);
    }
    const k = Math.min(1, dt * 1.5);
    B.x += (B.tx - B.x) * k; B.fy += (B.tfy - B.fy) * k;
    if (B.point > 0) B.point -= dt;
    f.john.x = B.x; f.john.y = B.fy - 54;

    const muted = g.t < B.mutedUntil;
    if (pt > 1.2 && g.t < FIRE_STOP && !muted) PATTERNS[ph](f, dt);
    if (g.t >= FIRE_STOP && !f.wrapSaid) { f.wrapSaid = true; johnSay(g, 'Och det var allt!', 2); }
    f.tauntT -= dt;
    if (f.tauntT <= 0 && !muted && g.t < FIRE_STOP) { johnSay(g, pick(TAUNTS), 1.8); f.tauntT = rand(7, 10); }
    if (f.shoutT > 0) { f.shoutT -= dt; if (f.shoutT <= 0) g.shout(null); }

    // Skotten
    for (let i = f.bullets.length - 1; i >= 0; i--) {
      const b = f.bullets[i];
      b.age += dt;
      if (b.acc) b.spd = Math.min(b.max, b.spd + b.acc * dt);
      if (b.dang) b.ang += b.dang * dt;
      b.x += Math.cos(b.ang) * b.spd * dt;
      b.y += Math.sin(b.ang) * b.spd * dt;
      if (b.wob) b.x += Math.cos(b.age * b.wf + b.wp) * b.wob * dt;
      const ex = b.k ? b.hw : b.r;
      if (b.x + ex < -40 || b.x - ex > W + 60 || b.y - ex > H + 4 || b.y < -60 || b.age > 18) {
        f.bullets[i] = f.bullets[f.bullets.length - 1]; f.bullets.pop(); continue;
      }
      if (p.inv > 0) continue;
      let d;
      if (b.k) d = Math.hypot(Math.max(Math.abs(b.x - p.x) - b.hw, 0), Math.max(Math.abs(b.y - p.y) - b.hh, 0));
      else d = Math.hypot(b.x - p.x, b.y - p.y) - (b.r - 0.5);
      if (d < 1.5) { hit(g); if (f.lives <= 0) return 'fail'; break; }
      if (d < 9 && !b.gz) {
        b.gz = 1; f.dodges++;
        part(f, (b.x + p.x) / 2, (b.y + p.y) / 2, rand(-20, 20), rand(-30, -5), 0.3, '#f1ede0');
        if (g.t - f.lastGraze > 0.06) { f.lastGraze = g.t; g.sfx.click(); }
      }
    }

    for (let i = f.parts.length - 1; i >= 0; i--) {
      const q = f.parts[i];
      q.life -= dt; q.vy += q.grav * dt; q.x += q.vx * dt; q.y += q.vy * dt;
      if (q.life <= 0 || q.y > H + 10) { f.parts[i] = f.parts[f.parts.length - 1]; f.parts.pop(); }
    }
    if (f.shake > 0) f.shake = Math.max(0, f.shake - dt * 20);
    if (f.flash > 0) f.flash = Math.max(0, f.flash - dt * 1.6);
  },

  onWin(g) {
    const f = g.flags;
    clearBullets(f);
    f.won = true;
    g.shout(null);
    for (let i = 0; i < 120; i++) part(f, rand(0, W), rand(-40, 0), rand(-20, 20), rand(20, 70), rand(2, 4), pick(['#ffc23d', '#ff5a86', '#5ee0ff', '#f1ede0']), 2, 20);
  },

  draw(g, ctx) {
    const f = g.flags, t = g.time;
    ctx.save();
    if (f.shake > 0) ctx.translate(Math.round(rand(-f.shake, f.shake)), Math.round(rand(-f.shake, f.shake)));
    ctx.drawImage(f.bg, 0, 0);

    // Saxlift
    const B = f.boss, fy = Math.round(B.fy), bx = Math.round(B.x);
    ctx.fillStyle = '#5a5f70'; ctx.fillRect(bx - 22, fy, 44, 3);
    ctx.fillStyle = '#ffc23d'; for (let i = 0; i < 44; i += 6) ctx.fillRect(bx - 22 + i, fy + 1, 3, 1);
    const segs = Math.max(1, Math.round((FLOOR - fy - 6) / 12)), sh = (FLOOR - fy - 6) / segs;
    ctx.fillStyle = '#8a8fa0';
    for (let s = 0; s < segs; s++) for (let i = 0; i <= 36; i += 2) {
      const yy = fy + 3 + s * sh + (i / 36) * sh;
      ctx.fillRect(bx - 18 + i, Math.round(yy), 1, 1);
      ctx.fillRect(bx + 18 - i, Math.round(yy), 1, 1);
    }
    ctx.fillStyle = '#3a3f4a'; ctx.fillRect(bx - 22, FLOOR - 4, 44, 4);

    // John
    const bob = Math.round(Math.sin(t * 3));
    const jitter = !f.won && f.phase === 5 && g.t > 0 ? (Math.random() < 0.5 ? -1 : 1) : 0;
    const ox = bx - 22 + jitter, oy = fy - 50 + bob * 2;
    const muted = g.t < B.mutedUntil;
    ctx.drawImage(muted && ((t * 8) | 0) % 2 ? sprBossFlash : sprBoss, ox, oy, sprBoss.width * 2, sprBoss.height * 2);
    const wave = Math.sin(t * 4) * 0.3;
    let aL = -2.45 + wave, aR = -0.7 - wave;
    if (muted || f.won) { aL = 2.0; aR = 1.15; }
    else if (B.point > 0) aL = Math.atan2(f.pl.y - (oy + 31), f.pl.x - (ox + 9));
    const arm = (sx, sy, a) => {
      const at = (d) => [ox + Math.round(sx + Math.cos(a) * d) * 2 - 2, oy + Math.round(sy + Math.sin(a) * d) * 2 - 2];
      ctx.fillStyle = '#2a3a8c';
      for (let i = 0; i <= 6.5; i += 0.5) { const [ax, ay] = at(i); ctx.fillRect(ax, ay, 4, 4); }
      ctx.fillStyle = '#ffffff'; { const [ax, ay] = at(7); ctx.fillRect(ax, ay, 4, 4); }
      ctx.fillStyle = '#e7a873'; { const [ax, ay] = at(8.5); ctx.fillRect(ax, ay, 4, 4); }
    };
    arm(4, 15, aL);
    arm(17, 15, aR);

    // Du (träffpunkten är mitt på bröstet)
    const p = f.pl;
    const blink = p.inv > 0 && ((t * 14) | 0) % 2 === 0;
    if (!blink) drawPerson(ctx, p.x, Math.round(p.y) + 15, PLAYER, p.facing, t, p.moving);
    if (shift) {
      ctx.fillStyle = '#ff5a86'; ctx.fillRect(Math.round(p.x) - 2, Math.round(p.y) - 2, 4, 4);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 2, 2);
    }

    for (const b of f.bullets) ctx.drawImage(b.spr, Math.round(b.x - b.spr.width / 2), Math.round(b.y - b.spr.height / 2));
    for (const q of f.parts) {
      if (q.life < q.max * 0.3 && ((t * 20) | 0) % 2) continue;
      ctx.fillStyle = q.col; ctx.fillRect(Math.round(q.x), Math.round(q.y), q.s, q.s);
    }
    ctx.restore();

    // Agendan längst ner: sex punkter à 20 sekunder
    ctx.fillStyle = '#0a0818'; ctx.fillRect(0, H - 3, W, 3);
    const ph = Math.max(0, f.phase), pt = clamp((g.t - ph * PHASE_LEN) / PHASE_LEN, 0, 1);
    for (let k = 0; k < 6; k++) {
      const x0 = k * (W / 6) + 1, w = W / 6 - 2;
      ctx.fillStyle = k < ph || f.won ? '#7a5a1a' : k === ph ? '#3a2f60' : '#221d4a';
      ctx.fillRect(x0, H - 2, w, 1);
      if (k === ph && !f.won && g.t > 0) { ctx.fillStyle = '#ffc23d'; ctx.fillRect(x0, H - 2, Math.round(w * pt), 1); }
    }
    if (f.flash > 0) { ctx.fillStyle = `rgba(241,237,224,${f.flash.toFixed(3)})`; ctx.fillRect(0, 0, W, H); }
  },

  win: [
    ['H', 'Stående ovationer! Eller, du stod upp. Det räknas.'],
    ['D', 'Jag har "flytta nålen" inbränt på näthinnan.'],
    ['H', 'John har lovat att mejla ut sina slides. Det kommer han aldrig att göra.'],
  ],
  fail: [
    ['H', 'Slut på semesterdagar! Du har fått en åtgärdsplan.'],
    ['H', 'Goda nyheter: John leder workshoppen. Från början!'],
  ],
};
