// Finale: after lunch to lunch you finally get to relax in the spa at Haga slott.
// A short film (like the bus ride): the evening falls over the castle, you walk out in a bathrobe,
// slip into the hot tub and ignore your phone. Press space to skip.
import { WIDTH, hash } from '../world.js';
import { drawPerson, drawItem, PLAYER } from '../sprites.js';
import { drawCastle } from '../levels/haga.js';

const ROBE = { jacket: '#f6f2ea', shirt: '#ddd6c8', pants: '#f6f2ea', shoes: '#f6f2ea', hair: PLAYER.hair, skin: PLAYER.skin };
const SWIM = { jacket: PLAYER.skin, shirt: PLAYER.skin, pants: '#2f7fc1', shoes: PLAYER.skin, hair: PLAYER.hair, skin: PLAYER.skin };

// Timeline in seconds
const WALK_START = 0.6, WALK_END = 4.4, HOP_START = 4.8, HOP_END = 5.4;
const DECK_Y = 160;                                          // feet on the deck
const TUB = { x: 170, w: 92, rim: 134, water: 141, front: 152 };
const IN_TUB_X = 204, IN_TUB_FEET = 156;                     // shoulders just above the water
const PHONE = { x: 286, y: 147 };

// [seconds, who, text]. who: 'H' from the sauna, 'D' you, 'P' your phone
const SCRIPT = [
  [1.0, 'H', 'Ingen agenda ikväll. Jag lovar!'],
  [5.9, 'D', 'Ahhh...'],
  [8.0, 'P', 'Natalie: 13.2?!'],
  [9.2, 'P', 'Markus: Testmiljön!!'],
  [10.4, 'P', 'Gustav: Ny deadline?'],
  [11.8, 'D', 'Jag hör ingenting. Jag är på spa.'],
  [14.2, 'H', 'Okej, EN liten allsång?'],
  [15.6, 'D', 'Nej.'],
];

// What the HUD says over time (the "goal" line)
const CAPTIONS = [
  [0, 'Agendapunkt 47: ingenting'],
  [6, 'Frånvaromeddelande: PÅ'],
  [8, 'Notiser: ignoreras'],
  [12, 'Möten kvar: 0'],
  [14, 'Klockan: vem bryr sig?'],
];

const r = (ctx, x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
const disc = (ctx, x, y, rad, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(Math.round(x), Math.round(y), rad, 0, Math.PI * 2); ctx.fill(); };

const SKY = ['#262a52', '#33366a', '#47417c', '#634c88', '#875a8c', '#ab6886', '#cf7d7c', '#e89a78', '#f4bb84'];

function drawSky(ctx, t, time) {
  const h = Math.ceil(122 / SKY.length);
  SKY.forEach((c, i) => r(ctx, 0, i * h, WIDTH, h, c));
  // Stars twinkle in as the evening falls
  for (let i = 0; i < 40; i++) {
    const x = Math.floor(hash(i + 500) * WIDTH), y = 14 + Math.floor(hash(i + 600) * 50);
    if (Math.sin(time * 1.3 + i * 2.1) > 0.2 - Math.min(1, t / 8)) r(ctx, x, y, 1, 1, y < 40 ? '#fff6dc' : 'rgba(255,246,220,.5)');
  }
  // Setting sun to the right of the castle
  const sy = 98 + Math.min(t, 16) * 1.2;
  disc(ctx, 306, sy, 13, 'rgba(255,207,138,.35)');
  disc(ctx, 306, sy, 9, '#ffcf8a');
  disc(ctx, 306, sy, 6, '#ffe6b8');
  // Friendly fireworks over Haga (the good kind)
  if (t > 9) {
    const period = 1.7, k = Math.floor(time / period), age = time % period;
    const cx = 60 + hash(k + 70) * 200, cy = 24 + hash(k + 71) * 26;
    const col = ['#ffd27a', '#ff8fb1', '#9fe3ff', '#c3ff9a'][k % 4];
    if (age < 1.3) {
      for (let i = 0; i < 20; i++) {
        const a = (i / 20) * Math.PI * 2, d = age * 22 * (1 - age * 0.25);
        r(ctx, cx + Math.cos(a) * d, cy + Math.sin(a) * d + age * age * 6, 1, 1, age < 0.15 ? '#fffbe8' : col);
      }
    }
  }
  // Dark treeline on both sides of the castle
  for (let x = 0; x < WIDTH; x += 5) {
    const th = 8 + Math.floor(hash(x + 900) * 10);
    r(ctx, x, 122 - th, 6, th, '#2b2a46');
  }
}

// Tiny 3×5 pixel letters for the sauna sign
const GLYPHS = {
  B: ['110', '101', '110', '101', '110'], A: ['010', '101', '111', '101', '101'], S: ['011', '100', '010', '001', '110'],
  T: ['111', '010', '010', '010', '010'], U: ['101', '101', '101', '101', '111'],
};
function pixelText(ctx, text, x, y, c) {
  [...text].forEach((ch, i) => GLYPHS[ch].forEach((row, yy) => [...row].forEach((on, xx) => {
    if (on === '1') r(ctx, x + i * 4 + xx, y + yy, 1, 1, c);
  })));
}

function drawSauna(ctx, time) {
  // Falu-red sauna hut with a smoking chimney
  r(ctx, 6, 98, 46, 30, '#8a2b22');
  for (let x = 8; x < 52; x += 5) r(ctx, x, 98, 1, 30, '#74231c');
  r(ctx, 3, 92, 52, 6, '#3a3a42'); r(ctx, 3, 92, 52, 1, '#55555f');
  r(ctx, 40, 84, 5, 8, '#55555f');
  for (let i = 0; i < 4; i++) {
    const p = (time * 0.35 + i / 4) % 1;
    disc(ctx, 42 + Math.sin(time + i) * 2 + p * 6, 82 - p * 22, 2 + p * 3, `rgba(220,220,230,${(0.35 * (1 - p)).toFixed(3)})`);
  }
  r(ctx, 14, 108, 10, 20, '#4a1a14');                       // door
  r(ctx, 22, 118, 1, 2, '#e8c070');
  r(ctx, 31, 106, 12, 8, '#ffcf6b');                        // warm window
  r(ctx, 37, 106, 1, 8, '#74231c');
  r(ctx, 15, 99, 25, 7, '#f6f2ea');                        // sign
  pixelText(ctx, 'BASTU', 18, 100, '#8a2b22');
}

function drawDeck(ctx) {
  r(ctx, 0, 122, WIDTH, 6, '#3d5e3a'); r(ctx, 0, 122, WIDTH, 1, '#56794c');
  r(ctx, 0, 128, WIDTH, 52, '#7c5236');
  for (let y = 128; y < 180; y += 5) {
    r(ctx, 0, y, WIDTH, 1, '#6a4530');
    for (let x = (y * 7) % 37; x < WIDTH; x += 53) r(ctx, x, y + 1, 1, 4, '#6a4530');
  }
  r(ctx, 0, 128, WIDTH, 1, '#94663f');
}

function drawTowels(ctx) {
  r(ctx, 62, 122, 2, 34, '#5c3a24'); r(ctx, 88, 122, 2, 34, '#5c3a24');
  r(ctx, 62, 124, 28, 2, '#7a5236');
  r(ctx, 66, 126, 10, 14, '#cfe3e8'); r(ctx, 66, 139, 10, 1, '#a9c3c9');
  r(ctx, 78, 126, 8, 10, '#e8c6c0');
  r(ctx, 62, 148, 28, 2, '#7a5236');
  disc(ctx, 68, 144, 3, '#f4f0e6'); disc(ctx, 76, 144, 3, '#e8c6c0'); disc(ctx, 84, 144, 3, '#f4f0e6');
}

function lantern(ctx, x, y, time) {
  disc(ctx, x, y, 14, 'rgba(255,200,120,.08)');
  disc(ctx, x, y, 8, 'rgba(255,200,120,.12)');
  r(ctx, x - 2, y - 6, 5, 9, '#2a2420');
  r(ctx, x - 1, y - 4, 3, 5, Math.sin(time * 9) > 0 ? '#ffd27a' : '#ffe8b0');
}

function drawZ(ctx, x, y, s, c) {
  r(ctx, x, y, s, 1, c); r(ctx, x, y + s - 1, s, 1, c);
  for (let i = 1; i < s - 1; i++) r(ctx, x + s - 1 - i, y + i, 1, 1, c);
}

// Where you are at film time t
function pose(t) {
  if (t < WALK_END) {
    const k = Math.max(0, Math.min(1, (t - WALK_START) / (WALK_END - WALK_START)));
    return { m: 'walk', x: -12 + k * 162, y: DECK_Y, walking: k > 0 && k < 1, look: ROBE };
  }
  if (t < HOP_START) return { m: 'stand', x: 150, y: DECK_Y, look: SWIM };
  if (t < HOP_END) {
    const k = (t - HOP_START) / (HOP_END - HOP_START);
    return { m: 'hop', k, x: 150 + k * (IN_TUB_X - 150), y: DECK_Y + (IN_TUB_FEET - DECK_Y) * k - Math.sin(Math.PI * k) * 26, look: SWIM };
  }
  return { m: 'tub', x: IN_TUB_X, y: IN_TUB_FEET, look: SWIM };
}

export default {
  id: 'spa',
  title: 'Äntligen spa',
  tagline: 'Agendapunkt 47: ingenting',
  station: { x: 1150, label: 'Spat' },
  start: 160,
  henrik: null,
  cinematic: true,
  music: 'slott', // calm at last
  stayAfterWin: true, // the story ends here, in the spa, not back in the hub
  time: 17,
  timeoutWins: true,
  meter: 'Lugn',
  intro: [],
  goal: (g) => CAPTIONS.filter(([s]) => g.t >= s).pop()[1],
  setup(g) { g.flags.i = 0; g.meter = 0; },
  update(g) {
    g.meter = Math.max(0, Math.min(100, ((g.t - 1) / 12) * 100));
    while (g.flags.i < SCRIPT.length && g.t >= SCRIPT[g.flags.i][0]) {
      const [, who, text] = SCRIPT[g.flags.i++];
      if (who === 'H') g.say(text, { x: 58, y: 90 }, 'henrik', 2.6);
      else if (who === 'P') g.say(text, { x: PHONE.x - 12, y: PHONE.y - 8 }, '', 1.6);
      else g.say(text, { x: pose(g.t).x, y: (g.t >= HOP_END ? IN_TUB_FEET : DECK_Y) - 32 }, 'me', 2.4);
    }
  },
  // Name tag for you (drawn here in screen coordinates, so add the camera)
  labels(g) { const p = pose(g.t); return [{ text: 'Du', x: p.x + g.camX, feetY: p.y }]; },
  draw(g, ctx) {
    const t = g.t, time = g.time;
    drawSky(ctx, t, time);
    ctx.save(); ctx.translate(15, -28); drawCastle(ctx, 0, time, true); ctx.restore();
    ctx.fillStyle = 'rgba(80,40,90,0.18)'; ctx.fillRect(0, 0, WIDTH, 122); // dusk over the castle
    drawDeck(ctx);
    drawSauna(ctx, time);
    drawTowels(ctx);
    lantern(ctx, 160, 132, time); lantern(ctx, 274, 132, time + 1);

    // Your phone on a stool, buzzing while the project managers panic
    r(ctx, PHONE.x - 6, PHONE.y + 2, 14, 2, '#5c3a24'); r(ctx, PHONE.x - 5, PHONE.y + 4, 2, 9, '#5c3a24'); r(ctx, PHONE.x + 5, PHONE.y + 4, 2, 9, '#5c3a24');
    const buzz = t > 7.8 && t < 11.6 && Math.sin(time * 40) > 0 ? 1 : 0;
    r(ctx, PHONE.x - 2 + buzz, PHONE.y - 4, 5, 6, '#222');
    r(ctx, PHONE.x - 1 + buzz, PHONE.y - 3, 3, 4, t > 7.8 && t < 11.6 ? '#7fc4ff' : '#333');

    // Hot tub: back rim and depths
    r(ctx, TUB.x, TUB.rim, TUB.w, 4, '#5c3a24'); r(ctx, TUB.x, TUB.rim, TUB.w, 1, '#8a5e3e');
    r(ctx, TUB.x + 3, TUB.rim + 4, TUB.w - 6, TUB.front - TUB.rim - 4, '#1d6f82');
    drawItem(ctx, TUB.x + TUB.w - 10, TUB.rim - 3, { kind: 'coffee' }, time); // decaf, promise

    const p = pose(t);
    const inside = p.m === 'tub' || (p.m === 'hop' && p.k > 0.6);
    if (t >= WALK_END) { // the bathrobe, dropped on the deck
      r(ctx, 140, 157, 14, 3, '#f6f2ea'); r(ctx, 142, 156, 9, 1, '#f6f2ea'); r(ctx, 141, 160, 11, 1, '#ddd6c8'); r(ctx, 146, 157, 4, 1, '#9fbfd0');
    }
    const drawMe = () => {
      const bob = p.m === 'tub' ? Math.round(Math.sin(time * 1.6) * 0.6) : 0;
      drawPerson(ctx, p.x, p.y + bob, p.look, 1, time, !!p.walking);
      if (p.m === 'tub') { // eyes closed and a towel on the head
        const x = Math.round(p.x), y = Math.round(p.y + bob);
        r(ctx, x + 2, y - 24, 1, 1, PLAYER.skin); r(ctx, x + 1, y - 24, 3, 1, '#7a4a3a');
        r(ctx, x - 4, y - 30, 9, 3, '#f6f2ea'); r(ctx, x - 3, y - 31, 7, 1, '#f6f2ea'); r(ctx, x - 4, y - 28, 9, 1, '#ddd6c8');
      }
    };
    if (inside) drawMe();
    // Water on top of whoever is in it, then the rim in front
    r(ctx, TUB.x + 3, TUB.water + 1, TUB.w - 6, TUB.front - TUB.water - 1, 'rgba(38,150,172,0.8)');
    r(ctx, TUB.x + 3, TUB.water, TUB.w - 6, 1, '#a6f0f2');
    for (let k = 0; k < 6; k++) r(ctx, TUB.x + 5 + ((k * 15 + Math.floor(time * 7)) % (TUB.w - 14)), TUB.water + 3 + (k % 3) * 3, 4, 1, 'rgba(170,240,245,.45)');
    if (p.m === 'tub') { const rr = Math.floor(time * 4) % 3; r(ctx, p.x - 6 - rr, TUB.water + 1, 13 + rr * 2, 1, 'rgba(200,250,252,.6)'); }
    if (p.m === 'hop' && p.k > 0.9 || (t >= HOP_END && t < HOP_END + 0.5)) { // splash
      const a = Math.max(0, t - HOP_END);
      for (let i = 0; i < 12; i++) r(ctx, IN_TUB_X + (hash(i) - 0.5) * 30 * (a * 2 + 0.3), TUB.water - 10 * Math.sin(Math.PI * Math.min(1, a * 2)) * hash(i + 9), 1, 1, '#c8f6f8');
    }
    r(ctx, TUB.x, TUB.rim, 3, TUB.front - TUB.rim, '#5c3a24'); r(ctx, TUB.x + TUB.w - 3, TUB.rim, 3, TUB.front - TUB.rim, '#5c3a24');
    r(ctx, TUB.x, TUB.front, TUB.w, 10, '#6a4530'); r(ctx, TUB.x, TUB.front, TUB.w, 1, '#8a5e3e');
    for (let x = TUB.x + 5; x < TUB.x + TUB.w; x += 6) r(ctx, x, TUB.front + 1, 1, 9, '#5c3a24');
    if (!inside) drawMe();

    // Steam and z's
    for (let i = 0; i < 9; i++) {
      const ph = (time * 0.4 + hash(i + 40)) % 1;
      disc(ctx, TUB.x + 8 + hash(i + 20) * (TUB.w - 16) + Math.sin(time + i) * 2, TUB.water - ph * 22, 1.5 + ph * 2.5, `rgba(255,255,255,${(0.2 * (1 - ph)).toFixed(3)})`);
    }
    if (t > 7) {
      for (let i = 0; i < 3; i++) {
        const ph = (time * 0.45 + i / 3) % 1;
        drawZ(ctx, IN_TUB_X + 6 + ph * 10, IN_TUB_FEET - 34 - ph * 22, i === 1 ? 4 : 3, `rgba(236,238,230,${(0.9 * (1 - ph)).toFixed(3)})`);
      }
    }

    if (t < 0.8) { ctx.fillStyle = `rgba(255,248,236,${(1 - t / 0.8).toFixed(3)})`; ctx.fillRect(0, 0, WIDTH, 180); }
  },
  win: [['D', 'Det här är den bästa agendapunkten hittills.']],
  fail: [],
};
