// The world: starry sky, Earth in the distance and the solid moon ground.
export const WIDTH = 320;
export const HEIGHT = 180;
export const GROUND_Y = 150; // y of the walkable surface

// Deterministic pseudo-random number from an integer, so the scenery is the same every frame.
function hash(n) {
  let h = Math.imul(n | 0, 0x27d4eb2d) ^ 0x9e3779b9;
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function drawStars(ctx, camX, parallax, density, color) {
  const cell = 16;
  const offset = camX * parallax;
  const first = Math.floor(offset / cell) - 1;
  ctx.fillStyle = color;
  for (let c = first; c < first + WIDTH / cell + 2; c++) {
    for (let r = 0; r < GROUND_Y / cell; r++) {
      const seed = c * 7919 + r * 104729 + density * 31;
      if (hash(seed) > density) continue;
      const x = Math.round(c * cell + hash(seed + 1) * cell - offset);
      const y = Math.round(r * cell + hash(seed + 2) * cell);
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

function drawEarth(ctx, camX) {
  const x = Math.round(250 - camX * 0.02);
  const y = 40;
  ctx.save();
  ctx.beginPath(); ctx.arc(x, y, 14, 0, Math.PI * 2); ctx.clip();
  ctx.fillStyle = '#2a5bd7'; ctx.fillRect(x - 14, y - 14, 28, 28);
  ctx.fillStyle = '#3fae5a';
  ctx.fillRect(x - 8, y - 6, 6, 4); ctx.fillRect(x - 6, y - 2, 4, 5);
  ctx.fillRect(x + 3, y + 2, 6, 4); ctx.fillRect(x + 4, y - 9, 4, 3);
  ctx.fillStyle = 'rgba(5,6,15,0.55)'; // night side
  ctx.beginPath(); ctx.arc(x + 6, y + 3, 14, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawGround(ctx, camX) {
  ctx.fillStyle = '#6f6f7c';
  ctx.fillRect(0, GROUND_Y, WIDTH, HEIGHT - GROUND_Y);
  ctx.fillStyle = '#a9a9b8';
  ctx.fillRect(0, GROUND_Y, WIDTH, 2);
  ctx.fillStyle = '#8a8a98';
  ctx.fillRect(0, GROUND_Y + 2, WIDTH, 1);

  // Craters and pebbles, tiled along x so the ground scrolls with the camera.
  const tile = 24;
  const first = Math.floor(camX / tile) - 1;
  for (let t = first; t < first + WIDTH / tile + 3; t++) {
    const bx = t * tile - Math.round(camX);
    const h = hash(t + 1000);
    if (h < 0.35) { // crater
      const cx = bx + Math.round(hash(t + 2000) * 12);
      const cy = GROUND_Y + 8 + Math.round(hash(t + 3000) * 16);
      const w = 6 + Math.round(hash(t + 4000) * 8);
      ctx.fillStyle = '#5a5a66'; ctx.fillRect(cx, cy, w, 3);
      ctx.fillStyle = '#9696a4'; ctx.fillRect(cx + 1, cy + 3, w - 2, 1);
    }
    for (let p = 0; p < 3; p++) { // pebbles
      const px = bx + Math.round(hash(t * 3 + p + 5000) * tile);
      const py = GROUND_Y + 5 + Math.round(hash(t * 3 + p + 6000) * 24);
      ctx.fillStyle = hash(t * 3 + p + 7000) > 0.5 ? '#7d7d8a' : '#62626e';
      ctx.fillRect(px, py, 2, 1);
    }
  }
}

export function drawWorld(ctx, camX) {
  ctx.fillStyle = '#05060f';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  drawStars(ctx, camX, 0.05, 0.35, '#3c4260');
  drawStars(ctx, camX, 0.15, 0.2, '#c8cdf0');
  drawEarth(ctx, camX);
  drawGround(ctx, camX);
}
