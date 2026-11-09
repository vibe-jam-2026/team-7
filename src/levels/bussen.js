// The bus ride to Haga slott: a side view of the bus while the countryside rushes past.
import { WIDTH, HEIGHT, hash } from '../world.js';
import { HENRIK, PLAYER, NATALIE, MARKUS, GUSTAV } from '../sprites.js';

function r(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }

const BUS_X = 70, BUS_W = 184, BUS_TOP = 88;
const ROAD_Y = 146;

// Who sits where (x of their head); used for speech bubbles.
export const SEATS = { D: 104, N: 132, M: 160, G: 188, H: 228 };
export const HEAD_Y = 102;
const LOOKS = { D: PLAYER, N: NATALIE, M: MARKUS, G: GUSTAV, H: HENRIK };

const SIGNS = ['ENKÖPING 34', 'HAGA SLOTT 12', 'ÄLG 3 km', 'WI-FI SAKNAS', 'LUNCH →'];

function sign(ctx, x, label) {
  r(ctx, x + 14, ROAD_Y - 30, 2, 30, '#777');
  ctx.font = 'bold 7px monospace';
  const w = Math.ceil(ctx.measureText(label).width) + 6;
  r(ctx, x, ROAD_Y - 42, w, 12, '#ffffff'); r(ctx, x + 1, ROAD_Y - 41, w - 2, 10, '#2e6fc4');
  ctx.fillStyle = '#fff'; ctx.textBaseline = 'top'; ctx.textAlign = 'left';
  ctx.fillText(label, x + 3, ROAD_Y - 40);
}

export const bussen = {
  name: 'Bussen',
  width: WIDTH,
  gravity: 520,
  jumpSpeed: 200,
  dustColor: '#999',
  draw(ctx, camX, t) {
    // Sky
    ['#86bdea', '#97c8ee', '#a9d3f2', '#bcdff6'].forEach((c, i) => r(ctx, 0, i * 25, WIDTH, 25, c));
    r(ctx, 0, 100, WIDTH, 30, '#bcdff6');
    ctx.fillStyle = '#fff4c2'; ctx.beginPath(); ctx.arc(270, 26, 10, 0, Math.PI * 2); ctx.fill();

    // Hills far away (slow), trees (faster), fields
    for (let x = 0; x < WIDTH; x++) {
      const h = 18 + Math.sin((x + t * 12) / 30) * 6 + Math.sin((x + t * 12) / 11) * 2;
      r(ctx, x, 118 - h, 1, h, '#7aa37a');
    }
    r(ctx, 0, 118, WIDTH, ROAD_Y - 118, '#86b85a');
    const off = t * 70;
    for (let i = Math.floor(off / 26) - 1; i < Math.floor(off / 26) + 15; i++) {
      if (hash(i) < 0.35) continue;
      const x = Math.round(i * 26 - off);
      const h = 14 + Math.round(hash(i + 5) * 12);
      r(ctx, x + 4, 124 - 4, 2, 6, '#5a4030');
      r(ctx, x, 124 - h, 10, h - 4, hash(i + 9) > 0.5 ? '#3d7442' : '#2f5d34');
    }
    // Red barn now and then
    const bx = Math.round(((1000 - t * 40) % 700 + 700) % 700 - 100);
    r(ctx, bx, 104, 30, 18, '#a8322c'); r(ctx, bx - 2, 100, 34, 5, '#5a3a30'); r(ctx, bx + 12, 112, 6, 10, '#f2f2f2');

    // Road
    r(ctx, 0, ROAD_Y - 2, WIDTH, 2, '#9a9a8a');
    r(ctx, 0, ROAD_Y, WIDTH, HEIGHT - ROAD_Y, '#4a4d55');
    const dash = (t * 220) % 40;
    for (let x = -dash; x < WIDTH; x += 40) r(ctx, Math.round(x), ROAD_Y + 18, 20, 2, '#f2f2f2');

    // Road signs passing by, behind the bus
    const period = 2.6;
    const k = Math.floor(t / period);
    const sx = Math.round(WIDTH + 20 - (t - k * period) * 160);
    sign(ctx, sx, SIGNS[k % SIGNS.length]);

    // The bus
    const bob = Math.sin(t * 9) > 0.6 ? -1 : 0;
    const y = BUS_TOP + bob;
    r(ctx, BUS_X - 1, y - 1, BUS_W + 2, 54, '#1e1b22');
    r(ctx, BUS_X, y, BUS_W, 52, '#f2f2f2');
    r(ctx, BUS_X, y + 30, BUS_W, 5, '#ffb838');
    r(ctx, BUS_X + BUS_W - 10, y + 6, 10, 22, '#2b3a55'); // windscreen
    // Windows with people inside
    for (let i = 0; i < 6; i++) {
      const wx = BUS_X + 8 + i * 28;
      r(ctx, wx, y + 6, 24, 20, '#2b3a55');
      r(ctx, wx + 1, y + 7, 22, 3, '#3d5070');
    }
    for (const [who, hx] of Object.entries(SEATS)) {
      const look = LOOKS[who];
      const hb = Math.sin(t * 9 + hx) > 0.7 ? -1 : 0;
      const top = y + 12 + hb + (who === 'H' ? -2 : 0);
      if (look.hairLong) r(ctx, hx - 4, top, 3, 9, look.hair);
      r(ctx, hx - 3, top + 1, 7, 7, look.skin);
      r(ctx, hx - 3, top, 7, 2, look.hair);
      r(ctx, hx + 2, top + 3, 1, 1, '#1e1b22');
      if (look.glasses) r(ctx, hx + 1, top + 3, 3, 1, '#1e1b22');
      if (look.headphones) r(ctx, hx - 3, top - 1, 7, 1, '#222');
      if (look.beard) r(ctx, hx, top + 5, 4, 2, look.hair);
      r(ctx, hx - 4, top + 8, 9, 6, look.jacket);
      if (who === 'H') { r(ctx, hx + 4, top + 5, 2, 2, '#222'); r(ctx, hx + 5, top + 7, 1, 3, '#222'); } // microphone
    }
    ctx.font = 'bold 7px monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#2e5fb8'; ctx.fillText('HAGA EXPRESS', BUS_X + 8, y + 37);
    r(ctx, BUS_X + BUS_W - 4, y + 40, 4, 4, '#fff7b0'); // headlight
    // Wheels
    for (const wx of [BUS_X + 34, BUS_X + BUS_W - 36]) {
      ctx.fillStyle = '#1e1b22'; ctx.beginPath(); ctx.arc(wx, ROAD_Y - 2, 9, 0, Math.PI * 2); ctx.fill();
      r(ctx, wx - 3, ROAD_Y - 5, 6, 6, '#9a9aa8');
      const a = t * 20;
      r(ctx, wx + Math.round(Math.cos(a) * 5) - 1, ROAD_Y - 2 + Math.round(Math.sin(a) * 5) - 1, 2, 2, '#666');
    }
    // Exhaust
    for (let i = 0; i < 4; i++) {
      const p = (t * 1.5 + i / 4) % 1;
      r(ctx, Math.round(BUS_X - 4 - p * 40), Math.round(ROAD_Y - 6 - p * 10), 3 + Math.round(p * 4), 3 + Math.round(p * 3), `rgba(200,200,200,${0.7 - p * 0.7})`);
    }
  },
};
