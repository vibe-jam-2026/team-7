// Level: Haga slott by Lake Mälaren, outside Enköping.
// Built in the 1660s after drawings by Nicodemus Tessin the Elder: a plastered stone house
// in two storeys with two attached wings, pilasters dividing the lake facade into five bays,
// and freestanding two-storey wing buildings in the grounds.
// The plaster and roof colours below are a guess; change PALETTE to match the real castle.
import { WIDTH, HEIGHT, GROUND_Y, hash } from '../world.js';

const LEVEL_WIDTH = 1400;
const SHORE_X = 1180; // the lawn ends here and the jetty goes out into Mälaren

const PALETTE = {
  plaster: '#ecd9a8', plasterShade: '#d4bd85', trim: '#fbf7ec',
  roof: '#3a3f4a', roofLight: '#535a68', glass: '#2b3a55', glassLight: '#5d7fa8',
  door: '#4a2f22', plinth: '#9b958a', outline: '#2a2620',
};

function rect(ctx, x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); }

// ---- Background --------------------------------------------------------------

function drawSky(ctx) {
  const bands = ['#7fb6e8', '#8dc0ec', '#9ccaf0', '#acd4f3', '#bddef6', '#cde7f8'];
  const h = Math.ceil(120 / bands.length);
  bands.forEach((c, i) => rect(ctx, 0, i * h, WIDTH, h, c));
  rect(ctx, 0, 120, WIDTH, GROUND_Y - 120, '#cde7f8');
  // Sun
  ctx.fillStyle = '#fff4c2';
  ctx.beginPath(); ctx.arc(60, 32, 11, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fffbe6';
  ctx.beginPath(); ctx.arc(60, 32, 8, 0, Math.PI * 2); ctx.fill();
}

function drawClouds(ctx, camX, t) {
  const spacing = 140;
  const offset = camX * 0.1 - t * 3; // drift slowly
  const first = Math.floor(offset / spacing) - 1;
  for (let i = first; i < first + WIDTH / spacing + 3; i++) {
    const x = Math.round(i * spacing + hash(i + 50) * 60 - offset);
    const y = 14 + Math.round(hash(i + 60) * 40);
    const w = 24 + Math.round(hash(i + 70) * 20);
    rect(ctx, x, y + 4, w, 5, '#ffffff');
    rect(ctx, x + 4, y, w - 12, 5, '#ffffff');
    rect(ctx, x + 2, y + 9, w - 4, 1, '#dbe9f5');
  }
}

// Mälaren and the far shore, behind everything.
function drawLake(ctx, camX, t) {
  const offset = camX * 0.3;
  // Far shore: a low line of forest
  for (let x = 0; x < WIDTH; x++) {
    const wx = Math.floor(x + offset);
    const h = 4 + Math.round(hash(Math.floor(wx / 3)) * 4 + Math.sin(wx / 40) * 2);
    rect(ctx, x, 120 - h, 1, h, '#4f7a5a');
  }
  rect(ctx, 0, 120, WIDTH, GROUND_Y - 120, '#4f86b8');
  // Glitter on the water
  for (let i = 0; i < 40; i++) {
    const x = Math.round((hash(i + 900) * (WIDTH + 60) - offset * 0.5 + t * 4) % (WIDTH + 60) + WIDTH + 60) % (WIDTH + 60) - 30;
    const y = 122 + Math.round(hash(i + 950) * 26);
    if (Math.sin(t * 2 + i) > 0.2) rect(ctx, x, y, 3, 1, '#9cc6e8');
  }
  // Treeline on our shore, just behind the castle
  const near = camX * 0.6;
  for (let x = 0; x < WIDTH; x++) {
    const wx = Math.floor(x + near);
    if (x + camX > SHORE_X - 30) continue; // open view over the lake from the shore
    const h = 14 + Math.round(hash(Math.floor(wx / 6) + 300) * 10);
    rect(ctx, x, GROUND_Y - h, 1, h, '#3f6b47');
  }
}

// ---- Buildings and park (drawn at camera speed, so they sit in the world) ------

function windows(ctx, x, y, cols, rows, gapX, gapY, w, h) {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const wx = x + c * gapX, wy = y + r * gapY;
      rect(ctx, wx - 1, wy - 1, w + 2, h + 2, PALETTE.trim);
      rect(ctx, wx, wy, w, h, PALETTE.glass);
      rect(ctx, wx, wy, 1, Math.floor(h / 2), PALETTE.glassLight);
      rect(ctx, wx, wy + Math.floor(h / 2), w, 1, PALETTE.trim); // mullion
    }
  }
}

// Hipped roof: a trapezoid from (x, y+h) to the ridge.
function hippedRoof(ctx, x, y, w, h, inset) {
  for (let i = 0; i < h; i++) {
    const k = Math.round(inset * (1 - i / h));
    rect(ctx, x + k, y + i, w - k * 2, 1, i < 2 ? PALETTE.roofLight : PALETTE.roof);
  }
}

// Säteritak: steep lower roof, a short vertical break with small windows, and a low upper roof.
function sateriRoof(ctx, x, y, w) {
  hippedRoof(ctx, x + 6, y - 7, w - 12, 7, 10);       // upper roof
  rect(ctx, x + 4, y - 3, w - 8, 4, PALETTE.roofLight); // break
  for (let i = x + 14; i < x + w - 14; i += 16) rect(ctx, i, y - 2, 3, 2, PALETTE.glass);
  hippedRoof(ctx, x - 2, y + 1, w + 4, 10, 6);         // lower roof
}

function chimney(ctx, x, y) {
  rect(ctx, x, y, 4, 9, PALETTE.plasterShade);
  rect(ctx, x - 1, y, 6, 2, PALETTE.trim);
}

function flag(ctx, x, y, t) {
  rect(ctx, x, y, 1, 24, '#d8d8d8');
  for (let i = 0; i < 12; i++) {
    const wave = Math.round(Math.sin(t * 5 - i * 0.6) * 1);
    const col = i >= 3 && i <= 4 ? '#f6c623' : '#1d5fae';
    for (let j = 0; j < 8; j++) {
      const c = j >= 3 && j <= 4 ? '#f6c623' : col;
      rect(ctx, x + 1 + i, y + j + wave, 1, 1, c);
    }
  }
}

// The main house with its two attached wings.
function drawCastle(ctx, sx, t) {
  const mainW = 190, mainX = sx + 50, top = GROUND_Y - 58;
  // Attached wings, lower than the main house
  for (const wx of [sx, mainX + mainW]) {
    rect(ctx, wx, GROUND_Y - 38, 50, 38, PALETTE.plasterShade);
    hippedRoof(ctx, wx - 2, GROUND_Y - 48, 54, 10, 8);
    windows(ctx, wx + 8, GROUND_Y - 32, 3, 2, 14, 14, 5, 9);
    rect(ctx, wx, GROUND_Y - 4, 50, 4, PALETTE.plinth);
  }
  // Main house
  rect(ctx, mainX, top, mainW, 58, PALETTE.plaster);
  rect(ctx, mainX, top, mainW, 3, PALETTE.trim);             // cornice
  rect(ctx, mainX, top + 28, mainW, 2, PALETTE.trim);        // floor band
  rect(ctx, mainX, GROUND_Y - 5, mainW, 5, PALETTE.plinth);  // plinth
  // Five equal bays divided by pilasters
  const bay = mainW / 5;
  for (let b = 0; b <= 5; b++) {
    rect(ctx, Math.round(mainX + b * bay) - 2, top, 4, 53, PALETTE.trim);
  }
  for (let b = 0; b < 5; b++) {
    const bx = Math.round(mainX + b * bay);
    windows(ctx, bx + 8, top + 8, 2, 2, 15, 26, 6, 13);
  }
  // Entrance in the middle bay: double door, steps and a small pediment
  const cx = Math.round(mainX + mainW / 2);
  rect(ctx, cx - 9, GROUND_Y - 22, 18, 3, PALETTE.trim);
  rect(ctx, cx - 7, GROUND_Y - 25, 14, 3, PALETTE.trim);
  rect(ctx, cx - 6, GROUND_Y - 19, 12, 16, PALETTE.door);
  rect(ctx, cx, GROUND_Y - 19, 1, 16, PALETTE.outline);
  rect(ctx, cx - 10, GROUND_Y - 3, 20, 2, PALETTE.plinth);
  rect(ctx, cx - 12, GROUND_Y - 1, 24, 1, PALETTE.plinth);
  // Roof, chimneys and flag
  sateriRoof(ctx, mainX, top - 11, mainW);
  chimney(ctx, mainX + 30, top - 24);
  chimney(ctx, mainX + mainW - 34, top - 24);
  flag(ctx, cx, top - 42, t);
}

// A freestanding two-storey wing building.
function drawFlygel(ctx, sx) {
  rect(ctx, sx, GROUND_Y - 34, 64, 34, PALETTE.plaster);
  rect(ctx, sx, GROUND_Y - 34, 64, 2, PALETTE.trim);
  rect(ctx, sx, GROUND_Y - 4, 64, 4, PALETTE.plinth);
  hippedRoof(ctx, sx - 2, GROUND_Y - 46, 68, 12, 12);
  windows(ctx, sx + 7, GROUND_Y - 28, 4, 2, 14, 14, 5, 9);
  chimney(ctx, sx + 28, GROUND_Y - 52);
}

function drawTree(ctx, sx, seed) {
  const h = 30 + Math.round(hash(seed) * 10);
  rect(ctx, sx - 1, GROUND_Y - h + 10, 3, h - 10, '#5a4030');
  const greens = ['#2f5d34', '#3d7442', '#4d8a50'];
  for (let i = 0; i < 7; i++) {
    const ox = Math.round((hash(seed * 7 + i) - 0.5) * 18);
    const oy = Math.round(hash(seed * 11 + i) * 14);
    ctx.fillStyle = greens[i % 3];
    ctx.beginPath(); ctx.arc(sx + ox, GROUND_Y - h + oy, 7, 0, Math.PI * 2); ctx.fill();
  }
}

function drawGatePost(ctx, sx) {
  rect(ctx, sx, GROUND_Y - 22, 6, 22, PALETTE.plaster);
  rect(ctx, sx - 1, GROUND_Y - 24, 8, 3, PALETTE.trim);
  ctx.fillStyle = PALETTE.trim;
  ctx.beginPath(); ctx.arc(sx + 3, GROUND_Y - 27, 3, 0, Math.PI * 2); ctx.fill();
}

function drawBoat(ctx, sx, t) {
  const bob = Math.round(Math.sin(t * 1.5));
  const y = GROUND_Y + 10 + bob;
  rect(ctx, sx, y, 26, 4, '#8b5a3c');
  rect(ctx, sx + 2, y + 4, 22, 2, '#6b4430');
  rect(ctx, sx, y, 26, 1, '#f0e6d2');
}

// Things placed along the level, sorted by x. Add more here.
const SCENERY = [
  { x: 40, draw: (c, sx) => drawGatePost(c, sx) },
  { x: 90, draw: (c, sx) => drawGatePost(c, sx) },
  ...[150, 200, 250, 300, 350].map((x, i) => ({ x, draw: (c, sx) => drawTree(c, sx, i + 1) })),
  { x: 400, draw: (c, sx) => drawFlygel(c, sx) },
  { x: 500, draw: (c, sx, t) => drawCastle(c, sx, t) },
  { x: 810, draw: (c, sx) => drawFlygel(c, sx) },
  ...[920, 990, 1080].map((x, i) => ({ x, draw: (c, sx) => drawTree(c, sx, i + 20) })),
];

function drawGround(ctx, camX, t) {
  const shore = Math.round(SHORE_X - camX);
  // Lawn and gravel path
  const lawnW = Math.max(0, Math.min(WIDTH, shore));
  rect(ctx, 0, GROUND_Y, lawnW, HEIGHT - GROUND_Y, '#4f8a3c');
  rect(ctx, 0, GROUND_Y, lawnW, 2, '#7cb35a');
  rect(ctx, 0, GROUND_Y + 2, lawnW, 10, '#cdb98f'); // grusgång
  rect(ctx, 0, GROUND_Y + 12, lawnW, 1, '#a8956c');
  for (let i = Math.floor(camX / 6) - 1; i < Math.floor(camX / 6) + WIDTH / 6 + 2; i++) {
    const x = Math.round(i * 6 - camX + hash(i + 77) * 6);
    if (x >= shore) continue;
    rect(ctx, x, GROUND_Y + 3 + Math.round(hash(i + 88) * 8), 1, 1, '#b39f75');      // gravel
    rect(ctx, x + 2, GROUND_Y + 16 + Math.round(hash(i + 99) * 12), 1, 2, '#3f7530'); // grass tufts
  }
  if (shore < WIDTH) {
    // Mälaren in front, and a wooden jetty out to the end of the level
    rect(ctx, Math.max(0, shore), GROUND_Y, WIDTH, HEIGHT - GROUND_Y, '#3f77aa');
    for (let i = 0; i < 12; i++) {
      const x = shore + 6 + Math.round(hash(i + 400) * 200);
      if (Math.sin(t * 2 + i) > 0.3) rect(ctx, x, GROUND_Y + 6 + (i % 4) * 6, 4, 1, '#8dbbe2');
    }
    rect(ctx, shore - 2, GROUND_Y, 6, HEIGHT - GROUND_Y, '#7a6a52'); // stone edge
    const jettyEnd = Math.round(LEVEL_WIDTH - camX);
    rect(ctx, shore, GROUND_Y, jettyEnd - shore, 4, '#a07850');
    for (let x = shore; x < jettyEnd; x += 5) rect(ctx, x, GROUND_Y, 1, 4, '#7d5a3a');
    for (let x = shore + 20; x < jettyEnd; x += 40) rect(ctx, x, GROUND_Y + 4, 3, 26, '#6b4a30');
    drawBoat(ctx, jettyEnd - 70, t);
  }
}

export const haga = {
  name: 'Haga slott',
  width: LEVEL_WIDTH,
  startX: 20,
  gravity: 520,   // Earth gravity: heavier than on the Moon
  jumpSpeed: 170,
  dustColor: '#b8a47a',
  exitX: null,    // last level for now
  draw(ctx, camX, t) {
    drawSky(ctx);
    drawClouds(ctx, camX, t);
    drawLake(ctx, camX, t);
    for (const s of SCENERY) {
      const sx = Math.round(s.x - camX);
      if (sx > -320 && sx < WIDTH + 20) s.draw(ctx, sx, t);
    }
    drawGround(ctx, camX, t);
  },
};
