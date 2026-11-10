// AI-Göran: en AI-evangelist med svart skägg med en grå fläck under munnen och grå hästsvans (inga glasögon) täcker hela
// övre delen av skärmen som en klassisk pixelboss. Han står still bakom sitt podium och skjuter
// AI-slogans mot dig. Du kan inte slå tillbaka. I stället drar du ur sladden till hans GPU-kluster:
// stå i den markerade rutan på golvet tills nedräkningen når noll. Nedräkningen går bara medan du
// står i rutan, men den nollställs inte när du kliver ut. Tre rutor = tre kluster.
// Fas 2: när tre kluster är nere genererar Göran "med AI:s kraft" en tredje dimension. Scenen ses
// då i perspektiv och du drar ur tre kluster till (se FAS 2 längre ner). Sex kluster = vinst.
// Piltangenterna styr fritt i alla riktningar. Tre träffar ("sunt förnuft") och det blir omtag;
// har du nått fas 2 börjar omtaget där.
import { keys, wasPressed } from '../input.js';
import { WIDTH as W, HEIGHT as H, pick, rand } from '../world.js';
import { drawPerson, PLAYER } from '../sprites.js';
import { textSprite, drawText } from '../pixeltext.js';

const TAU = Math.PI * 2, PI = Math.PI;
const LIVES = 3;
const ZONE_TIMES = [4, 5, 6];            // sekunder man måste stå i varje ruta
const ZONE_W = 34, ZONE_H = 18;           // rutorna är små med flit
const AREA = { x0: 10, x1: 310, y0: 98, y1: 158 }; // där spelarens bröst får vara (fötterna 15 px lägre)
const BOSS_Y = 12;                        // huvudets överkant (lämnar plats åt HUD och den röda knappen)
const PODIUM_Y = 86;                      // överkanten på podiet; bossen finns ovanför
const MOUTH = [160, BOSS_Y + 52];
const HANDS = [[78, PODIUM_Y - 2], [242, PODIUM_Y - 2]];
const CLUSTER_X = [22, 58, 94];          // GPU-klustren i LED-väggen, till vänster (höger sida skyms av power-up-panelen)

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

// ---- Texten ---------------------------------------------------------------------------------
const SHORT = ['AI!', 'AGI', 'LLM', 'PROMPTA!', 'AGENTER', 'TOKENS', 'GPU', 'SKALA!', 'RAG', 'VIBBA!', 'MODELLER',
  'AUTOMATISERA', 'FINJUSTERA', 'INFERENS', 'EMBEDDINGS', '10X AI', 'COMPUTE', 'KONTEXT'];
const LONG = ['AI ERSÄTTER ALLT', 'PROMPT ÄR DEN NYA KODEN', 'AGENTER ÖVERALLT', 'DATA ÄR NYA OLJAN', 'AGI NÄSTA KVARTAL',
  'VIBE-KODA ALLT', 'HALLUCINATION ÄR KREATIVITET', 'MER COMPUTE!', 'LÅT MODELLEN BESTÄMMA', 'DITT JOBB ÄR EN PROMPT',
  'KODA? AI GÖR DET', 'FRAMTIDEN ÄR AUTONOM', 'SKALA ÄR ALLT', 'BYGG EN AGENT FÖR DET', 'MODELLEN VET BÄST'];
const WALL = ['AI', 'AGI', 'LLM', 'GPU'];
const TAUNTS = ['Har du testat att prompta bättre?', 'Min agent bokade det här mötet!', 'Jag har inte skrivit kod sen 2024!',
  'Mina 400 slides är AI-genererade!', 'Allt är ett API!', 'Jag pratar bara i embeddings nu.', 'Nästa version fixar det!',
  'Mitt skägg är tränat på hela internet!'];
const PULL_LINES = ['Vänta, vad gör du med sladden?!', 'Det där är mitt kluster!', 'Mina tokens! Mina fina tokens!'];
const DOWN_LINES = ['Kluster 1 nere! Jag har backup... i molnet!', 'Kluster 2?! Det här är bara en tillfällig hallucination!'];
const HIT_LINES = ['Okej, AI får skriva mina mejl...', 'Kanske borde jag prompta mer?', 'Mitt sunda förnuft blir mindre!',
  'Nu vill jag också ha en agent.', 'Jag tänker i tokens...'];
const WS = {
  w1: { color: '#7af0ff', plate: '#071a24', border: '#7af0ff', pad: 2 },
  w2: { color: '#c79bff', plate: '#16092a', border: '#c79bff', pad: 2 },
  w3: { color: '#7dffa8', plate: '#06200f', border: '#7dffa8', pad: 2 },
  big: { color: '#071a24', plate: '#7af0ff', border: '#e8fdff', pad: 3, scale: 2 },
  banner: { color: '#fff3c9', plate: '#3a1a6a', border: '#fff3c9', pad: 2 },
};

// ---- AI-Göran (huvud i 3x storlek). Vänster halva ritas, höger halva speglas. --------------
// k kontur, d mörkt hår (det som är kvar), h grått hår, H ljusgrått, s hud, S skugga, D ögonbryn,
// w ögonvita, e iris (lyser när han laddar), b skägg svart, B skäggets ljusare strån,
// g G den grå fläcken under munnen, m mun, t tänder
const HEAD_HALF = [
  '..........kkkkk', '........kkdhhhh', '.......kdhhHhhh', '......kdhhhhHhh', '.....kdhhHhhhhh', '.....kdhhhhhhhh',
  '.....kdhSSSSSSS', '....kSdssssssss', '....kSsDDDDssss', '....kSswekwssss', '....kSsssssssSs', '....kssssssssSs',
  '.....kbsssssSSS', '.....kbbssssbbb', '.....kbbbbbBbbb', '.....kbbbBbmmmm', '.....kbbBbbmttt', '.....kbbbbBbmmm',
  '......kbBbbbgGg', '.......kbbDbggG', '........kbbbgGg', '.........kkbbgg', '...........kkkk',
];
const MOUTH_SHUT = { 15: '.....kbbbBbbkkk', 16: '.....kbbBbbbbbb', 17: '.....kbbbbBbbbb' };
const PAL = { k: '#1a1418', d: '#5e5a56', h: '#9d9a95', H: '#cfccc6', s: '#e3a982', S: '#c0815c', D: '#6d6862',
  w: '#ffffff', e: '#3a6fa0', b: '#2a2521', B: '#4d463f', g: '#9d9a95', G: '#cfccc6', m: '#4a1418', t: '#f4efe6' };
const SCALE = 3;
function headRows(open) {
  return HEAD_HALF.map((r, i) => {
    const half = (!open && MOUTH_SHUT[i]) || r;
    return half + [...half].reverse().join('');
  });
}
function makeHead(open, pal) {
  const rows = headRows(open), c = mk(rows[0].length * SCALE, rows.length * SCALE), x = c.getContext('2d');
  rows.forEach((r, y) => { for (let i = 0; i < r.length; i++) if (pal[r[i]]) { x.fillStyle = pal[r[i]]; x.fillRect(i * SCALE, y * SCALE, SCALE, SCALE); } });
  return c;
}
const HEADS = {};
function initSprites() {
  if (HEADS.shut) return;
  HEADS.shut = makeHead(false, PAL);
  HEADS.open = makeHead(true, PAL);
  HEADS.glowShut = makeHead(false, { ...PAL, e: '#7af0ff', w: '#c8fbff' });
  HEADS.glowOpen = makeHead(true, { ...PAL, e: '#7af0ff', w: '#c8fbff' });
  // avstängd: alla färger gråa och mörka, men med skuggorna kvar
  const grey = {};
  for (const k in PAL) {
    const n = parseInt(PAL[k].slice(1), 16), l = ((n >> 16) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11) * 0.55 + 20;
    grey[k] = `rgb(${l | 0},${l | 0},${(l + 8) | 0})`;
  }
  grey.e = PAL.k; grey.w = '#3a3a42';
  HEADS.off = makeHead(false, grey);
  HEADS.flash = makeHead(true, Object.fromEntries(Object.keys(PAL).map((k) => [k, '#f1ede0'])));
  HEADS.side = makeHead(false, Object.fromEntries(Object.keys(PAL).map((k) => [k, k === 'k' ? '#120f1e' : '#2a2440']))); // huvudets sida i 3D
}

// ---- Bakgrunden: AI-konferensens scen med LED-vägg, ritas en gång ----------------------------
function buildBG() {
  const c = mk(W, H), x = c.getContext('2d');
  const r = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
  r(0, 0, W, H, '#0b0a1c');
  // LED-vägg i rutor
  for (let yy = 0; yy < PODIUM_Y; yy += 8) for (let xx = 0; xx < W; xx += 8) {
    const v = (xx * 7 + yy * 13) % 5;
    r(xx, yy, 7, 7, v === 0 ? '#1d1a44' : v === 1 ? '#17153a' : '#141232');
  }
  drawTo(x, 'AI-SUMMIT 2026', 312, 5, { color: '#3f3a80' }, 'right');
  // golvet: mörk scen med rutnät i perspektiv
  r(0, PODIUM_Y, W, H - PODIUM_Y, '#100e24');
  x.fillStyle = '#1c1940';
  for (let yy = PODIUM_Y + 14, s = 6; yy < H; yy += s, s += 3) x.fillRect(0, yy, W, 1);
  for (let k = -12; k <= 12; k++) for (let yy = PODIUM_Y + 12; yy < H; yy++) {
    const xx = Math.round(160 + k * 14 * (1 + (yy - PODIUM_Y) / 40));
    if (xx >= 0 && xx < W) x.fillRect(xx, yy, 1, 1);
  }
  return c;
}
const drawTo = drawText;

// ---- Skott --------------------------------------------------------------------------------
function word(f, x, y, ang, spd, text, style = 'w1', o = {}) {
  if (f.bullets.length > 260) return null;
  const spr = textSprite(text, WS[style]);
  const b = { x, y, ang, spd, spr, hw: spr.width / 2 - 1, hh: spr.height / 2 - 1, col: WS[style].border, age: 0, ...o };
  f.bullets.push(b);
  return b;
}
const aimFrom = (f, [sx, sy]) => Math.atan2(f.pl.y - sy, f.pl.x - sx);
function every(f, key, iv, dt) { f.timers[key] = (f.timers[key] || 0) + dt; let n = 0; while (f.timers[key] >= iv) { f.timers[key] -= iv; n++; } return n; }
const styleAny = () => pick(['w1', 'w2', 'w3']);

function mouthShot(f, n, spread, spd, big) {
  const a = aimFrom(f, MOUTH);
  for (let i = 0; i < n; i++) {
    const o = n === 1 ? 0 : (i / (n - 1) - 0.5) * spread;
    word(f, MOUTH[0], MOUTH[1], a + o, spd, pick(SHORT), big ? 'big' : styleAny());
  }
  f.boss.talk = 0.45;
}
function handShot(f, spd) {
  const h = HANDS[f.hand = 1 - f.hand];
  word(f, h[0], h[1], aimFrom(f, h) + rand(-0.35, 0.35), spd, pick(SHORT), styleAny());
  f.boss.raise[f.hand] = 0.3;
}
function banner(f, spd) { word(f, rand(50, 270), PODIUM_Y - 4, PI / 2, spd, pick(LONG), 'banner'); f.boss.talk = 0.6; }
function wall(f) { // en rad ord som faller över hela golvet, med en lucka
  const gap = rand(50, 270);
  for (let x = 14; x < W; x += 22) if (Math.abs(x - gap) > 26) word(f, x, PODIUM_Y - 2, PI / 2, 30, pick(WALL), 'w2');
}

// Mönstren blir tätare för varje kluster som går ner
const PATTERNS = [
  (f, dt) => {
    for (let i = every(f, 'm', 1.5, dt); i--;) mouthShot(f, 1, 0, 58);
    for (let i = every(f, 'h', 0.95, dt); i--;) handShot(f, 46);
  },
  (f, dt) => {
    for (let i = every(f, 'm', 1.25, dt); i--;) mouthShot(f, 3, 0.6, 56);
    for (let i = every(f, 'h', 0.8, dt); i--;) handShot(f, 50);
    for (let i = every(f, 'b', 2.6, dt); i--;) banner(f, 30);
  },
  (f, dt) => {
    for (let i = every(f, 'm', 1.6, dt); i--;) mouthShot(f, 1, 0, 66, true);
    for (let i = every(f, 'h', 0.7, dt); i--;) handShot(f, 54);
    for (let i = every(f, 'w', 3.4, dt); i--;) wall(f);
    for (let i = every(f, 'b', 2.9, dt); i--;) banner(f, 32);
  },
];

// ---- Rutorna ------------------------------------------------------------------------------
function placeZone(g) {
  const f = g.flags;
  const footY = f.pl.y + 15;
  let best = null, bestD = -1;
  for (let tries = 0; tries < 20; tries++) { // långt från spelaren, men inte i hörnen
    const cx = rand(40, W - 40), cy = rand(110, 160);
    const d = Math.hypot(cx - f.pl.x, cy - footY);
    if (d > bestD) { bestD = d; best = [cx, cy]; }
    if (d > 110) break;
  }
  f.zone = { x: best[0], y: best[1], need: ZONE_TIMES[f.cleared], left: ZONE_TIMES[f.cleared], on: false, born: 0 };
}
const inZone = (z, p) => Math.abs(p.x - z.x) <= ZONE_W / 2 && Math.abs(p.y + 15 - z.y) <= ZONE_H / 2;

// ---- Effekter -----------------------------------------------------------------------------
function part(f, x, y, vx, vy, life, col, s = 1, grav = 0) { if (f.parts.length < 600) f.parts.push({ x, y, vx, vy, life, max: life, col, s, grav }); }
function clearBullets(f, near) {
  f.bullets = f.bullets.filter((b) => {
    if (near && Math.hypot(b.x - near.x, b.y - near.y) > near.r) return true;
    const [px, py] = b.z != null ? proj(b.x, b.y, b.z) : [b.x, b.y];
    part(f, px, py, rand(-10, 10), rand(-30, -10), rand(0.3, 0.6), b.col);
    return false;
  });
}
const goranSay = (g, text, ttl = 2.2) => g.say(text, g.flags.goran, '', ttl);

function hit(g) {
  const f = g.flags, p = f.pl;
  f.lives--;
  g.stats.hits++;
  g.sfx.bonk();
  f.shake = 4; f.flash = 0.3;
  for (let i = 0; i < 18; i++) part(f, p.x, p.y, rand(-60, 60), rand(-80, 20), rand(0.5, 1), pick(['#f1ede0', '#7af0ff', '#c79bff']), 2, 160);
  clearBullets(f, { x: p.x, y: p.y, r: 40 });
  p.inv = 2;
  g.say(pick(HIT_LINES), { x: p.x, y: p.y - 16 }, 'me', 1.6);
}

function clusterDown(g) {
  const f = g.flags;
  f.cleared++;
  f.shake = 6; f.flash = 0.5; f.boss.hurt = 1.2;
  g.sfx.buzzer(); g.sfx.error();
  clearBullets(f);
  const [gx, gy] = f.stage === 2 ? clusterScreen(f.cleared - 1) : [CLUSTER_X[f.cleared - 1], 48];
  for (let i = 0; i < 40; i++) part(f, gx + rand(-14, 14), gy, rand(-70, 70), rand(-60, 30), rand(0.6, 1.4), pick(['#ffc23d', '#ff5a86', '#f1ede0']), 2, 120);
  if (f.cleared >= 3 && f.stage === 1) { startMorph(g); return; }
  if (f.cleared >= 3) {
    f.dying = 2.2; f.zone = null;
    g.shout('ALLA KLUSTER NERE!');
    goranSay(g, 'Jag... behöver... mer... compute...', 2.4);
    return;
  }
  g.shout(`KLUSTER ${f.cleared}/3 NERE`); f.shoutT = 1.4;
  goranSay(g, DOWN_LINES[f.cleared - 1], 2.4);
  f.timers = {}; f.calm = 1.6; // en kort paus innan nästa våg
  if (f.stage === 2) placeZone3(g); else placeZone(g);
}

function tickBoss(g, dt) {
  const f = g.flags, B = f.boss;
  B.talk = Math.max(0, B.talk - dt);
  B.raise = B.raise.map((v) => Math.max(0, v - dt));
  B.hurt = Math.max(0, B.hurt - dt);
  if (f.shoutT > 0) { f.shoutT -= dt; if (f.shoutT <= 0) g.shout(null); }
}
function tickFx(f, dt) {
  for (let i = f.parts.length - 1; i >= 0; i--) {
    const q = f.parts[i];
    q.life -= dt; q.vy += q.grav * dt; q.x += q.vx * dt; q.y += q.vy * dt;
    if (q.life <= 0 || q.y > H + 10) { f.parts[i] = f.parts[f.parts.length - 1]; f.parts.pop(); }
  }
  if (f.shake > 0) f.shake = Math.max(0, f.shake - dt * 20);
  if (f.flash > 0) f.flash = Math.max(0, f.flash - dt * 1.6);
}

// =============================================================================================
// ---- FAS 2: AI-Göran genererar en tredje dimension -------------------------------------------
// Samma regler, men scenen ses i perspektiv från publiken. ← → går i sidled, ↑ ↓ går in i och ut
// ur bilden och mellanslag hoppar (över ordväggar som glider längs golvet). Allt har en skugga
// på golvet som visar hur långt bort det är. Världen: x i sidled, y uppåt, z in i bilden.
const MORPH_T = 3.4;                              // sekunder för "GENERERAR 3D-VÄRLD"
const F3 = 532, HZ = 20, CAMY = 40, CAMZ = -142; // kameran: brännvidd, horisont (skärm-y), höjd, läge
const X3 = 40, Z3 = [4, 128];                     // golvytan där du får gå
const BACK_Z = 200, BOSS_Z = 165, SHELF_Z = 190; // klustren står på en hylla på LED-väggen
const MOUTH3 = [0, 20, BOSS_Z - 8];
const CLUSTER3 = [-88, -66, -44];               // x för GPU-klustren på hyllan, till vänster om huvudet
const SHELF_Y = 16, BOX_H = 16;
const ZW3 = 16, ZD3 = 14;                         // rutans bredd och djup
const SPR3 = 0.3;                                 // ordens storlek i världen per pixel
const PL3 = 0.5;                                  // spelarens storlek i världen per pixel
const RAIN = ['AI', 'LLM', 'GPU', 'RAG', 'AGI', 'TOKENS', 'ML'];
const TAUNTS3 = ['Jag promptade fram en hel dimension!', 'Nästa version: 4D!', 'Kolla mitt skägg i 3D!',
  'Det här är bara en demo. Den riktiga är bättre.', 'Djup? Jag har DEEP learning!'];
let checkpoint3D = false;                         // har man nått fas 2 börjar omtaget där

function proj(x, y, z) {
  const d = Math.max(4, z - CAMZ), s = F3 / d;
  return [160 + x * s, HZ + (CAMY - y) * s, s];
}
function fillPoly(ctx, col, pts) {
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath(); ctx.fill();
}
// En låda mellan höjderna y0 och y1: topp, synlig sida och framsida. Returnerar framsidans hörn.
const box3 = (ctx, x0, x1, h, z0, z1, top, front, side) => boxAt(ctx, x0, x1, 0, h, z0, z1, top, front, side);
function boxAt(ctx, x0, x1, y0, h, z0, z1, top, front, side) {
  fillPoly(ctx, top, [proj(x0, h, z0), proj(x1, h, z0), proj(x1, h, z1), proj(x0, h, z1)]);
  if (x1 < 0) fillPoly(ctx, side, [proj(x1, y0, z0), proj(x1, h, z0), proj(x1, h, z1), proj(x1, y0, z1)]);
  if (x0 > 0) fillPoly(ctx, side, [proj(x0, y0, z0), proj(x0, h, z0), proj(x0, h, z1), proj(x0, y0, z1)]);
  const a = proj(x0, h, z0), b = proj(x1, y0, z0);
  ctx.fillStyle = front; ctx.fillRect(Math.round(a[0]), Math.round(a[1]), Math.round(b[0] - a[0]), Math.round(b[1] - a[1]));
  return [a, b];
}
const clusterScreen = (k) => { const p = proj(CLUSTER3[k], SHELF_Y + BOX_H / 2, SHELF_Z); return [p[0], p[1]]; };

// Bakgrunden ritas en gång: LED-väggen längst bak och golvet med rutnät i perspektiv
let bg3 = null;
function buildBG3D() {
  if (bg3) return bg3;
  const c = mk(W, H), x = c.getContext('2d');
  const r = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
  r(0, 0, W, H, '#0b0a1c');
  const wallY = Math.ceil(proj(0, 0, BACK_Z)[1]);
  for (let yy = 0; yy < wallY; yy += 8) for (let xx = 0; xx < W; xx += 8) {
    const v = (xx * 7 + yy * 13) % 5;
    r(xx, yy, 7, Math.min(7, wallY - yy - 1), v === 0 ? '#1d1a44' : v === 1 ? '#17153a' : '#141232');
  }
  drawText(x, 'AI-SUMMIT 2026 - NU I 3D', 312, 5, { color: '#3f3a80' }, 'right');
  const edgeZ = Z3[1] + ZD3;
  for (let sy = wallY; sy < H; sy++) {
    const d = CAMY * F3 / (sy + 0.5 - HZ), z = d + CAMZ, s = F3 / d;
    const band = Math.floor(z / 12) & 1;
    r(0, sy, W, 1, band ? '#0e0c22' : '#0b0a1c');
    const a = Math.round(160 - X3 * s), b = Math.round(160 + X3 * s);
    if (z <= edgeZ) r(a, sy, b - a, 1, band ? '#1b1844' : '#151236');
    x.fillStyle = '#2a2560';
    for (let k = -6; k <= 6; k++) { const px = Math.round(160 + k * 12 * s); if (px >= 0 && px < W) x.fillRect(px, sy, 1, 1); }
    if (z <= edgeZ) { x.fillStyle = '#5b54a6'; x.fillRect(a, sy, 1, 1); x.fillRect(b - 1, sy, 1, 1); }
  }
  for (const cx of CLUSTER3) { // hyllor på väggen under klustren
    const [l, sy] = proj(cx - 10, SHELF_Y, SHELF_Z), [rr] = proj(cx + 10, SHELF_Y, SHELF_Z);
    r(Math.round(l), Math.round(sy), Math.round(rr - l), 2, '#3f3a80');
  }
  const [ax, ay, as] = proj(-X3, 0, edgeZ);
  r(Math.round(ax), Math.round(ay), Math.round(X3 * 2 * as), 1, '#5b54a6');
  bg3 = c;
  return c;
}

// ---- Skott i 3D -----------------------------------------------------------------------------
function word3(f, x, y, z, vx, vy, vz, text, style) {
  if (f.bullets.length > 220) return;
  const spr = textSprite(text, WS[style]);
  f.bullets.push({ x, y, z, vx, vy, vz, spr, hw: spr.width * SPR3 / 2, hh: spr.height * SPR3 / 2, col: WS[style].border, age: 0 });
}
function aim3(f, spd, n, spread) { // från munnen mot ditt bröst, eventuellt i solfjäder
  const [mx, my, mz] = MOUTH3, p = f.pl;
  const dx = p.x - mx, dy = p.y + 7 - my, dz = p.z - mz;
  const L = Math.hypot(dx, dy, dz), hs = spd * Math.hypot(dx, dz) / L, a = Math.atan2(dx, dz);
  for (let i = 0; i < n; i++) {
    const o = n === 1 ? 0 : (i / (n - 1) - 0.5) * spread;
    word3(f, mx, my, mz, Math.sin(a + o) * hs, spd * dy / L, Math.cos(a + o) * hs, pick(SHORT), styleAny());
  }
  f.boss.talk = 0.45;
}
function rain3(f) { // ord som faller från taket; hälften siktar nära dig
  const p = f.pl, near = Math.random() < 0.5;
  const x = near ? clamp(p.x + rand(-14, 14), -X3, X3) : rand(-X3, X3);
  const z = near ? clamp(p.z + rand(-16, 16), Z3[0], Z3[1]) : rand(Z3[0] + 6, Z3[1]);
  word3(f, x, 78, z, 0, -46, 0, pick(RAIN), styleAny());
}
function wall3(g) { // en rad ord som glider längs golvet över hela bredden: hoppa!
  const f = g.flags;
  for (let x = -X3 - 6; x <= X3 + 6; x += 11) word3(f, x, 2.5, BOSS_Z - 12, 0, 0, -44, pick(WALL), 'w2');
  f.boss.talk = 0.6;
  if (!f.wallHint) { f.wallHint = true; g.shout('HOPPA! (mellanslag)'); f.shoutT = 1.6; }
}
function banner3(f) { // en lång slogan som svischar förbi i sidled på något djup
  const side = pick([-1, 1]);
  word3(f, -side * 95, 9, rand(16, 112), side * 46, 0, 0, pick(LONG), 'banner');
  f.boss.talk = 0.6;
}
const PATTERNS3 = [
  (g, f, dt) => {
    for (let i = every(f, 'm', 1.4, dt); i--;) aim3(f, 70, 1, 0);
    for (let i = every(f, 'r', 0.75, dt); i--;) rain3(f);
  },
  (g, f, dt) => {
    for (let i = every(f, 'm', 1.25, dt); i--;) aim3(f, 72, 1, 0);
    for (let i = every(f, 'r', 0.65, dt); i--;) rain3(f);
    for (let i = every(f, 'w', 3.6, dt); i--;) wall3(g);
  },
  (g, f, dt) => {
    for (let i = every(f, 'm', 1.5, dt); i--;) aim3(f, 74, 3, 0.35);
    for (let i = every(f, 'r', 0.6, dt); i--;) rain3(f);
    for (let i = every(f, 'w', 3.3, dt); i--;) wall3(g);
    for (let i = every(f, 'b', 3.0, dt); i--;) banner3(f);
  },
];

// ---- Rutorna i 3D -----------------------------------------------------------------------------
function placeZone3(g) {
  const f = g.flags;
  let best = null, bestD = -1;
  for (let tries = 0; tries < 20; tries++) {
    const cx = rand(-36, 36), cz = rand(14, 112);
    const d = Math.hypot(cx - f.pl.x, (cz - f.pl.z) * 0.8);
    if (d > bestD) { bestD = d; best = [cx, cz]; }
    if (d > 60) break;
  }
  f.zone = { x: best[0], z: best[1], need: ZONE_TIMES[f.cleared], left: ZONE_TIMES[f.cleared], on: false, born: 0 };
}
const inZone3 = (z, p) => Math.abs(p.x - z.x) <= ZW3 / 2 && Math.abs(p.z - z.z) <= ZD3 / 2;

// ---- Övergången och fas 2 -----------------------------------------------------------------
function startMorph(g) {
  const f = g.flags;
  f.stage = 'morph'; f.morph = 0; f.zone = null; f.built = false;
  clearBullets(f);
  g.shout('FAS 2'); f.shoutT = 1.4;
  goranSay(g, 'Ha! Trodde du att jag bara fanns i 2D?', 1.8);
  g.sfx.powerUp();
}
function enter3D(g) {
  const f = g.flags, old = f.pl;
  checkpoint3D = true;
  buildBG3D();
  f.stage = 2; f.cleared = 0; f.lives = LIVES; f.bullets = []; f.timers = {}; f.calm = 1.5; f.dying = 0; f.wallHint = false;
  f.pl = { x: old && old.z == null ? clamp((old.x - 160) / 160 * X3, -X3, X3) : 0, y: 0, z: 22, vy: 0, inv: 1, moving: false, facing: 1 };
  placeZone3(g);
}
function updateMorph(g, dt) {
  const f = g.flags;
  f.morph += dt;
  f.boss.talk = 0.3; // ögonen lyser hela tiden
  tickBoss(g, dt);
  if (!f.built && f.morph >= MORPH_T / 2) {
    f.built = true;
    enter3D(g); f.stage = 'morph'; f.calm = 1.2;
    f.flash = 0.8; g.sfx.whoosh();
    goranSay(g, 'Med AI:s kraft: en TREDJE DIMENSION!', 2.4);
  }
  if (f.morph >= MORPH_T) {
    f.stage = 2;
    g.shout('FAS 2: 3D! Mellanslag = hoppa'); f.shoutT = 2.2;
    g.sfx.gadget();
  }
  tickFx(f, dt);
}

function hit3D(g) {
  const f = g.flags, p = f.pl;
  f.lives--;
  g.stats.hits++;
  g.sfx.bonk();
  f.shake = 4; f.flash = 0.3;
  const [sx, sy] = proj(p.x, p.y + 7, p.z);
  for (let i = 0; i < 18; i++) part(f, sx, sy, rand(-60, 60), rand(-80, 20), rand(0.5, 1), pick(['#f1ede0', '#7af0ff', '#c79bff']), 2, 160);
  f.bullets = f.bullets.filter((b) => {
    if (Math.hypot(b.x - p.x, b.z - p.z) > 30) return true;
    const [bx, by] = proj(b.x, b.y, b.z);
    part(f, bx, by, rand(-10, 10), rand(-30, -10), rand(0.3, 0.6), b.col);
    return false;
  });
  p.inv = 2;
  g.say(pick(HIT_LINES), { x: sx, y: sy - 30 }, 'me', 1.6);
}

function update3D(g, dt) {
  const f = g.flags, p = f.pl;

  // Du: ← → i sidled, ↑ ↓ in i och ut ur bilden, mellanslag hoppar
  let dx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0), dz = (keys.up ? 1 : 0) - (keys.down ? 1 : 0);
  if (dx && dz) { dx *= 0.7071; dz *= 0.7071; }
  p.x = clamp(p.x + dx * 50 * dt, -X3, X3);
  p.z = clamp(p.z + dz * 50 * dt, Z3[0], Z3[1]);
  p.moving = !!(dx || dz);
  if (dx) p.facing = Math.sign(dx);
  if (wasPressed('action') && p.y <= 0 && f.dying <= 0) { p.vy = 62; g.sfx.jump(); }
  p.vy -= 170 * dt; p.y += p.vy * dt;
  if (p.y <= 0) { if (p.vy < -20) g.sfx.land(); p.y = 0; p.vy = 0; }
  if (p.inv > 0) p.inv -= dt;
  tickBoss(g, dt);

  if (f.dying > 0) {
    f.dying -= dt;
    if (Math.random() < dt * 14) part(f, rand(110, 210), rand(0, 66), rand(-40, 40), rand(-50, 0), rand(0.4, 0.9), pick(['#ffc23d', '#f1ede0', '#7af0ff']), 2, 90);
    if (f.dying <= 0) return 'win';
  } else {
    const z = f.zone;
    z.born += dt;
    const was = z.on;
    z.on = inZone3(z, p);
    if (z.on) {
      z.left = Math.max(0, z.left - dt);
      if (!was) { g.sfx.click(); if (Math.random() < 0.5) goranSay(g, pick(PULL_LINES), 1.6); }
      f.tickAcc = (f.tickAcc || 0) + dt;
      if (f.tickAcc >= 0.5) { f.tickAcc = 0; g.sfx.tick(); }
      if (Math.random() < dt * 10) { const [zx, zy] = proj(z.x + rand(-5, 5), 0, z.z); part(f, zx, zy, rand(-20, 20), rand(-50, -20), 0.4, '#ffc23d', 1, 60); }
      if (z.left <= 0) clusterDown(g);
    }
    if (f.dying <= 0) {
      if (f.calm > 0) f.calm -= dt;
      else PATTERNS3[f.cleared](g, f, dt);
      f.tauntT -= dt;
      if (f.tauntT <= 0) { goranSay(g, pick(Math.random() < 0.6 ? TAUNTS3 : TAUNTS), 2); f.tauntT = rand(7, 10); }
    }
  }

  // Skotten: flyger i 3D, träffar om de överlappar din kropp i alla tre led
  for (let i = f.bullets.length - 1; i >= 0; i--) {
    const b = f.bullets[i];
    b.age += dt;
    b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt;
    if (b.z < -8 || b.y < -2 || Math.abs(b.x) > 140 || b.age > 12) {
      if (b.y < -2) { const [sx, sy] = proj(b.x, 0, b.z); for (let k = 0; k < 4; k++) part(f, sx, sy, rand(-25, 25), rand(-35, -10), 0.35, b.col, 1, 80); }
      f.bullets[i] = f.bullets[f.bullets.length - 1]; f.bullets.pop(); f.dodged++; continue;
    }
    if (p.inv > 0 || f.dying > 0) continue;
    if (Math.abs(b.x - p.x) < b.hw + 3 && Math.abs(b.z - p.z) < 4 && b.y - b.hh < p.y + 13 && b.y + b.hh > p.y + 1) {
      hit3D(g);
      if (f.lives <= 0) return 'fail';
      break;
    }
  }
  tickFx(f, dt);
}

// ---- Rita fas 2 -------------------------------------------------------------------------------
function pickHead(f, t, off) {
  const B = f.boss;
  if (off) return HEADS.off;
  if (B.hurt > 0 && ((t * 12) | 0) % 2) return HEADS.flash;
  if (B.talk > 0.2) return HEADS.glowOpen;
  if (B.talk > 0) return HEADS.glowShut;
  return HEADS.shut;
}
function drawTail(ctx, hx, hy, sc, off, t) { // hästsvansen, i huvudets koordinater
  const sway = Math.sin(t * 1.7);
  const pts = [[90, 20], [94, 24], [97, 28], [99, 32], [100, 36], [101, 40], [102, 44], [102 + sway, 48], [102 + sway, 52], [101 + sway, 56], [99 + sway, 60]];
  const at = ([x, y]) => [Math.round(hx + x * sc), Math.round(hy + y * sc)];
  ctx.fillStyle = '#1a1418';
  pts.forEach((q, i) => { const [x, y] = at(q), w = (i > 8 ? 6 : 8) * sc; ctx.fillRect(Math.round(x - w / 2), y - 1, Math.round(w), Math.round(6 * sc)); });
  pts.forEach((q, i) => {
    const [x, y] = at(q), w = (i > 8 ? 4 : 6) * sc;
    ctx.fillStyle = '#9d9a95'; ctx.fillRect(Math.round(x - w / 2), y, Math.round(w), Math.round(4 * sc));
    ctx.fillStyle = '#cfccc6'; ctx.fillRect(Math.round(x - w / 2 + 1), y + (i % 2), 1, 2);
  });
  ctx.fillStyle = off ? '#5a2a2a' : '#d23a3a';
  const [tx, ty] = at([92, 24]); ctx.fillRect(tx, ty, Math.round(7 * sc), Math.round(3 * sc));
}
function drawBoss3(g, ctx, off) {
  const f = g.flags, t = g.time;
  const sc = 104 / HEADS.shut.width;
  const hw = Math.round(HEADS.shut.width * sc), hh = Math.round(HEADS.shut.height * sc);
  const hx = 160 - hw / 2, hy = -4 + (off ? 3 : 0);
  const yaw = off ? 0 : Math.sin(t * 0.9) * 0.6; // han vrider på huvudet så att man ser att det är 3D
  // kropp och axlar
  const SY = hy + 52 * sc;
  fillPoly(ctx, '#05040e', [[40, 90], [56, SY + 7], [92, SY - 1], [228, SY - 1], [264, SY + 7], [280, 90]]);
  fillPoly(ctx, '#1b1922', [[44, 90], [58, SY + 8], [93, SY + 1], [227, SY + 1], [262, SY + 8], [276, 90]]);
  drawTail(ctx, hx + yaw * 3, hy, sc, off, t);
  // huvudet extruderat: mörka kopior bakåt, ansiktet framför
  for (let k = 7; k >= 1; k--) ctx.drawImage(HEADS.side, Math.round(hx - yaw * k * 1.4), Math.round(hy + k * 0.4), hw, hh);
  const fw = Math.round(hw * (1 - Math.abs(yaw) * 0.12));
  ctx.drawImage(pickHead(f, t, off), Math.round(160 - fw / 2 + yaw * 3), Math.round(hy), fw, hh);
}
function drawCluster3(ctx, f, k, t) {
  const cx = CLUSTER3[k], cz = SHELF_Z - 10, dead = k < f.cleared;
  const [a, b] = boxAt(ctx, cx - 7, cx + 7, SHELF_Y, SHELF_Y + BOX_H, cz, cz + 10, dead ? '#2e2c3a' : '#3f3a80', dead ? '#24222e' : '#2e2b5a', dead ? '#1a1822' : '#1d1a44');
  const fw = b[0] - a[0], fh = b[1] - a[1], lw = Math.max(1, Math.round(fw * 0.1)), lh = Math.max(1, Math.round(fh * 0.08));
  for (let l = 0; l < 4; l++) for (let m = 0; m < 3; m++) {
    const on = !dead && ((t * 6 + l * 3 + m * 5 + k) | 0) % 4 !== 0;
    ctx.fillStyle = dead ? '#3a1a1a' : on ? '#7dffa8' : '#1d4a2c';
    ctx.fillRect(Math.round(a[0] + fw * (0.14 + l * 0.2)), Math.round(a[1] + fh * (0.18 + m * 0.26)), lw, lh);
  }
}
function drawClusterLabel3(ctx, f, k) { // under hyllan, ritas efter bossen så att axlarna inte skymmer
  const dead = k < f.cleared, [x, y] = proj(CLUSTER3[k], SHELF_Y, SHELF_Z);
  drawText(ctx, dead ? 'NERE' : `GPU ${k + 1}`, Math.round(x), Math.round(y) + 3, { color: dead ? '#ff5a86' : '#7af0ff', plate: '#0b0a1c', pad: 1 }, 'center');
}
function drawZone3(ctx, f, t) {
  const z = f.zone;
  if (!z) return;
  const x0 = z.x - ZW3 / 2, x1 = z.x + ZW3 / 2, z0 = z.z - ZD3 / 2, z1 = z.z + ZD3 / 2;
  // sladden bort till klustret
  const cx = CLUSTER3[f.cleared];
  const along = (u) => u < 0.8 // längs golvet till väggen, sedan uppför väggen till hyllan
    ? proj(z.x + (cx - z.x) * u / 0.8, 0, z1 + (BACK_Z - z1) * u / 0.8)
    : proj(cx, SHELF_Y * (u - 0.8) / 0.2, BACK_Z);
  ctx.fillStyle = '#05040e';
  for (let u = 0; u <= 1; u += 0.012) { const [px, py, s] = along(u), w = Math.max(1, Math.round(s * 0.8)); ctx.fillRect(Math.round(px - w / 2), Math.round(py - w / 2), w, w); }
  if (!z.on) {
    ctx.fillStyle = '#7af0ff';
    for (let k = 0; k < 3; k++) { const [px, py] = along((t * 0.6 + k / 3) % 1); ctx.fillRect(Math.round(px) - 1, Math.round(py) - 1, 2, 2); }
  }
  const pulse = z.born < 1 ? ((t * 10) | 0) % 2 : 1;
  if (pulse) {
    fillPoly(ctx, z.on ? 'rgba(125,255,168,0.28)' : 'rgba(125,255,168,0.12)', [proj(x0, 0, z0), proj(x1, 0, z0), proj(x1, 0, z1), proj(x0, 0, z1)]);
    const done = 1 - z.left / z.need, zf = z0 + ZD3 * done;
    if (done > 0) fillPoly(ctx, 'rgba(255,194,61,0.45)', [proj(x0, 0, z0), proj(x1, 0, z0), proj(x1, 0, zf), proj(x0, 0, zf)]);
    ctx.fillStyle = z.on ? '#ffc23d' : '#7dffa8';
    const ofs = (t * 20) | 0;
    const edge = (ax, az, bx, bz) => {
      const pa = proj(ax, 0, az), pb = proj(bx, 0, bz), n = Math.max(4, Math.ceil(Math.hypot(pb[0] - pa[0], pb[1] - pa[1])));
      for (let i = 0; i <= n; i++) {
        if (((i + ofs) >> 2) % 2) continue;
        ctx.fillRect(Math.round(pa[0] + (pb[0] - pa[0]) * i / n), Math.round(pa[1] + (pb[1] - pa[1]) * i / n), 1, 1);
      }
    };
    edge(x0, z0, x1, z0); edge(x1, z0, x1, z1); edge(x1, z1, x0, z1); edge(x0, z1, x0, z0);
    const [px, py, s] = proj(z.x, 0, z.z); // stickkontakten ligger platt på golvet
    ctx.fillStyle = '#d8d4c8'; ctx.fillRect(Math.round(px - 2.5 * s), Math.round(py - 0.8 * s), Math.round(5 * s), Math.max(2, Math.round(1.6 * s)));
  }
  const [tx, ty] = proj(z.x, 0, z0);
  drawText(ctx, `${z.left.toFixed(1)}`, tx, Math.round(ty) + 3, { color: z.on ? '#ffc23d' : '#7dffa8', plate: '#0b0a1c', pad: 1 }, 'center');
}
let plc = null; // spelaren ritas först i originalstorlek och skalas sedan, så pixlarna förblir skarpa
function drawPlayer3(ctx, p, t) {
  if (!plc) plc = mk(26, 34);
  const c = plc.getContext('2d');
  c.clearRect(0, 0, 26, 34);
  drawPerson(c, 13, 32, PLAYER, p.facing, t, p.moving && p.y <= 0);
  const [sx, sy, s] = proj(p.x, p.y, p.z), k = s * PL3;
  ctx.drawImage(plc, Math.round(sx - 13 * k), Math.round(sy - 32 * k), Math.round(26 * k), Math.round(34 * k));
}
function draw3D(g, ctx) {
  const f = g.flags, t = g.time, off = f.won || f.dying > 0, p = f.pl;
  ctx.save();
  if (f.shake > 0) ctx.translate(Math.round(rand(-f.shake, f.shake)), Math.round(rand(-f.shake, f.shake)));
  ctx.drawImage(buildBG3D(), 0, 0);
  for (let k = 0; k < 3; k++) drawCluster3(ctx, f, k, t); // på väggen, bakom Göran
  drawBoss3(g, ctx, off);
  const [a, b] = box3(ctx, -46, 46, 8, 150, 158, '#3f3a80', '#2a2550', '#1d1a44');
  drawText(ctx, off ? 'AI ÄR SV...' : 'AI ÄR SVARET. I 3D.', 160, Math.round((a[1] + b[1]) / 2) - 3, { color: off ? '#5b54a6' : '#7af0ff' }, 'center');
  for (let k = 0; k < 3; k++) drawClusterLabel3(ctx, f, k);
  drawZone3(ctx, f, t);

  // skuggor på golvet: visar var saker är på djupet
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  for (const bl of f.bullets) {
    if (bl.y < 0) continue;
    const [sx, sy, s] = proj(bl.x, 0, bl.z);
    ctx.beginPath(); ctx.ellipse(sx, sy, Math.max(1, bl.hw * s), Math.max(1, 0.8 * s), 0, 0, TAU); ctx.fill();
  }
  if (p.z != null) {
    const [sx, sy, s] = proj(p.x, 0, p.z), shrink = 1 / (1 + p.y * 0.05);
    ctx.beginPath(); ctx.ellipse(sx, sy, 4 * s * shrink, 1.2 * s * shrink, 0, 0, TAU); ctx.fill();
  }
  // skott och spelare, längst bort först
  const objs = f.bullets.slice();
  if (p.z != null) objs.push({ me: true, z: p.z });
  objs.sort((u, v) => v.z - u.z);
  for (const o of objs) {
    if (o.me) { if (!(p.inv > 0 && ((t * 14) | 0) % 2 === 0)) drawPlayer3(ctx, p, t); continue; }
    const [sx, sy, s] = proj(o.x, o.y, o.z), k = s * SPR3;
    const w = Math.max(1, Math.round(o.spr.width * k)), h = Math.max(1, Math.round(o.spr.height * k));
    ctx.drawImage(o.spr, Math.round(sx - w / 2), Math.round(sy - h / 2), w, h);
  }
  for (const q of f.parts) {
    if (q.life < q.max * 0.3 && ((t * 20) | 0) % 2) continue;
    ctx.fillStyle = q.col; ctx.fillRect(Math.round(q.x), Math.round(q.y), q.s, q.s);
  }
  ctx.restore();
  if (f.flash > 0) { ctx.fillStyle = `rgba(241,237,224,${f.flash.toFixed(3)})`; ctx.fillRect(0, 0, W, H); }
}
// Övergången: glitchar, scanlines och en förloppsindikator som blir klar lite för fort
function drawMorph(g, ctx) {
  const f = g.flags, m = Math.min(1, f.morph / MORPH_T), inten = 1 - Math.abs(m - 0.5) * 2;
  for (let i = 0; i < 3 + inten * 12; i++) {
    const y = rand(0, H) | 0, h = rand(1, 7) | 0, o = Math.round(rand(-16, 16) * (0.3 + inten));
    ctx.drawImage(ctx.canvas, 0, y, W, h, o, y, W, h);
  }
  ctx.fillStyle = `rgba(0,0,0,${(0.3 * inten).toFixed(3)})`;
  for (let y = 0; y < H; y += 2) ctx.fillRect(0, y, W, 1);
  if (Math.random() < inten) { ctx.fillStyle = pick(['rgba(122,240,255,0.25)', 'rgba(255,90,134,0.25)']); ctx.fillRect(0, rand(0, H) | 0, W, rand(2, 10) | 0); }
  const pct = Math.min(100, Math.floor(m * 135));
  ctx.fillStyle = '#7af0ff'; ctx.fillRect(64, 106, 192, 34);
  ctx.fillStyle = '#071a24'; ctx.fillRect(65, 107, 190, 32);
  drawText(ctx, 'GENERERAR 3D-VÄRLD MED AI...', 160, 111, { color: '#7af0ff' }, 'center');
  ctx.fillStyle = '#16303c'; ctx.fillRect(72, 121, 176, 5);
  ctx.fillStyle = '#7dffa8'; ctx.fillRect(72, 121, Math.round(176 * pct / 100), 5);
  drawText(ctx, pct < 100 ? `${pct} %` : '100 % (BETA)', 160, 130, { color: '#c8fbff' }, 'center');
}

// ---- Fas 1 ritas så här ----------------------------------------------------------------------
function draw2D(g, ctx) {
  const f = g.flags, t = g.time, B = f.boss;
  const off = f.won || f.dying > 0;
  ctx.save();
  if (f.shake > 0) ctx.translate(Math.round(rand(-f.shake, f.shake)), Math.round(rand(-f.shake, f.shake)));
  ctx.drawImage(f.bg, 0, 0);

  // GPU-klustren i LED-väggen: tre lådor med blinkande lampor
  for (let k = 0; k < 3; k++) {
    const gx = CLUSTER_X[k] - 14, gy = 38, dead = k < f.cleared;
    ctx.fillStyle = '#05040e'; ctx.fillRect(gx - 1, gy - 1, 30, 22);
    ctx.fillStyle = dead ? '#24222e' : '#2e2b5a'; ctx.fillRect(gx, gy, 28, 20);
    for (let l = 0; l < 4; l++) for (let m = 0; m < 3; m++) {
      const on = !dead && ((t * 6 + l * 3 + m * 5 + k) | 0) % 4 !== 0;
      ctx.fillStyle = dead ? '#3a1a1a' : on ? '#7dffa8' : '#1d4a2c';
      ctx.fillRect(gx + 3 + l * 6, gy + 3 + m * 6, 3, 2);
    }
    drawText(ctx, dead ? 'NERE' : `GPU ${k + 1}`, gx + 14, gy + 23, { color: dead ? '#ff5a86' : '#7af0ff' }, 'center');
  }

  // Kroppen: svart polotröja, axlar över nästan hela bredden och armar ner till podiet
  const poly = (col, pts) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(...pts[0]); for (const q of pts.slice(1)) ctx.lineTo(...q); ctx.fill(); };
  const SY = BOSS_Y + 50;
  poly('#05040e', [[40, PODIUM_Y], [58, SY + 6], [84, SY - 1], [236, SY - 1], [262, SY + 6], [280, PODIUM_Y]]);
  poly('#1b1922', [[43, PODIUM_Y], [60, SY + 7], [85, SY + 1], [235, SY + 1], [260, SY + 7], [277, PODIUM_Y]]);
  poly('#26232f', [[60, SY + 9], [86, SY + 3], [110, SY + 3], [92, PODIUM_Y], [66, PODIUM_Y]]);   // vänster ärm
  poly('#26232f', [[260, SY + 9], [234, SY + 3], [210, SY + 3], [228, PODIUM_Y], [254, PODIUM_Y]]); // höger ärm
  ctx.fillStyle = '#05040e'; ctx.fillRect(140, SY - 2, 40, 6); // polokragen under skägget
  ctx.fillStyle = '#1b1922'; ctx.fillRect(141, SY - 1, 38, 4);

  // Hästsvansen: från bakom huvudet ner över vänster axel (höger i bild), med röd snodd
  const sway = Math.round(Math.sin(t * 1.7));
  const tail = [[205, 20], [209, 24], [212, 28], [214, 32], [215, 36], [216, 40], [217, 44], [217 + sway, 48], [217 + sway, 52], [216 + sway, 56], [214 + sway, 60]]
    .map(([tx, ty]) => [tx, ty + BOSS_Y]);
  ctx.fillStyle = '#1a1418';
  tail.forEach(([tx, ty], i) => { const w = i > 8 ? 6 : 8; ctx.fillRect(tx - w / 2, ty - 1, w, 6); });
  tail.forEach(([tx, ty], i) => {
    const w = i > 8 ? 4 : 6;
    ctx.fillStyle = '#9d9a95'; ctx.fillRect(tx - w / 2, ty, w, 4);
    ctx.fillStyle = '#cfccc6'; ctx.fillRect(tx - w / 2 + 1, ty + (i % 2), 1, 2); // grå och vita slingor
    ctx.fillStyle = '#5e5a56'; ctx.fillRect(tx + w / 2 - 2, ty + 1 - (i % 2), 1, 2);
  });
  ctx.fillStyle = off ? '#5a2a2a' : '#d23a3a'; ctx.fillRect(207, BOSS_Y + 24, 7, 3); // snodden

  // Huvudet
  // ögonen lyser och munnen öppnas när han skjuter, vitt blink när ett kluster går ner
  let head = HEADS.shut;
  if (off) head = HEADS.off;
  else if (B.hurt > 0 && ((t * 12) | 0) % 2) head = HEADS.flash;
  else if (B.talk > 0.2) head = HEADS.glowOpen;
  else if (B.talk > 0) head = HEADS.glowShut;
  const hx = 160 - head.width / 2, hy = BOSS_Y + (off ? 2 : Math.round(Math.sin(t * 2) * 0.6));
  ctx.drawImage(head, hx, hy);

  // Podiet över hela bredden, med händerna på
  ctx.fillStyle = '#05040e'; ctx.fillRect(0, PODIUM_Y - 1, W, 10);
  ctx.fillStyle = '#2a2550'; ctx.fillRect(0, PODIUM_Y, W, 8);
  ctx.fillStyle = '#3f3a80'; ctx.fillRect(0, PODIUM_Y, W, 1);
  drawText(ctx, off ? 'AI ÄR SV...' : 'AI ÄR SVARET', 160, PODIUM_Y + 2, { color: off ? '#5b54a6' : '#7af0ff' }, 'center');
  HANDS.forEach(([hx2, hy2], i) => {
    const up = B.raise[i] > 0 && !off ? 4 : 0;
    ctx.fillStyle = '#16141c'; ctx.fillRect(hx2 - 6, hy2 - 8 - up, 12, 8);
    ctx.fillStyle = '#1a1418'; ctx.fillRect(hx2 - 5, hy2 - 3 - up, 10, 7);
    ctx.fillStyle = '#e3a982'; ctx.fillRect(hx2 - 4, hy2 - 2 - up, 8, 5);
    ctx.fillStyle = '#c0815c'; for (let k = 0; k < 4; k++) ctx.fillRect(hx2 - 4 + k * 2, hy2 + 2 - up, 1, 1);
  });

  // Rutan och sladden upp till podiet
  const z = f.zone;
  if (z) {
    const zx = Math.round(z.x - ZONE_W / 2), zy = Math.round(z.y - ZONE_H / 2);
    // sladden
    ctx.fillStyle = '#05040e';
    const cx0 = z.x, cy0 = zy, cx1 = CLUSTER_X[f.cleared], cy1 = PODIUM_Y + 8;
    for (let s = 0; s <= 1; s += 0.02) {
      const sx = cx0 + (cx1 - cx0) * s, sy = cy0 + (cy1 - cy0) * s + Math.sin(s * PI) * 6;
      ctx.fillRect(Math.round(sx) - 1, Math.round(sy), 3, 2);
    }
    if (!z.on) { // data som strömmar upp till klustret
      ctx.fillStyle = '#7af0ff';
      for (let k = 0; k < 3; k++) {
        const s = ((t * 0.8 + k / 3) % 1);
        ctx.fillRect(Math.round(cx0 + (cx1 - cx0) * s), Math.round(cy0 + (cy1 - cy0) * s + Math.sin(s * PI) * 6), 2, 2);
      }
    }
    // själva rutan: streckad kant som snurrar, fylls underifrån när sladden dras ur
    const pulse = z.born < 1 ? ((t * 10) | 0) % 2 : 1;
    if (pulse) {
      ctx.fillStyle = z.on ? 'rgba(125,255,168,0.28)' : 'rgba(125,255,168,0.12)';
      ctx.fillRect(zx, zy, ZONE_W, ZONE_H);
      const done = 1 - z.left / z.need, fh = Math.round(ZONE_H * done);
      ctx.fillStyle = 'rgba(255,194,61,0.45)'; ctx.fillRect(zx, zy + ZONE_H - fh, ZONE_W, fh);
      const per = (ZONE_W + ZONE_H) * 2, ofs = (t * 20) | 0;
      ctx.fillStyle = z.on ? '#ffc23d' : '#7dffa8';
      for (let k = 0; k < per; k++) {
        if (((k + ofs) >> 2) % 2) continue;
        let px, py;
        if (k < ZONE_W) { px = zx + k; py = zy; } else if (k < ZONE_W + ZONE_H) { px = zx + ZONE_W - 1; py = zy + k - ZONE_W; }
        else if (k < ZONE_W * 2 + ZONE_H) { px = zx + ZONE_W - 1 - (k - ZONE_W - ZONE_H); py = zy + ZONE_H - 1; } else { px = zx; py = zy + ZONE_H - 1 - (k - ZONE_W * 2 - ZONE_H); }
        ctx.fillRect(px, py, 1, 1);
      }
      // stickkontakt i mitten
      ctx.fillStyle = '#d8d4c8'; ctx.fillRect(z.x - 4, z.y - 3, 8, 6);
      ctx.fillStyle = '#1a1418'; ctx.fillRect(z.x - 2, z.y - 1, 1, 2); ctx.fillRect(z.x + 1, z.y - 1, 1, 2);
    }
    drawText(ctx, `${z.left.toFixed(1)}`, z.x, zy + ZONE_H + 3, { color: z.on ? '#ffc23d' : '#7dffa8', plate: '#0b0a1c', pad: 1 }, 'center');
  }

  // Du (fötterna 15 px under bröstet)
  const p = f.pl;
  const blink = p.inv > 0 && ((t * 14) | 0) % 2 === 0;
  if (!blink) drawPerson(ctx, p.x, Math.round(p.y) + 15, PLAYER, p.facing, t, p.moving);

  for (const b of f.bullets) ctx.drawImage(b.spr, Math.round(b.x - b.spr.width / 2), Math.round(b.y - b.spr.height / 2));
  for (const q of f.parts) {
    if (q.life < q.max * 0.3 && ((t * 20) | 0) % 2) continue;
    ctx.fillStyle = q.col; ctx.fillRect(Math.round(q.x), Math.round(q.y), q.s, q.s);
  }
  ctx.restore();
  if (f.flash > 0) { ctx.fillStyle = `rgba(241,237,224,${f.flash.toFixed(3)})`; ctx.fillRect(0, 0, W, H); }
}

// ---- Minispelet -----------------------------------------------------------------------------
const AIBOSS = {
  id: 'aiboss',
  title: 'AI-Göran',
  tagline: 'Dra ur sladden till tre GPU-kluster. Sen tre till. I 3D.',
  level: 'kontoret',
  station: { x: 220, label: 'AI-labbet' },
  lockPlayer: true,   // vi styr vår egen spelare i update()
  start: 100,         // håller kameran stilla (camX = 0)
  henrik: null,
  music: 'stress',

  intro: [
    ['H', 'Här är han: AI-GÖRAN! Han har inte skrivit en rad kod sedan 2024 och är mycket stolt över det.'],
    ['D', 'Varför är han så... stor?'],
    ['H', 'Det är hans personliga varumärke. Han skjuter slogans. Ducka med piltangenterna!'],
    ['D', 'Hur stoppar man honom?'],
    ['H', 'Han drivs av tre GPU-kluster. Stå i den gröna rutan tills sladden är urdragen. Tre gånger.'],
  ],
  goal: (g) => {
    const f = g.flags, z = f.zone;
    if (f.stage === 'morph') return 'Fas 2 laddar... AI-Göran genererar en dimension';
    const life = '♥'.repeat(Math.max(0, f.lives)) + '♡'.repeat(LIVES - Math.max(0, f.lives));
    return (f.stage === 2 ? 'Fas 2 (3D) · ' : 'Fas 1 · ') + `${life} · Kluster ${f.cleared}/3` + (z ? ` · Sladd ${z.left.toFixed(1)} s` : '');
  },

  setup(g) {
    initSprites();
    g.flags = {
      stage: 1, morph: 0, lives: LIVES, cleared: 0, timers: {}, hand: 0, calm: 1.2, dying: 0, won: false,
      bullets: [], parts: [], shake: 0, flash: 0, shoutT: 0, tauntT: 6, dodged: 0,
      pl: { x: 160, y: 140, inv: 0, moving: false, facing: 1 },
      boss: { talk: 0, raise: [0, 0], hurt: 0 },
      goran: { x: 262, y: 24 }, // pratbubblan hamnar till höger om huvudet
      bg: buildBG(),
      zone: null,
    };
    placeZone(g);
    if (checkpoint3D) { // omtag efter att man nått fas 2: börja direkt i 3D
      enter3D(g);
      g.shout('FAS 2: 3D! Mellanslag = hoppa'); g.flags.shoutT = 2.2; g.flags.calm = 2;
    }
  },

  // namnlappen "Du" följer vår egen spelare (motorn sätter den 28 px ovanför fötterna)
  labels(g) {
    const f = g.flags, p = f.pl;
    if (!p || f.stage === 'morph') return [];
    if (p.z == null) return [{ text: 'Du', x: p.x, feetY: p.y + 15 }];
    const [sx, sy, s] = proj(p.x, p.y, p.z);
    return [{ text: 'Du', x: sx, feetY: sy - 27 * PL3 * s + 26 }];
  },

  update(g, dt) {
    const f = g.flags, p = f.pl;
    if (f.stage === 'morph') return updateMorph(g, dt);
    if (f.stage === 2) return update3D(g, dt);

    // Du
    let dx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0), dy = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
    if (dx && dy) { dx *= 0.7071; dy *= 0.7071; }
    p.x = clamp(p.x + dx * 100 * dt, AREA.x0, AREA.x1);
    p.y = clamp(p.y + dy * 100 * dt, AREA.y0, AREA.y1);
    p.moving = !!(dx || dy);
    if (dx) p.facing = Math.sign(dx);
    if (p.inv > 0) p.inv -= dt;

    tickBoss(g, dt);

    // Bossen dör långsamt efter tredje klustret
    if (f.dying > 0) {
      f.dying -= dt;
      if (Math.random() < dt * 14) part(f, rand(110, 210), rand(BOSS_Y + 6, BOSS_Y + 66), rand(-40, 40), rand(-50, 0), rand(0.4, 0.9), pick(['#ffc23d', '#f1ede0', '#7af0ff']), 2, 90);
      if (f.dying <= 0) return 'win';
    } else {
      // Rutan: nedräkningen går bara medan du står i den, och den står kvar när du går ut
      const z = f.zone;
      z.born += dt;
      const was = z.on;
      z.on = inZone(z, p);
      if (z.on) {
        z.left = Math.max(0, z.left - dt);
        if (!was) { g.sfx.click(); if (Math.random() < 0.5) goranSay(g, pick(PULL_LINES), 1.6); }
        f.tickAcc = (f.tickAcc || 0) + dt;
        if (f.tickAcc >= 0.5) { f.tickAcc = 0; g.sfx.tick(); }
        if (Math.random() < dt * 10) part(f, z.x + rand(-6, 6), z.y - 4, rand(-20, 20), rand(-50, -20), 0.4, '#ffc23d', 1, 60);
        if (z.left <= 0) { clusterDown(g); if (f.stage !== 1) return; }
      }

      // Skjut (inte om tredje klustret precis gick ner)
      if (f.dying > 0) { /* tyst */ } else if (f.calm > 0) f.calm -= dt;
      else PATTERNS[f.cleared](f, dt);
      f.tauntT -= dt;
      if (f.tauntT <= 0 && !f.dying) { goranSay(g, pick(TAUNTS), 2); f.tauntT = rand(7, 10); }
    }

    // Skotten
    for (let i = f.bullets.length - 1; i >= 0; i--) {
      const b = f.bullets[i];
      b.age += dt;
      b.x += Math.cos(b.ang) * b.spd * dt;
      b.y += Math.sin(b.ang) * b.spd * dt;
      if (b.x + b.hw < -30 || b.x - b.hw > W + 30 || b.y - b.hh > H + 4 || b.y < -40 || b.age > 15) {
        f.bullets[i] = f.bullets[f.bullets.length - 1]; f.bullets.pop(); f.dodged++; continue;
      }
      if (p.inv > 0 || f.dying > 0) continue;
      // träffytan är kroppen, lite mindre än figuren
      if (Math.abs(b.x - p.x) < b.hw + 3 && b.y + b.hh > p.y - 9 && b.y - b.hh < p.y + 10) {
        hit(g);
        if (f.lives <= 0) return 'fail';
        break;
      }
    }

    tickFx(f, dt);
  },

  onWin(g) {
    const f = g.flags;
    f.won = true;
    checkpoint3D = false;
    clearBullets(f);
    g.shout(null);
    g.stats.aiSlogans = (g.stats.aiSlogans ?? 0) + f.dodged;
  },

  draw(g, ctx) {
    const f = g.flags;
    if (f.stage === 2 || (f.stage === 'morph' && f.morph >= MORPH_T / 2)) draw3D(g, ctx); else draw2D(g, ctx);
    if (f.stage === 'morph') drawMorph(g, ctx);
  },

  win: [
    ['H', 'Alla sex klustren nere! Både de platta och de tredimensionella. AI-Göran har gått i viloläge.'],
    ['D', 'Han ser ut att buffra.'],
    ['H', 'Han har lovat en uppdaterad version till nästa år. Med ännu fler parametrar.'],
  ],
  fail: [
    ['H', 'Ditt sunda förnuft tog slut! Du har just beställt 40 AI-licenser åt hela avdelningen.'],
    (g) => ['H', g.flags.stage === 2 ? 'Dra ur sladden igen. Den tredje dimensionen står kvar, tyvärr.' : 'Dra ur sladden igen. Från början!'],
  ],
};
export default AIBOSS;
