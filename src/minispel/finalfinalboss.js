// MUG (FinalFinalBoss): medarbetarundersökningen, live, med VD-coachen Segertoft i slottets konferensrum.
// Segertoft står på en saxlift till höger, framför en PowerPoint med Saab Gripen, och skjuter
// några få stora, långsamma blobbar med sina slogans: Uppåt! Framåt! Plantera ett träd! Silos!
// Lyft på tälten! Flip it, Fix it! Du kan inte slå tillbaka: överlev i en minut.
// Piltangenterna styr fritt, Shift = långsamt och visar träffpunkten (pricken på bröstet),
// mellanslag = tysta Segertoft (rensar skärmen, 2 gånger).
// Sex agendapunkter à 10 sekunder, en per slogan (se PHASES). Medvetet lätt.
// Sista kapitlet före spat i berättelsen (src/story.js). Stationen är Konferensrummet i Haga.
import { keys, wasPressed } from '../input.js';
import { WIDTH as W, HEIGHT as H, pick, rand } from '../world.js';
import { drawPerson, PLAYER } from '../sprites.js';
import { power } from '../powerups.js';

const TAU = Math.PI * 2, PI = Math.PI;
const LIVES = 3, MUTES = 2, PHASE_LEN = 10, FIRE_STOP = 57.5;
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
const TAUNTS = ['Lyft på tälten, folk!', 'Uppåt! Framåt! Uppåt igen!', 'Har alla planterat sitt träd?', 'Jobba smartare! Inte hårdare! Fast också hårdare!',
  'Jag ser silos! Jag ser SILOS!', 'Flip it! Fix it! Flip it igen!', 'Vem har Gripen-spellistan?!', 'Jag är inte chef. Jag är coach.',
  'Det här är ingen presentation. Det är en RESA!', 'Högt i tak! Lågt till golv!', 'Nästa bild! Nej, den förra! Nej, Gripen!',
  'Ni ser trötta ut! Det är bara svaghet som lämnar kroppen!', 'Tänk Gripen: snabb, smidig, svensk!'];
const HIT_LINES = ['+1 action point', 'Inbjuden till styrgruppen', 'Ny OKR', 'Kickoff i helgen', 'Omorganiserad!', 'Flyttad till ny silo', 'Planterat 0 träd'];
// En slogan per agendapunkt. Blobbarna bär agendapunktens slogan (ibland en annan).
const PHASES = [
  { name: 'UPPÅT!', line: 'Vart ska vi? UPPÅT!' },
  { name: 'FRAMÅT!', line: 'Och sen? FRAMÅT!' },
  { name: 'PLANTERA ETT TRÄD!', line: 'Varje idé är ett frö. Plantera ett träd!' },
  { name: 'SILOS!', line: 'Jag ser silos! Överallt silos!' },
  { name: 'LYFT PÅ TÄLTEN!', line: 'Lyft på tälten! Allihop!' },
  { name: 'FLIP IT, FIX IT!', line: 'Flip it! Fix it! Flip it, fix it!' },
];
const BLOB_COLS = ['#ff7aa0', '#7fe8ff', '#ffd25e', '#8ef08a', '#a8b8ff', '#ffa86a'];

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
  green: { color: '#7dff8a', plate: '#0f2416', border: '#7dff8a', pad: 2 },
  silo: { color: '#1b1b2a', plate: '#b8bcc8', border: '#eef0f6', pad: 2 },
  song: { color: '#ffffff', plate: '#3a1a5c', border: '#e05cff', pad: 2 },
};

// ---- Segertoft (ritas i dubbel storlek) ------------------------------------------------
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
const ORB_COL = { pink: '#ff5a86', cyan: '#5ee0ff', amber: '#ffc23d', blue: '#8aa4ff', green: '#5fe06a', red: '#ff3b3b' };
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
// En stor blob med en slogan på: en pixlig ellips med kontur, glans och texten i mitten
const blobCache = new Map();
function blobSprite(text, col) {
  const key = text + col;
  if (blobCache.has(key)) return blobCache.get(key);
  const t = textSprite(text, { color: '#1b1b2a' });
  const w = t.width + 20, h = 26, c = mk(w, h), x = c.getContext('2d');
  const cx = (w - 1) / 2, cy = (h - 1) / 2, rx = w / 2, ry = h / 2;
  for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
    const e = ((px - cx) / rx) ** 2 + ((py - cy) / ry) ** 2;
    if (e > 1) continue;
    x.fillStyle = e > 0.8 ? '#0a0818' : ((px - cx + rx * 0.45) / rx) ** 2 + ((py - cy + ry * 0.45) / ry) ** 2 < 0.06 ? '#ffffff' : col;
    x.fillRect(px, py, 1, 1);
  }
  x.drawImage(t, Math.round((w - t.width) / 2), Math.round((h - t.height) / 2) + (t.height > 5 ? 1 : 0));
  blobCache.set(key, c);
  return c;
}
function blob(f, text, ang, spd) {
  const [mx, my] = mouth(f);
  const spr = blobSprite(text, pick(BLOB_COLS));
  return push(f, { k: 2, x: mx, y: my, ang, spd, spr, rx: spr.width / 2 - 3, ry: spr.height / 2 - 3, hw: spr.width / 2,
    col: '#f1ede0', acc: 0, dang: 0, max: 999, age: 0, wob: rand(6, 12), wf: rand(1.5, 2.5), wp: rand(0, TAU) });
}

// Saab Gripen från sidan, nosen åt höger (på bilden och som flygplan i sista agendapunkten)
const GRIPEN_ROWS = [
  '......ff............................',
  '......fff...........................',
  '......ffff..........................',
  '......fffff...................cc....',
  '....fffffffgggggggggggggggggggcccg..',
  'rr.dggggggggggggggggggggggggggggggg.',
  'rrrdgggggggggggggggggggggggggggggggg',
  'rr.dddggggLLLLLLLLLLLgggggkkgggggg..',
  '.......LLLLLLLLLLLLLL....kkk........',
  '..........LLLLLLLL..................',
];
const GRIPEN_PAL = { f: '#7d8496', g: '#a9afbd', d: '#5a6070', c: '#5ee0ff', L: '#80879a', k: '#6a7184', r: '#ff9a3d' };
let sprGripen;
function initSprites() {
  if (sprBoss) return;
  sprGripen = makeSprite(GRIPEN_ROWS, GRIPEN_PAL);
  sprBoss = makeSprite(BOSS_ROWS, BOSS_PAL);
  sprBossFlash = makeSprite(BOSS_ROWS, BOSS_PAL, '#f1ede0');
  for (const k in ORB_COL) ORBS[k] = { 2: makeOrb(2, ORB_COL[k]), 3: makeOrb(3, ORB_COL[k]) };
}

// ---- Bakgrund: slottets konferensrum, nedsläckt för PowerPoint. Ritas om varje agendapunkt ----
function buildBG(phase) {
  const c = mk(W, H), x = c.getContext('2d');
  const r = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
  // Tapet med ränder och medaljonger, takgesims med tandsnitt
  r(0, 0, W, H, '#241c33');
  for (let xx = 0; xx < W; xx += 8) r(xx, 10, 3, 104, '#2a2140');
  for (let xx = 4; xx < W; xx += 16) for (let yy = 20; yy < 110; yy += 18) { r(xx, yy + 1, 3, 1, '#3a2d4c'); r(xx + 1, yy, 1, 3, '#3a2d4c'); }
  r(0, 0, W, 7, '#1a1426'); r(0, 7, W, 2, '#6b5526'); r(0, 9, W, 1, '#3a2d1a');
  for (let xx = 1; xx < W; xx += 4) r(xx, 5, 2, 2, '#4a3b1c');
  // Boaserad panel nedtill
  r(0, 114, W, FLOOR - 114, '#2e2236'); r(0, 114, W, 1, '#6b5526');
  for (let xx = 4; xx < W; xx += 26) { r(xx, 119, 20, 1, '#46354e'); r(xx, 119, 1, 40, '#46354e'); r(xx + 19, 119, 1, 40, '#1d1626'); r(xx, 158, 20, 1, '#1d1626'); }
  // Högt spröjsat fönster med Mälaren i skymning
  r(5, 18, 30, 86, '#6b5526'); r(7, 20, 26, 82, '#1b2b48');
  r(7, 70, 26, 12, '#24406a'); r(7, 82, 26, 20, '#16324e');
  for (let i = 0; i < 6; i++) r(9 + i * 4, 84 + (i % 2) * 3, 2, 1, '#5d7fa8');
  r(7, 64, 26, 6, '#183020'); r(19, 20, 2, 82, '#6b5526'); r(7, 44, 26, 2, '#6b5526'); r(7, 72, 26, 2, '#6b5526');
  r(3, 102, 34, 3, '#7a6230');
  // Kristallkrona och sammetsdraperi vid scenen
  r(236, 0, 1, 14, '#6b5526'); r(228, 14, 17, 2, '#c9a24a'); r(230, 16, 13, 3, '#8a6f2a');
  for (let i = 0; i < 5; i++) { r(229 + i * 4, 11, 1, 3, '#fff3c9'); r(230 + i * 3, 19 + (i % 2), 1, 2, '#e8f4ff'); }
  r(302, 9, W - 302, FLOOR - 9, '#5a1a2a');
  for (let yy = 9; yy < FLOOR; yy++) { r(305 + Math.round(Math.sin(yy * 0.2) * 1.5), yy, 1, 1, '#7a2a3a'); r(312 + Math.round(Math.cos(yy * 0.2) * 1.5), yy, 1, 1, '#3a0f1a'); }
  r(300, 9, W - 300, 5, '#c9a24a');
  // Projektorduken med PowerPoint
  r(41, 31, 182, 74, '#0a0818'); r(40, 29, 182, 74, '#c9c6d6'); r(42, 31, 178, 70, '#f4f4fa');
  r(42, 31, 178, 10, '#1b3c8c'); r(42, 41, 178, 1, '#ffc23d');
  drawTo(x, 'SEGERTOFT - UPPÅT! FRAMÅT! 2027', 131, 33, { color: '#ffffff' }, 'center');
  drawTo(x, PHASES[phase].name, 131, 45, { color: '#1b3c8c', scale: 2 }, 'center');
  // Saab Gripen i full fart, med fartstreck
  x.drawImage(sprGripen, 52, 64, sprGripen.width * 2, sprGripen.height * 2);
  for (let i = 0; i < 4; i++) r(44, 70 + i * 3, 6 - i, 1, '#b8bcc8');
  drawTo(x, 'SNABB. SMIDIG. SVENSK.', 92, 86, { color: '#5a6070' }, 'center');
  // "Uppåt!"-graf med pil
  for (let i = 0; i < 5; i++) { const h = 4 + i * 5 + (i === 4 ? 6 : 0); r(160 + i * 9, 96 - h, 6, h, i === 4 ? '#3ddc84' : '#8aa4ff'); }
  for (let i = 0; i < 40; i++) r(158 + i, 80 - Math.round(i * 0.55), 2, 1, '#ff5a86');
  r(197, 56, 4, 1, '#ff5a86'); r(199, 57, 1, 3, '#ff5a86');
  drawTo(x, `BILD ${phase + 1}/6`, 46, 95, { color: '#9aa0b4' });
  drawTo(x, 'KONFIDENTIELLT', 216, 95, { color: '#ff5a86' }, 'right');
  // Projektor på ett bord, med en svag ljuskägla mot duken
  x.fillStyle = 'rgba(255,250,220,0.05)';
  x.beginPath(); x.moveTo(128, 148); x.lineTo(42, 31); x.lineTo(220, 31); x.closePath(); x.fill();
  r(110, 150, 40, 3, '#5a3a24'); r(114, 153, 3, 19, '#3a2416'); r(143, 153, 3, 19, '#3a2416');
  r(121, 143, 16, 7, '#3a3f4a'); r(122, 144, 14, 1, '#5a6070'); r(124, 145, 4, 4, '#1a1426'); r(125, 146, 2, 2, '#fffbe8');
  // Parkett, stolsrygg-silhuetter och scenen till höger
  r(0, FLOOR, W, H - FLOOR, '#3a2416');
  for (let xx = 0; xx < W; xx += 6) r(xx, FLOOR + 2 + ((xx / 6) % 2) * 3, 5, 1, '#4e3220');
  for (let xx = 8; xx < 236; xx += 22) { if (xx > 100 && xx < 150) continue; r(xx, 158, 12, 2, '#1d1626'); r(xx + 1, 160, 10, 8, '#1d1626'); r(xx + 1, 168, 2, 4, '#1d1626'); r(xx + 9, 168, 2, 4, '#1d1626'); }
  r(244, FLOOR, W - 244, H - FLOOR, '#4a2a3a'); r(244, FLOOR, W - 244, 1, '#c9a24a');
  // UTGÅNG-skylt som man aldrig når
  r(6, 107, 27, 9, '#0d2a1c'); drawTo(x, 'UTGÅNG', 8, 108, { color: '#3ddc84' });
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
// Några få stora blobbar: en i taget, lite tätare och ibland två mot slutet
function PATTERN(g, f, dt, ph) {
  const iv = 2.6 - ph * 0.12;
  for (let i = every(f, 'a', iv, dt); i--;) {
    const text = Math.random() < 0.75 ? PHASES[ph].name : pick(PHASES).name;
    const a = aim(f) + rand(-0.3, 0.3);
    blob(f, text, a, rand(34, 44));
    if (ph >= 4 && Math.random() < 0.35) blob(f, pick(PHASES).name, a + pick([-0.6, 0.6]), rand(30, 38));
    f.boss.point = 0.5;
  }
}

// ---- Effekter -----------------------------------------------------------------------------
function part(f, x, y, vx, vy, life, col, s = 1, grav = 0) { if (f.parts.length < 800) f.parts.push({ x, y, vx, vy, life, max: life, col, s, grav }); }
function clearBullets(f) {
  for (const b of f.bullets) part(f, b.x, b.y, rand(-10, 10), rand(-30, -10), rand(0.3, 0.6), b.col);
  f.bullets.length = 0;
}
function johnSay(g, text, ttl = 2.6) {
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
  f.tauntT = rand(4, 6);
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
  johnSay(g, pick(['Hallå? Hörs jag?', 'Vem drog ur HDMI:n?!', 'Min Gripen! Min SLIDE!']), 1.8);
}

// ---- Minispelet -----------------------------------------------------------------------------
export default {
  id: 'finalfinalboss',
  powerups: ['speed', 'shield', 'slow', 'quickwin'], // no jump or magnet: you fly freely and dodge
  powerupText: {
    speed: 'Du flyger snabbare i 10 sekunder.',
    shield: 'Johns slogans flyger rakt igenom dig i 10 sekunder.',
    slow: 'Johns slogans går i slowmotion i 6 sekunder. Det gör inte du.',
  }, // what the power-ups mean here
  title: 'MUG',
  tagline: 'Medarbetarundersökningen, live. Överlev Segertoft. Uppåt! Framåt!',
  level: 'kontoret',
  station: { x: 600, label: 'Konferensrummet' },
  lockPlayer: true,   // vi styr vår egen spelare i update()
  start: 100,         // håller kameran stilla (camX = 0)
  henrik: null,
  time: 60,
  timeoutWins: true,

  intro: [
    ['H', 'Och nu, i slottets finaste konferensrum: SEGERTOFT! Han kostade mer än hela kaffebudgeten.'],
    ['D', 'Varför står han på en saxlift? Och varför är det ett stridsflygplan på första bilden?'],
    ['H', 'Gripen är en metafor. För allt. Han skjuter stora slogan-blobbar i en minut. Ducka med piltangenterna, Shift för att smyga.'],
    ['H', 'Blir det för mycket: mellanslag tystar honom. Två gånger. Sen är det tekniska problem.'],
  ],
  goal: (g) => `Semesterdagar: ${g.flags.lives} · Tysta Segertoft (mellanslag): ${g.flags.mutes} · Duckat: ${g.flags.dodges}`,

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

  update(g, dt, realDt = dt) {
    const f = g.flags;
    const ph = Math.min(5, Math.floor(g.t / PHASE_LEN));
    if (ph !== f.phase) enterPhase(g, ph);
    const pt = g.t - ph * PHASE_LEN;

    // Du
    const p = f.pl;
    let dx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0), dy = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
    if (dx && dy) { dx *= 0.7071; dy *= 0.7071; }
    const spd = (shift ? 50 : 115) * (power.speed > 0 ? 1.35 : 1); // "Effektivisera"
    // realDt: in slow motion ("Jobba smartare") the bullets slow down, but you don't
    p.x = clamp(p.x + dx * spd * realDt, AREA.x0, AREA.x1);
    p.y = clamp(p.y + dy * spd * realDt, AREA.y0, AREA.y1);
    p.moving = !!(dx || dy);
    if (dx) p.facing = Math.sign(dx);
    if (p.inv > 0) p.inv -= dt;
    if (wasPressed('action') && g.t > 0.4) mute(g); // inte samma tryck som stängde introt

    // Segertoft på saxliften
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
    if (pt > 0.8 && g.t < FIRE_STOP && !muted) PATTERN(g, f, dt, ph);
    if (g.t >= FIRE_STOP && !f.wrapSaid) { f.wrapSaid = true; johnSay(g, 'Och kom ihåg: UPPÅT! FRAMÅT!', 2.5); }
    f.tauntT -= dt;
    if (f.tauntT <= 0 && !muted && g.t < FIRE_STOP) { johnSay(g, pick(TAUNTS), 2.6); f.tauntT = rand(4, 6); }
    if (f.shoutT > 0) { f.shoutT -= dt; if (f.shoutT <= 0) g.shout(null); }

    // Skotten
    for (let i = f.bullets.length - 1; i >= 0; i--) {
      const b = f.bullets[i];
      b.age += dt;
      if (b.acc) b.spd = clamp(b.spd + b.acc * dt, 0, b.max);
      if (b.dang) b.ang += b.dang * dt;
      b.x += Math.cos(b.ang) * b.spd * dt;
      b.y += Math.sin(b.ang) * b.spd * dt;
      if (b.wob) { // blobbarna gungar lite åt sidan medan de svävar fram
        const w = Math.cos(b.age * b.wf + b.wp) * b.wob * dt;
        b.x -= Math.sin(b.ang) * w; b.y += Math.cos(b.ang) * w;
      }
      const ex = b.k ? b.hw : b.r;
      if (b.x + ex < -40 || b.x - ex > W + 60 || b.y - ex > H + 4 || b.y < -60 || b.age > 18) {
        f.bullets[i] = f.bullets[f.bullets.length - 1]; f.bullets.pop(); continue;
      }
      if (p.inv > 0 || power.shield > 0) continue; // "Uppåt, framåt!" shield: bullets pass through
      let d;
      if (b.k === 2) d = (Math.sqrt(((b.x - p.x) / b.rx) ** 2 + ((b.y - p.y) / b.ry) ** 2) - 1) * Math.min(b.rx, b.ry);
      else if (b.k) d = Math.hypot(Math.max(Math.abs(b.x - p.x) - b.hw, 0), Math.max(Math.abs(b.y - p.y) - b.hh, 0));
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
    g.stats.slogans = (g.stats.slogans ?? 0) + f.dodges;
    g.shout(null);
    for (let i = 0; i < 120; i++) part(f, rand(0, W), rand(-40, 0), rand(-20, 20), rand(20, 70), rand(2, 4), pick(['#ffc23d', '#ff5a86', '#5ee0ff', '#f1ede0']), 2, 20);
  },

  // Name tags: Segertoft on his scissor lift, and you
  labels(g) {
    const f = g.flags;
    if (!f.boss) return [];
    return [{ text: 'Segertoft', x: f.boss.x + g.camX, feetY: f.boss.fy - 24 }, { text: 'Du', x: f.pl.x + g.camX, feetY: f.pl.y + 15 }];
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

    // Segertoft
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
    ['D', 'Jag har "lyft på tälten" inbränt på näthinnan. Och en Gripen.'],
    ['H', 'Segertoft har lovat att mejla ut sina slides. Och spellistan. Det kommer han aldrig att göra.'],
  ],
  fail: [
    ['H', 'Slut på semesterdagar! Du har fått en åtgärdsplan.'],
    ['H', 'Goda nyheter: Segertoft tar det från början. Uppåt! Framåt! Bakåt!'],
  ],
};
