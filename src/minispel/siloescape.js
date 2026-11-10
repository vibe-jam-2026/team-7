// SiloEscape: studsa 800 meter rakt upp ur en silo innan kvartalsfyrverkeriet hinner ikapp.
// Doodle Jump-liknande: du studsar av dig själv på skrivbord, ← → styr. Bilden rör sig sakta uppåt
// och längst ner exploderar det hela tiden; hamnar du i elden är det slut.
//   Skrivbord: vanliga plattformar     Kontorsvagnar: åker fram och tillbaka
//   Kaffemuggar: extra högt hopp       OMORG-lådor: rasar när du landar
//   Mötesdrönare med en kalenderinbjudan kl. 08.00: hoppa på dem ovanifrån, rör dem inte från sidan.
// Silon ritas som ett schakt mitt i bilden (X0–X1), med marken i genomskärning och en djupmätare på sidorna.
// Kvällens kapitel i berättelsen (src/story.js), mellan Kerstin och MUG. Stationen är Silon i Haga.
import { keys } from '../input.js';
import { WIDTH as W, HEIGHT as H, hash, pick, rand } from '../world.js';
import { drawPerson, PLAYER } from '../sprites.js';

const X0 = 96, X1 = 224;                 // insidan av silon (skärm-x)
const FLOOR_Y = 160;                     // lastkajen längst ner (världs-y)
const FIRE_TOP = 166;                    // eldens överkant (skärm-y)
const PXM = 3.5, CLIMB_M = 800;          // pixlar per meter, och hur högt silon är
const TOP_Y = FLOOR_Y - CLIMB_M * PXM;   // utgången högst upp (världs-y)
const G = 520, JUMP = 250, SPRING = 410, RUN = 110;
const PW = 8, PH = 26;                   // spelarens träffyta

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
let best = 0; // bästa höjd den här sessionen

const BURNT = { jacket: '#2a2523', pants: '#1a1a1c', shirt: '#2a2523', hair: '#111', skin: '#4a3a33', shoes: '#333', headphones: true };
const FIRE_LINES = [
  'Kvartalsfyrverkeriet hann ikapp dig.',
  'Din tjänst har dragits in, liksom golvet du stod på.',
  'HR har informerats. HR brinner också.',
  'Du sades upp i samband med en oplanerad omorganisation.',
];
const MEETING_LINES = [
  'Du tackade ja till en återkommande avstämning kl. 08.00. Den tar aldrig slut.',
  'Mötet kunde ha varit ett mejl. Nu sitter du i det för alltid.',
  'Du drogs in i en snabb femminutersavstämning. Nu är det Q3.',
];

// ---- 3×5-pixeltypsnitt (Å Ä Ö ritas som A/O med märken ovanför) ----------------------------
const GLYPH = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111',
  F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010',
  K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010',
  P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
  U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010',
  Z: '111001010100111', 0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110',
  4: '101101111001001', 5: '111100110001110', 6: '011100111101111', 7: '111001010010010', 8: '111101111101111',
  9: '111101111001110', ' ': '000000000000000', '!': '010010010000010', '.': '000000000000010', ':': '000010000010000',
};
const ACCENT = { Å: ['A', [[1, -2]]], Ä: ['A', [[0, -2], [2, -2]]], Ö: ['O', [[0, -2], [2, -2]]] };
const textCache = new Map();
function textSprite(str, color) {
  const key = str + '|' + color;
  let c = textCache.get(key);
  if (c) return c;
  const top = /[ÅÄÖ]/.test(str) ? 2 : 0;
  c = document.createElement('canvas');
  c.width = Math.max(1, str.length * 4 - 1); c.height = 5 + top;
  const x = c.getContext('2d');
  x.fillStyle = color;
  for (let i = 0; i < str.length; i++) {
    const acc = ACCENT[str[i]];
    const g = GLYPH[acc ? acc[0] : str[i]] || GLYPH[' '];
    for (let p = 0; p < 15; p++) if (g[p] === '1') x.fillRect(i * 4 + (p % 3), top + ((p / 3) | 0), 1, 1);
    if (acc) for (const [mx, my] of acc[1]) x.fillRect(i * 4 + mx, top + my, 1, 1);
  }
  textCache.set(key, c);
  return c;
}
// y är överkanten på vanliga bokstäver; prickarna över Å Ä Ö hamnar ovanför
function text(ctx, str, x, y, color, align = 'left', shadow = true) {
  const s = textSprite(str, color), top = s.height - 5;
  const dx = Math.round(align === 'center' ? x - s.width / 2 : align === 'right' ? x - s.width : x);
  if (shadow) ctx.drawImage(textSprite(str, '#000'), dx + 1, Math.round(y) - top + 1);
  ctx.drawImage(s, dx, Math.round(y) - top);
}

// ---- Rithjälpare ------------------------------------------------------------------------------
let ctx = null;
const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
function disc(cx, cy, r, c) {
  ctx.fillStyle = c;
  for (let dy = -r; dy <= r; dy++) { const dx = Math.floor(Math.sqrt(r * r - dy * dy) + 0.3); ctx.fillRect(cx - dx, cy + dy, dx * 2 + 1, 1); }
}

// ---- Banan ------------------------------------------------------------------------------------
function generate(f) {
  while (!f.exitSpawned && f.nextY > f.camY - 60) spawnRow(f);
}

function spawnRow(f) {
  const height = FLOOR_Y - f.nextY;
  const prog = clamp(height / (CLIMB_M * PXM), 0, 1);
  const remaining = f.nextY - TOP_Y;
  if (remaining <= 52) {
    f.plats.push({ x: X0, y: TOP_Y, w: X1 - X0, type: 'exit' });
    f.exitSpawned = true; f.nextY = TOP_Y; return;
  }
  const gap = Math.min(rand(20, 27 + prog * 25), remaining - 21); // högsta hoppet är 60 px
  f.nextY -= gap;
  const w = Math.round(rand(20, 25) - prog * 4);
  const x = Math.round(rand(X0, X1 - w));
  const moving = height > 140 && Math.random() < 0.08 + prog * 0.32;
  const pl = {
    x, y: Math.round(f.nextY), w, type: moving ? 'cart' : 'desk',
    vx: moving ? pick([-1, 1]) * rand(14, 21 + prog * 25) : 0,
    note: Math.random() < 0.5, noteX: rand(0.1, 0.4),
  };
  f.plats.push(pl);
  if (!moving && height > 100 && Math.random() < 0.075) f.mugs.push({ pl, ox: Math.round(rand(2, w - 6)), used: false });

  // En OMORG-låda som lockbete, en bit bort från det riktiga skrivbordet
  if (height > 90 && Math.random() < 0.12 + prog * 0.28) {
    const bw = 19;
    const bx = x > (X0 + X1) / 2 ? rand(X0, x - bw - 4) : rand(Math.min(X1 - bw, x + w + 4), X1 - bw);
    f.plats.push({ x: Math.round(bx), y: Math.round(f.nextY + gap * rand(0.35, 0.65)), w: bw, type: 'box', broken: false, fy: 0, fv: 0 });
  }
  // Mötesdrönare
  if (prog > 0.1 && f.lastDroneY - f.nextY > 230 && Math.random() < 0.25 + prog * 0.35) {
    const bx = rand(X0 + 18, X1 - 18);
    f.drones.push({
      bx, x: bx, y: f.nextY + gap * 0.5 - 5, w: 10, h: 10,
      amp: Math.min(rand(14, 38), bx - X0 - 6, X1 - 6 - bx),
      ph: rand(0, 6.28), sp: rand(1, 1.8 + prog), dead: false, vy: 0,
    });
    f.lastDroneY = f.nextY;
  }
}

function addText(f, s, x, y, c) { f.texts.push({ s, x, y, c, t: 0 }); }

function die(g, cause) {
  const f = g.flags, p = f.p;
  f.dead = 0.0001; f.cause = cause;
  if (cause === 'fire') { p.burnt = true; p.vy = -230; g.sfx.buzzer(); }
  else { p.vy = -80; g.stats.meetings++; g.sfx.bonk(); }
}

function stepPlayer(g, f, dt) {
  const p = f.p;
  const dir = (keys.left ? -1 : 0) + (keys.right ? 1 : 0);
  p.vx += (dir * RUN - p.vx) * Math.min(1, dt * 10);
  if (dir) p.face = dir;
  const prev = p.y + PH;
  p.vy += G * dt;
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  if (p.x < X0) { p.x = X0; p.vx = 0; }
  if (p.x + PW > X1) { p.x = X1 - PW; p.vx = 0; }
  if (p.vy <= 0) return;
  const bottom = p.y + PH;

  for (const m of f.mugs) {
    const mx = m.pl.x + m.ox, my = m.pl.y - 3;
    if (prev <= my + 1 && bottom >= my && p.x + PW - 1 > mx && p.x + 1 < mx + 4) {
      p.y = my - PH; p.vy = -SPRING; p.squash = 1; m.used = true;
      addText(f, 'ESPRESSO!', mx + 2, my - 6, '#f2b705');
      g.sfx.powerUp(); g.stats.coffee++;
      return;
    }
  }
  for (const pl of f.plats) {
    if (pl.broken) continue;
    if (prev <= pl.y + 1 && bottom >= pl.y && p.x + PW - 2 > pl.x && p.x + 2 < pl.x + pl.w) {
      if (pl.type === 'box') {
        pl.broken = true; g.sfx.dig();
        addText(f, 'OMORG', pl.x + pl.w / 2, pl.y - 6, '#e7c79a');
        continue;
      }
      p.y = pl.y - PH; p.vy = -JUMP; p.squash = 1;
      g.sfx.jump();
      if (pl.type === 'exit') { p.vy = 0; f.won = true; }
      return;
    }
  }
}

// ---- Elden och explosionerna (skärmkoordinater) -------------------------------------------
function blast(g, f, x, playing) {
  for (let i = 0; i < 14; i++) f.flames.push({ x: x + rand(-5, 5), y: FIRE_TOP + rand(-2, 3), vx: rand(-20, 20), vy: -rand(40, 90), r: rand(3, 7), life: 0, max: rand(0.5, 0.9) });
  for (let i = 0; i < 8; i++) f.sparks.push({ x, y: FIRE_TOP, vx: rand(-50, 50), vy: -rand(70, 150), life: 0, max: rand(0.6, 1.1) });
  f.flashes.push({ x, y: FIRE_TOP + 2, r: 3, a: 0.7 });
  if (playing) {
    f.shake = Math.min(3, f.shake + 1.5);
    if (g.time - f.lastBoom > 1.1) { f.lastBoom = g.time; g.sfx.land(); }
  }
}

function updateFx(g, f, dt, playing) {
  f.fireAcc += dt * 30;
  while (f.fireAcc > 1) {
    f.fireAcc--;
    f.flames.push({ x: rand(X0 - 4, X1 + 4), y: FIRE_TOP + rand(0, 10), vx: rand(-5, 5), vy: -rand(10, 38), r: rand(2, 5), life: 0, max: rand(0.45, 0.95) });
    if (Math.random() < 0.3) f.smoke.push({ x: rand(X0, X1), y: FIRE_TOP, vx: rand(-3, 3), vy: -rand(7, 17), r: rand(3, 6), life: 0, max: rand(1.2, 2) });
  }
  f.blastT -= dt;
  if (f.blastT <= 0) { f.blastT = rand(0.45, 1.3); blast(g, f, rand(X0 + 10, X1 - 10), playing); }
  for (const q of f.flames) { q.life += dt; q.x += q.vx * dt; q.y += q.vy * dt; }
  for (const q of f.smoke) { q.life += dt; q.x += q.vx * dt; q.y += q.vy * dt; q.r += dt * 3; }
  for (const q of f.sparks) { q.life += dt; q.vy += 210 * dt; q.x += q.vx * dt; q.y += q.vy * dt; }
  for (const q of f.flashes) { q.r += dt * 80; q.a -= dt * 2; }
  f.flames = f.flames.filter((q) => q.life < q.max);
  if (f.flames.length > 200) f.flames.splice(0, f.flames.length - 200);
  f.smoke = f.smoke.filter((q) => q.life < q.max);
  f.sparks = f.sparks.filter((q) => q.life < q.max);
  f.flashes = f.flashes.filter((q) => q.a > 0);
  f.shake = Math.max(0, f.shake - dt * 8);
}

// ---- Ritning ------------------------------------------------------------------------------------
const SOIL = ['#3b2c22', '#41302a', '#36281f', '#30251d'];
const SHAFT = ['#0f1215', '#171a1e', '#1e2226', '#24292d', '#282d32', '#24292d', '#1e2226', '#171a1e', '#0f1215'];
const SKY = ['#5f9ad0', '#78acd6', '#94bcd8', '#b3c9d0', '#d3d2bf', '#f0d7a8'];
const FLAME = ['#fff1b8', '#ffd060', '#ff9a2e', '#ff5a1f', '#c8340f', '#7a1608'];

function drawWorld(f, cam, t) {
  const ground = TOP_Y - cam; // skärm-y där marken (och silons topp) ligger

  // Himmel ovanför marken, med Haga slott vid horisonten
  if (ground > 0) {
    R(0, 0, W, ground, SKY[0]);
    SKY.forEach((c, i) => R(0, ground - (SKY.length - i) * 6, W, 6, c));
    // slottet till höger
    const cy = ground - 2;
    R(250, cy - 10, 40, 10, '#efe1bd'); R(244, cy - 7, 8, 7, '#d9c79e'); R(288, cy - 7, 8, 7, '#d9c79e');
    for (let k = 0; k < 4; k++) R(248 + k, cy - 13 + k, 44 - k * 2, 1, '#3a3346');
    R(268, cy - 17, 4, 4, '#efe1bd'); R(269, cy - 19, 2, 2, '#3a3346');
    for (let wx = 253; wx < 288; wx += 5) R(wx, cy - 7, 2, 3, '#ffd27a');
    // träd till vänster
    for (const [tx, r] of [[12, 7], [25, 5], [72, 6]]) { R(tx, cy - 3, 1, 3, '#2a1f18'); disc(tx, cy - 3 - r, r, '#2f5a3a'); }
    R(0, ground - 2, W, 2, '#4d8a3c');
  }

  // Marken i genomskärning på båda sidor om silon
  const top = Math.max(0, ground);
  for (let wy = Math.floor(cam / 12) * 12; wy < cam + H; wy += 12) {
    if (wy < TOP_Y) continue;
    const sy = wy - cam, band = Math.floor(wy / 12);
    const c = SOIL[Math.floor(hash(band) * SOIL.length)];
    R(0, sy, X0 - 4, 12, c); R(X1 + 4, sy, W - X1 - 4, 12, c);
    for (let k = 0; k < 6; k++) {
      const hx = hash(band * 31 + k);
      const px = hx < 0.5 ? Math.floor(hx * 2 * (X0 - 10)) : X1 + 6 + Math.floor((hx - 0.5) * 2 * (W - X1 - 12));
      R(px, sy + Math.floor(hash(band * 17 + k) * 10), 2, 1, '#5a4636');
    }
  }
  // Silons betongväggar (med en kant som sticker upp ovanför marken)
  R(X0 - 4, top, 4, H, '#5a5f66'); R(X0 - 1, top, 1, H, '#2a2e33');
  R(X1, top, 4, H, '#5a5f66'); R(X1, top, 1, H, '#2a2e33');
  if (ground > 0) { R(X0 - 4, ground - 6, 4, 6, '#6d737a'); R(X1, ground - 6, 4, 6, '#6d737a'); }

  // Insidan av silon
  ctx.save();
  ctx.beginPath(); ctx.rect(X0, top, X1 - X0, H - top); ctx.clip();
  const n = SHAFT.length;
  for (let i = 0; i < n; i++) { const a = X0 + Math.round(i * (X1 - X0) / n), b = X0 + Math.round((i + 1) * (X1 - X0) / n); R(a, 0, b - a, H, SHAFT[i]); }
  // ledningsrör
  R(X1 - 10, 0, 2, H, '#14171a');
  for (let wy = Math.floor(cam / 45) * 45; wy < cam + H + 45; wy += 45) R(X1 - 11, wy - cam, 4, 1, '#3a4147');
  // ringfogar med nitar
  for (let wy = Math.floor(cam / 70) * 70; wy < cam + H + 70; wy += 70) {
    const sy = wy - cam;
    R(X0, sy, X1 - X0, 1, '#07090a'); R(X0, sy + 1, X1 - X0, 1, 'rgba(255,255,255,.07)');
    for (let x = X0 + 4; x < X1; x += 8) R(x, sy + 3, 1, 1, '#4a5258');
  }
  // arbetslampor
  for (let wy = Math.floor(cam / 130) * 130; wy < cam + H + 130; wy += 130) {
    const ly = wy - cam + 20, left = (Math.round(wy / 130) & 1) === 0, lx = left ? X0 + 4 : X1 - 4;
    disc(lx, ly, 20, 'rgba(255,214,140,.04)'); disc(lx, ly, 11, 'rgba(255,214,140,.06)');
    R(lx - 1, ly - 1, 2, 2, '#ffe2a6');
  }
  // djupmarkeringar var 50:e meter
  for (let wy = Math.floor(cam / 175) * 175; wy < cam + H + 175; wy += 175) {
    if (wy < TOP_Y + 40 || wy > FLOOR_Y) continue;
    const m = Math.round((wy - TOP_Y) / PXM), left = (Math.round(wy / 175) & 1) === 0;
    text(ctx, m + 'M', left ? X0 + 6 : X1 - 14, wy - cam + 30, 'rgba(242,183,5,.3)', left ? 'left' : 'right', false);
  }
  ctx.restore();
}

function drawBox(x, y, from, to) {
  ctx.save(); ctx.beginPath(); ctx.rect(x + from, y, to - from, 5); ctx.clip();
  R(x, y, 19, 4, '#b08352'); R(x, y, 19, 1, '#d1a46c'); R(x + 9, y, 2, 4, '#d9c08a');
  R(x + 2, y + 1, 5, 2, '#c8202f'); R(x + 3, y + 1, 3, 1, '#b08352');
  ctx.restore();
}

function drawPlat(pl, cam, t) {
  const y = Math.round(pl.y - cam), x = Math.round(pl.x), w = pl.w;
  if (y < -20 || y > H + 10) return;
  switch (pl.type) {
    case 'floor':
      R(x, y, w, 10, '#33383d');
      for (let i = 0; i < w; i += 6) { R(x + i, y, 3, 1, '#f2b705'); R(x + i + 1, y + 1, 3, 1, '#f2b705'); }
      text(ctx, 'LASTKAJ', (X0 + X1) / 2, y + 4, '#6d767e', 'center', false);
      break;
    case 'exit': {
      R(x, y, w, 3, '#4b5258');
      for (let i = 0; i < w; i += 6) { R(x + i, y, 3, 1, '#f2b705'); R(x + i + 3, y, 3, 1, '#1a1d21'); }
      const cx = Math.round((X0 + X1) / 2);
      R(cx - 14, y - 13, 28, 10, '#1e7a3a'); R(cx - 14, y - 13, 28, 1, '#3fae5f'); R(cx, y - 3, 1, 3, '#3d4449');
      text(ctx, 'UTGÅNG', cx, y - 9, '#eceee6', 'center', false);
      break;
    }
    case 'desk':
      R(x + 1, y + 2, 1, 2, '#41464c'); R(x + w - 2, y + 2, 1, 2, '#41464c');
      R(x, y, w, 1, '#e8e1cb'); R(x, y + 1, w, 1, '#a59d88');
      R(x + Math.round(w * 0.55), y + 2, Math.round(w * 0.3), 2, '#6d6656');
      if (pl.note) R(x + Math.round(w * pl.noteX), y + 1, 2, 1, '#ffe36e');
      break;
    case 'cart': {
      R(x, y, w, 1, '#86a5c4'); R(x, y + 1, w, 1, '#3c5470');
      const f = (t * 10 | 0) & 1;
      R(x + 1 + f, y + 2, 2, 1, '#111'); R(x + w - 3 - f, y + 2, 2, 1, '#111');
      R(pl.vx > 0 ? x - 3 : x + w + 1, y, 2, 1, 'rgba(160,190,220,.45)');
      break;
    }
    case 'box':
      if (!pl.broken) drawBox(x, y, 0, 19);
      else {
        const d = Math.round(pl.fy / 6), fy = Math.round(pl.fy);
        drawBox(x - d, y + fy, 0, 9);
        drawBox(x + d, y + fy + 1, 9, 19);
      }
      break;
  }
}

function drawMug(m, cam, t) {
  const x = Math.round(m.pl.x + m.ox), y = Math.round(m.pl.y - cam) - 3;
  if (y < -10 || y > H + 10) return;
  if (m.used) { R(x, y + 1, 3, 2, '#f2f2ee'); R(x + 3, y + 1, 1, 1, '#f2f2ee'); return; }
  R(x, y, 3, 3, '#f2f2ee'); R(x, y, 3, 1, '#5a3420'); R(x + 3, y + 1, 1, 1, '#f2f2ee'); R(x + 1, y + 2, 1, 1, '#c8202f');
  const s = t * 5 | 0;
  R(x + (s & 1), y - 2 - (s % 2), 1, 1, 'rgba(236,238,230,.6)');
}

function drawDrone(d, cam, t) {
  const x = Math.round(d.x), y = Math.round(d.y - cam);
  if (y < -12 || y > H + 10) return;
  if (d.dead && ((t * 16) | 0) & 1) return;
  const spin = ((t * 30) | 0) & 1;
  R(x + (spin ? 0 : 1), y, spin ? 3 : 1, 1, '#c8d2dc'); R(x + (spin ? 7 : 8), y, spin ? 3 : 1, 1, '#c8d2dc');
  R(x + 1, y + 1, 8, 2, '#3a3f45');
  R(x + 4, y + 1, 1, 1, ((t * 3) | 0) % 2 ? '#ff3344' : '#5a1016');
  R(x + 5, y + 3, 1, 1, '#6b737a');
  R(x + 2, y + 4, 6, 5, '#f4f4f0'); R(x + 2, y + 4, 6, 1, '#c8202f');
  R(x + 3, y + 6, 1, 1, '#8b949c'); R(x + 5, y + 6, 1, 1, '#8b949c'); R(x + 3, y + 8, 1, 1, '#8b949c'); R(x + 5, y + 8, 1, 1, '#c8202f');
}

function drawPlayer(f, cam, t) {
  const p = f.p, sx = Math.round(p.x + PW / 2), feet = Math.round(p.y - cam + PH);
  if (feet > H + 40) return;
  const sq = p.squash > 0.4 ? 1 : 0;
  ctx.save();
  ctx.translate(sx, feet);
  if (sq) ctx.scale(1.15, 0.85);
  drawPerson(ctx, 0, 0, p.burnt ? BURNT : PLAYER, p.face, t, false);
  ctx.restore();
  const dist = f.camY + FIRE_TOP - (p.y + PH);
  if (!f.dead && dist < 40) R(sx + (p.face > 0 ? -5 : 4), feet - 29 + ((t * 12 | 0) % 4), 1, 2, '#8fd0ff'); // svett
  if (p.burnt) { const s = t * 8 | 0; R(sx - 1 + (s & 1), feet - 31 - (s % 3), 2, 2, 'rgba(60,60,60,.7)'); }
}

function drawFire(f, t) {
  ctx.save();
  ctx.beginPath(); ctx.rect(X0, 0, X1 - X0, H); ctx.clip();
  R(X0, FIRE_TOP - 30, X1 - X0, 10, 'rgba(255,90,31,.06)');
  R(X0, FIRE_TOP - 20, X1 - X0, 10, 'rgba(255,90,31,.1)');
  R(X0, FIRE_TOP - 10, X1 - X0, 10, 'rgba(255,90,31,.16)');
  for (const q of f.smoke) disc(Math.round(q.x), Math.round(q.y), Math.round(q.r), q.life / q.max < 0.5 ? 'rgba(30,24,22,.3)' : 'rgba(30,24,22,.15)');
  for (let x = X0; x < X1; x += 2) {
    const yy = FIRE_TOP + Math.round(Math.sin(x * 0.15 + t * 4) * 1.5 + Math.sin(x * 0.37 - t * 7));
    R(x, yy, 2, 1, FLAME[1]); R(x, yy + 1, 2, 2, FLAME[2]); R(x, yy + 3, 2, 3, FLAME[3]); R(x, yy + 6, 2, H, FLAME[4]);
  }
  R(X0, FIRE_TOP + 9, X1 - X0, H, FLAME[5]);
  for (const q of f.flames) {
    const k = q.life / q.max;
    const ci = k < 0.15 ? 0 : k < 0.35 ? 1 : k < 0.55 ? 2 : k < 0.75 ? 3 : k < 0.9 ? 4 : 5;
    disc(Math.round(q.x), Math.round(q.y), Math.max(0, Math.round(q.r * (1 - k * 0.4) / 1.4)), FLAME[ci]);
  }
  for (const q of f.sparks) R(Math.round(q.x), Math.round(q.y), 1, 1, q.life / q.max < 0.6 ? '#ffe9a0' : '#ff9a2e');
  for (const q of f.flashes) if (q.a > 0.35) disc(Math.round(q.x), Math.round(q.y), Math.round(q.r / 3), 'rgba(255,244,200,.35)');
  ctx.restore();
  // glöden lyser upp jorden bredvid silon
  R(0, FIRE_TOP - 16, X0 - 4, H, 'rgba(255,90,31,.1)'); R(X1 + 4, FIRE_TOP - 16, W - X1 - 4, H, 'rgba(255,90,31,.1)');
  R(0, FIRE_TOP - 4, X0 - 4, H, 'rgba(255,90,31,.12)'); R(X1 + 4, FIRE_TOP - 4, W - X1 - 4, H, 'rgba(255,90,31,.12)');
}

function drawPanels(f) {
  // djupmätare till vänster: hur långt kvar till ytan
  const prog = clamp(f.climbed / CLIMB_M, 0, 1), bx = 40, by = 44, bh = 104;
  R(bx - 2, by - 2, 9, bh + 4, 'rgba(8,10,12,.75)');
  R(bx, by, 5, bh, '#1c2024');
  const fill = Math.round(bh * prog);
  R(bx, by + bh - fill, 5, fill, '#f2b705');
  R(bx - 3, by + bh - fill, 11, 1, '#eceee6');
  text(ctx, 'YTAN', bx + 2.5, by - 9, '#eceee6', 'center');
  text(ctx, Math.max(0, CLIMB_M - Math.round(f.climbed)) + ' M', bx + 2.5, by + bh + 5, '#eceee6', 'center');
  text(ctx, 'KVAR', bx + 2.5, by + bh + 12, '#9aa3ab', 'center');
  // rekord till höger
  text(ctx, 'REKORD', 274, by + bh + 5, '#9aa3ab', 'center');
  text(ctx, best + ' M', 274, by + bh + 12, '#eceee6', 'center');
}

export default {
  id: 'siloescape',
  title: 'SiloEscape',
  tagline: 'Studsa 800 m upp ur silon innan kvartalsfyrverkeriet hinner ikapp',
  level: 'haga',
  station: { x: 450, label: 'Silon' },
  lockPlayer: true,   // ← → styr din egen klättrare i stället för gubben i Haga
  music: 'panik',
  henrik: null,
  start: 160,

  intro: [
    ['H', 'Kvällens teambuilding: rakt upp genom silon. 800 meter, det är ingenting!'],
    ['H', 'Kvartalsfyrverkeriet har redan börjat där nere, så studsa på. ← → styr.'],
    ['H', 'Kaffemuggar ger extra skjuts. OMORG-lådor håller inte. Hoppa på mötesdrönarna, men rör dem inte från sidan!'],
    ['D', 'Är det här verkligen en genväg?'],
  ],
  goal: (g) => `${Math.max(0, CLIMB_M - Math.round(g.flags.climbed || 0))} m kvar till ytan · ← → styr`,

  setup(g) {
    Object.assign(g.flags, {
      p: { x: (X0 + X1) / 2 - PW / 2, y: FLOOR_Y - PH, vx: 0, vy: 0, face: 1, squash: 0, burnt: false },
      plats: [{ x: X0, y: FLOOR_Y, w: X1 - X0, type: 'floor' }], mugs: [], drones: [], texts: [],
      camY: 0, climbed: 0, nextY: FLOOR_Y, exitSpawned: false, lastDroneY: FLOOR_Y - 500,
      dead: 0, cause: null, won: false, tick: null,
      flames: [], smoke: [], sparks: [], flashes: [], fireAcc: 0, blastT: 0.4, shake: 0, fxT: null, lastBoom: -9,
    });
    generate(g.flags);
  },

  update(g, dt) {
    const f = g.flags, p = f.p;
    f.tick = g.time;
    if (f.won) return 'win';
    for (const q of f.texts) { q.t += dt; q.y -= 12 * dt; }
    f.texts = f.texts.filter((q) => q.t < 1.1);
    p.squash = Math.max(0, p.squash - dt * 5);
    for (const pl of f.plats) if (pl.broken) { pl.fv += G * dt; pl.fy += pl.fv * dt; }

    if (f.dead) {
      f.dead += dt;
      p.vy += G * dt; p.y += p.vy * dt;
      return f.dead > 1.3 ? 'fail' : undefined;
    }

    const prog = clamp(f.climbed / CLIMB_M, 0, 1);
    if (g.t > 1.6) f.camY -= (9 + 25 * prog) * dt; // bilden kryper uppåt av sig själv

    for (const pl of f.plats) {
      if (pl.type !== 'cart') continue;
      pl.x += pl.vx * dt;
      if (pl.x < X0) { pl.x = X0; pl.vx *= -1; }
      if (pl.x + pl.w > X1) { pl.x = X1 - pl.w; pl.vx *= -1; }
    }
    for (const d of f.drones) {
      if (d.dead) { d.vy += G * dt; d.y += d.vy * dt; continue; }
      d.ph += d.sp * dt;
      d.x = d.bx + Math.sin(d.ph) * d.amp - d.w / 2;
    }

    const steps = dt > 0.02 ? 3 : 1;
    for (let i = 0; i < steps; i++) {
      stepPlayer(g, f, dt / steps);
      if (f.won) return 'win';
    }
    f.climbed = Math.max(f.climbed, (FLOOR_Y - (p.y + PH)) / PXM);
    best = Math.max(best, Math.round(f.climbed));

    const target = p.y - H * 0.42;
    if (target < f.camY) f.camY += (target - f.camY) * Math.min(1, dt * 10);
    f.camY = Math.max(f.camY, TOP_Y - 50);

    for (const d of f.drones) {
      if (d.dead) continue;
      if (p.x + PW - 1 > d.x && p.x + 1 < d.x + d.w && p.y + PH > d.y + 1 && p.y < d.y + d.h - 1) {
        if (p.vy > 0 && p.y + PH - p.vy * dt <= d.y + 4) {
          d.dead = true; p.vy = -JUMP * 1.05; p.squash = 1;
          addText(f, 'AVBÖJT', d.x + d.w / 2, d.y - 4, '#f2b705');
          g.sfx.plop(); g.stats.dodged++;
        } else { die(g, 'meeting'); return; }
      }
    }

    if (p.y + PH * 0.6 > f.camY + FIRE_TOP + 2) { die(g, 'fire'); return; }

    generate(f);
    const cut = f.camY + H + 30;
    f.plats = f.plats.filter((pl) => pl.y + (pl.fy || 0) < cut);
    f.mugs = f.mugs.filter((m) => m.pl.y < cut);
    f.drones = f.drones.filter((d) => d.y < cut);
  },

  draw(g, c) {
    const f = g.flags;
    if (!f.p) return;
    ctx = c;
    const t = g.time;
    const dt = f.fxT == null ? 0 : Math.min(0.05, t - f.fxT);
    f.fxT = t;
    const playing = f.tick != null && t - f.tick < 0.1 && !f.won;
    updateFx(g, f, dt, playing); // elden brinner även under dialogen
    const cam = Math.round(f.camY);

    ctx.save();
    if (f.shake > 0.5) ctx.translate(Math.round(rand(-f.shake, f.shake)), Math.round(rand(-f.shake, f.shake)));
    R(0, 0, W, H, '#1a1410');
    drawWorld(f, cam, t);
    ctx.save();
    ctx.beginPath(); ctx.rect(X0, 0, X1 - X0, H); ctx.clip();
    for (const pl of f.plats) drawPlat(pl, cam, t);
    for (const m of f.mugs) drawMug(m, cam, t);
    for (const d of f.drones) drawDrone(d, cam, t);
    ctx.restore();
    drawPlayer(f, cam, t);
    for (const q of f.texts) {
      if (q.t > 0.8 && ((q.t * 20) | 0) & 1) continue;
      text(ctx, q.s, q.x, q.y - cam, q.c, 'center');
    }
    drawFire(f, t);
    ctx.restore();

    // röd ton när elden är nära
    const dist = f.camY + FIRE_TOP - (f.p.y + PH);
    if (playing && g.t > 1.6 && !f.dead && dist < 60) {
      const a = (1 - Math.max(0, dist) / 60) * 0.28;
      for (let i = 0; i < 4; i++) R(0, H - (4 - i) * 20, W, 20, `rgba(200,32,47,${(a * (i + 1) / 4).toFixed(3)})`);
    }
    drawPanels(f);
  },

  win: [
    (g) => ['H', `Där är du ju! Rakt upp ur silon på ${Math.floor(g.t / 60)}:${String(Math.floor(g.t % 60)).padStart(2, '0')}.`],
    ['D', 'Jag luktar krut och kontorsmöbler.'],
    ['H', 'Perfekt. Badrocken ligger framme.'],
  ],
  fail: [
    (g) => ['H', pick(g.flags.cause === 'meeting' ? MEETING_LINES : FIRE_LINES)],
    (g) => ['H', `Du kom ${Math.round(g.flags.climbed)} meter. Från början, upp med dig!`],
  ],
};
