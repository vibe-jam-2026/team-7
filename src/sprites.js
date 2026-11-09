// Pixel-art drawings for people, items and props. All coordinates are logical pixels.
import { GROUND_Y } from './world.js';

const OUTLINE = '#1e1b22';

// How Henrik looks. Change these to make him look more like the real Henrik.
export const HENRIK = {
  jacket: '#2b3550', pants: '#2a2a33', shirt: '#e8eef7', hair: '#6b4a2b',
  skin: '#e8b894', shoes: '#3a2a20', glasses: true, lanyard: '#c0392b', prop: 'mug',
};

// You: a developer with headphones and a hoodie.
export const PLAYER = {
  jacket: '#3d6fb0', pants: '#2b2f3a', shirt: '#3d6fb0', hair: '#4a3020', skin: '#f0c4a0',
  shoes: '#e8e8e8', headphones: true,
};

// The project managers. Change colours and hair to look more like the real people.
export const NATALIE = {
  jacket: '#b0457a', pants: '#2a2a33', shirt: '#f6e8f0', hair: '#c9823a', skin: '#f1c9a5',
  shoes: '#222', hairLong: true, prop: 'phone', lanyard: '#2e86de',
};
export const MARKUS = {
  jacket: '#4a6a3a', pants: '#3a3a44', shirt: '#e8f0e0', hair: '#2b2b2b', skin: '#e2b08c',
  shoes: '#222', beard: true, prop: 'laptop', lanyard: '#2e86de',
};
export const GUSTAV = {
  jacket: '#5a4a8a', pants: '#2a2a33', shirt: '#fff', hair: '#d9b14a', skin: '#f3cfae',
  shoes: '#333', glasses: true, prop: 'mug', lanyard: '#2e86de',
};

// Kerstin from the contracts department (avdelning Kontrakt). Always carries the binder.
export const KERSTIN = {
  jacket: '#7a1f2b', pants: '#2a2a33', shirt: '#f4efe6', hair: '#9a9aa4', skin: '#f1c9a5',
  shoes: '#222', glasses: true, hairLong: true, prop: 'binder', lanyard: '#2e86de',
};

// The UX designers. They chase you around Haga with their Figma concepts (src/designers.js).
export const KATARINA = {
  jacket: '#e0a43a', pants: '#2a2a33', shirt: '#fff', hair: '#3a2418', skin: '#f1c9a5',
  shoes: '#d94f7a', glasses: true, hairLong: true, prop: 'figma', lanyard: '#a259ff',
};
export const JOCKE = {
  jacket: '#1b1b22', pants: '#2a2a33', shirt: '#1b1b22', hair: '#2b2b2b', skin: '#e2b08c',
  shoes: '#f2f2f2', beard: true, glasses: true, beanie: '#d94f3a', prop: 'figma', lanyard: '#a259ff',
};
export const NIKKI = {
  jacket: '#b6a2ff', pants: '#3a3a55', shirt: '#ffe3f0', hair: '#ff7ab8', skin: '#f3cfae',
  shoes: '#57d27a', hairLong: true, prop: 'figma', lanyard: '#a259ff',
};

export const COLLEAGUES = [
  { jacket: '#8e3b46', pants: '#33334a', shirt: '#f0e6d2', hair: '#2b2b2b', skin: '#c68e6b', shoes: '#222', prop: 'laptop', lanyard: '#2e86de' },
  { jacket: '#3b7d6e', pants: '#4a3b2b', shirt: '#fff', hair: '#d9b14a', skin: '#f1c9a5', shoes: '#222', prop: 'laptop', lanyard: '#2e86de' },
  { jacket: '#6c5a9c', pants: '#2a2a33', shirt: '#ddd', hair: '#9c4a2b', skin: '#e8b894', shoes: '#333', prop: 'phone', lanyard: '#2e86de', glasses: true },
  { jacket: '#c47a2c', pants: '#2f3b55', shirt: '#fff6e0', hair: '#4a3020', skin: '#8d5a3b', shoes: '#222', prop: 'laptop', lanyard: '#2e86de' },
];

function r(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }

// A person standing on y (feet), facing right when facing = 1.
export function drawPerson(ctx, sx, y, look, facing = 1, t = 0, walking = false) {
  const s = walking ? Math.round(Math.sin(t * 12) * 2) : 0;
  const bob = walking && Math.abs(Math.sin(t * 12)) > 0.7 ? -1 : (!walking && Math.sin(t * 2.5) > 0.7 ? -1 : 0);
  ctx.save();
  ctx.translate(Math.round(sx), Math.round(y));
  ctx.scale(facing, 1);

  const parts = [
    [-3 - s, -9, 3, 8, look.pants], [-3 - s, -2, 4, 2, look.shoes],
    [0 + s, -9, 3, 8, look.pants], [0 + s, -2, 4, 2, look.shoes],
    [-4, -19 + bob, 8, 11, look.jacket],
    [-3, -26 + bob, 7, 7, look.skin],
  ];
  ctx.fillStyle = OUTLINE;
  for (const [x, yy, w, h] of parts) ctx.fillRect(x - 1, yy - 1, w + 2, h + 2);
  for (const [x, yy, w, h, c] of parts) r(ctx, x, yy, w, h, c);

  r(ctx, 0, -19 + bob, 3, 7, look.shirt);                    // shirt
  if (look.hairLong) { r(ctx, -5, -27 + bob, 4, 11, OUTLINE); r(ctx, -4, -26 + bob, 3, 10, look.hair); }
  r(ctx, -3, -27 + bob, 7, 3, look.hair);                    // hair
  r(ctx, -3, -25 + bob, 2, 3, look.hair);
  if (look.beard) { r(ctx, 0, -22 + bob, 4, 3, look.hair); r(ctx, 2, -21 + bob, 2, 1, '#a0604a'); }
  if (look.beanie) { r(ctx, -4, -30 + bob, 9, 4, look.beanie); r(ctx, -4, -27 + bob, 9, 1, '#f2f2f2'); r(ctx, 0, -31 + bob, 2, 1, look.beanie); }
  if (look.headphones) {
    r(ctx, -3, -29 + bob, 7, 2, '#222');                     // band over the head
    r(ctx, -4, -26 + bob, 3, 4, '#222'); r(ctx, -3, -25 + bob, 1, 2, '#4a7fd0'); // ear cup
  }
  r(ctx, 2, -24 + bob, 1, 1, OUTLINE);                       // eye
  r(ctx, 2, -21 + bob, 2, 1, '#a0604a');                     // mouth
  if (look.glasses) { r(ctx, 1, -25 + bob, 4, 1, OUTLINE); r(ctx, 1, -24 + bob, 1, 2, OUTLINE); r(ctx, 3, -24 + bob, 1, 2, OUTLINE); }
  if (look.lanyard) { r(ctx, 1, -18 + bob, 1, 4, look.lanyard); r(ctx, 0, -14 + bob, 3, 3, '#fff'); }

  // Arm and whatever they are holding
  r(ctx, -2, -18 + bob, 3, 8, OUTLINE); r(ctx, -1, -17 + bob, 1, 6, look.jacket);
  r(ctx, -1, -11 + bob, 2, 2, look.skin);
  if (look.headphones) r(ctx, 1, -18 + bob, 1, 3, '#e8e8e8'); // hoodie string
  if (look.prop === 'mug') { r(ctx, 1, -14 + bob, 4, 4, '#fff'); r(ctx, 1, -14 + bob, 4, 1, '#6b3e1f'); r(ctx, 5, -13 + bob, 1, 2, '#fff'); }
  if (look.prop === 'laptop') { r(ctx, 0, -15 + bob, 8, 5, '#9aa0a8'); r(ctx, 1, -14 + bob, 6, 3, '#cfe3ff'); }
  if (look.prop === 'phone') { r(ctx, 1, -15 + bob, 3, 5, '#222'); r(ctx, 2, -14 + bob, 1, 3, '#7fc4ff'); }
  if (look.prop === 'binder') { r(ctx, 0, -16 + bob, 6, 8, '#1f4fa8'); r(ctx, 1, -15 + bob, 1, 6, '#e8e8e8'); r(ctx, 3, -13 + bob, 2, 2, '#fff'); }
  if (look.prop === 'figma') { // a tablet held up high, full of colourful Figma frames
    r(ctx, 0, -21 + bob, 10, 8, OUTLINE); r(ctx, 1, -20 + bob, 8, 6, '#f4f4f8');
    r(ctx, 2, -19 + bob, 3, 2, '#f24e1e'); r(ctx, 6, -19 + bob, 2, 2, '#a259ff');
    r(ctx, 2, -16 + bob, 2, 1, '#1abcfe'); r(ctx, 5, -16 + bob, 3, 1, '#0acf83');
  }
  if (look.prop === 'glass') { r(ctx, 1, -15 + bob, 3, 5, '#cfeaf7'); r(ctx, 1, -13 + bob, 3, 3, '#f6c623'); }
  ctx.restore();
}

const DISHES = [
  ['#7a4a2a', '#5e3820'], // köttbullar
  ['#f08a6b', '#ffc0a8'], // lax
  ['#f2d16b', '#e0b84a'], // potatis
  ['#5aa04a', '#9bd27a'], // sallad
  ['#d6c2a0', '#b8312f'], // sill med rödlök
];

// Items that can be picked up or that fall. (x, y) is the centre.
export function drawItem(ctx, sx, y, item, t) {
  const x = Math.round(sx);
  const yy = Math.round(y + (item.bob ? Math.sin(t * 4 + x) * 1.5 : 0));
  switch (item.kind) {
    case 'plate': {
      const [a, b] = DISHES[item.dish % DISHES.length];
      r(ctx, x - 6, yy, 12, 2, OUTLINE); r(ctx, x - 5, yy, 10, 1, '#fff');
      r(ctx, x - 3, yy - 2, 6, 2, a); r(ctx, x - 2, yy - 3, 2, 1, b); r(ctx, x + 1, yy - 3, 1, 1, b);
      break;
    }
    case 'postit': {
      const c = item.bad ? '#ff5d73' : '#ffe66b';
      r(ctx, x - 4, yy - 4, 8, 8, item.bad ? '#b8303f' : '#c9a93a');
      r(ctx, x - 3, yy - 3, 6, 6, c);
      r(ctx, x - 2, yy - 1, 4, 1, item.bad ? '#fff' : '#8a7a3a'); r(ctx, x - 2, yy + 1, 3, 1, item.bad ? '#fff' : '#8a7a3a');
      break;
    }
    case 'coffee': {
      r(ctx, x - 3, yy - 3, 6, 6, OUTLINE); r(ctx, x - 2, yy - 2, 4, 4, '#fff'); r(ctx, x - 2, yy - 2, 4, 1, '#6b3e1f');
      r(ctx, x + 3, yy - 1, 1, 2, OUTLINE);
      if (Math.sin(t * 6) > 0) r(ctx, x - 1, yy - 6, 1, 2, '#e8e8e8'); else r(ctx, x + 1, yy - 7, 1, 2, '#e8e8e8');
      break;
    }
    case 'bulle': {
      r(ctx, x - 4, yy - 3, 8, 5, '#6b3e1f'); r(ctx, x - 3, yy - 3, 6, 4, '#c98a4a');
      r(ctx, x - 1, yy - 2, 2, 2, '#8a5228'); r(ctx, x - 2, yy - 3, 1, 1, '#fff'); r(ctx, x + 2, yy - 2, 1, 1, '#fff');
      break;
    }
    case 'key': {
      r(ctx, x - 4, yy - 2, 4, 4, '#f6c623'); r(ctx, x - 3, yy - 1, 2, 2, '#1a1a2a');
      r(ctx, x, yy - 1, 5, 2, '#f6c623'); r(ctx, x + 3, yy + 1, 1, 2, '#f6c623');
      break;
    }
    case 'hdmi': {
      r(ctx, x - 4, yy - 3, 8, 5, OUTLINE); r(ctx, x - 3, yy - 2, 6, 3, '#555'); r(ctx, x - 2, yy - 1, 4, 1, '#f6c623');
      r(ctx, x + 4, yy - 1, 3, 1, OUTLINE);
      break;
    }
    case 'dongle': {
      r(ctx, x - 4, yy - 2, 8, 4, '#d8d8de'); r(ctx, x - 4, yy - 2, 8, 1, '#fff'); r(ctx, x + 4, yy - 1, 2, 2, '#999');
      r(ctx, x - 3, yy, 2, 1, '#333'); r(ctx, x, yy, 2, 1, '#333');
      break;
    }
    case 'charger': {
      r(ctx, x - 3, yy - 4, 6, 7, '#f2f2f2'); r(ctx, x - 3, yy - 4, 6, 1, '#ccc'); r(ctx, x - 1, yy - 6, 1, 2, '#999'); r(ctx, x + 1, yy - 6, 1, 2, '#999');
      r(ctx, x + 3, yy + 1, 4, 1, '#f2f2f2');
      break;
    }
    case 'popup': {
      r(ctx, x - 11, yy - 7, 22, 14, OUTLINE); r(ctx, x - 10, yy - 6, 20, 12, '#e9e9ef');
      r(ctx, x - 10, yy - 6, 20, 3, '#2e5fb8'); r(ctx, x + 7, yy - 6, 3, 3, '#e04b4b');
      r(ctx, x - 7, yy - 1, 3, 4, '#f6c623'); r(ctx, x - 6, yy, 1, 2, OUTLINE);
      r(ctx, x - 2, yy - 1, 9, 1, '#777'); r(ctx, x - 2, yy + 1, 7, 1, '#777');
      break;
    }
  }
}

// A young tree that grows from a twig (size 0) to a full tree (size 1). Used by the planting game.
export function drawGrowingTree(ctx, x, size, seed = 1) {
  const y = GROUND_Y;
  const h = Math.round(7 + size * 33);
  const trunkW = size < 0.3 ? 1 : size < 0.7 ? 2 : 3;
  r(ctx, x - Math.floor(trunkW / 2), y - h + 3, trunkW, h - 3, '#5a4030');
  const greens = ['#2f5d34', '#3d7442', '#4d8a50', '#6aa85a'];
  if (size < 0.15) { // just a twig with two leaves
    r(ctx, x - 2, y - h + 2, 2, 2, greens[3]); r(ctx, x + 1, y - h + 1, 2, 2, greens[2]);
    return;
  }
  const blobs = 3 + Math.round(size * 5);
  const rad = 2 + size * 6;
  for (let i = 0; i < blobs; i++) {
    const a = (i / blobs) * Math.PI * 2 + seed;
    const ox = Math.round(Math.cos(a) * size * 8);
    const oy = Math.round(Math.sin(a) * size * 6 + size * 4);
    ctx.fillStyle = greens[(i + seed) % 3];
    ctx.beginPath(); ctx.arc(x + ox, y - h + oy, rad, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = greens[3];
  ctx.beginPath(); ctx.arc(x - size * 2, y - h - size * 2, rad * 0.6, 0, Math.PI * 2); ctx.fill();
}

// Props stand on the ground and are not picked up.
export function drawProp(ctx, sx, prop, t) {
  const x = Math.round(sx);
  const y = GROUND_Y;
  if (prop.kind === 'table') {
    r(ctx, x - 14, y - 13, 28, 2, OUTLINE); r(ctx, x - 13, y - 13, 26, 1, '#fff');
    r(ctx, x - 13, y - 12, 26, 3, '#f2efe6'); // tablecloth
    r(ctx, x - 12, y - 9, 2, 9, '#6b4a30'); r(ctx, x + 10, y - 9, 2, 9, '#6b4a30');
  }
  if (prop.kind === 'desk') {
    // Standing desk with a monitor; drawn in front of the person behind it
    r(ctx, x - 16, y - 16, 32, 3, OUTLINE); r(ctx, x - 15, y - 16, 30, 2, '#c9a77a');
    r(ctx, x - 13, y - 13, 3, 13, '#555'); r(ctx, x + 10, y - 13, 3, 13, '#555');
    r(ctx, x + 2, y - 32, 18, 13, OUTLINE); r(ctx, x + 3, y - 31, 16, 11, '#141a2a');
    const lines = prop.lines ?? 0;
    for (let i = 0; i < 5; i++) {
      const w = 3 + Math.floor((Math.sin(i * 7 + Math.floor(lines / 2)) + 1) * 5);
      r(ctx, x + 4 + (i % 2) * 2, y - 30 + i * 2, Math.min(13, w), 1, ['#57d27a', '#7fc4ff', '#f6c623', '#ff7aa8'][(i + Math.floor(lines)) % 4]);
    }
    r(ctx, x + 10, y - 19, 2, 3, '#555'); r(ctx, x + 6, y - 17, 10, 1, '#555');
    r(ctx, x - 9, y - 18, 10, 2, '#333'); // keyboard
  }
  if (prop.kind === 'saplings') { // a crate of saplings
    for (let i = 0; i < 4; i++) drawGrowingTree(ctx, x - 6 + i * 4, 0.05, i);
    r(ctx, x - 10, y - 7, 20, 7, OUTLINE); r(ctx, x - 9, y - 6, 18, 5, '#a07850');
    r(ctx, x - 9, y - 4, 18, 1, '#7d5a3a');
  }
  if (prop.kind === 'plot') { // a planting spot: a stake with a ribbon, a hole, then a tree
    if (!prop.planted) {
      r(ctx, x - 5 - prop.dig, y - 1, 10 + prop.dig * 2, 2, '#6b4a30');
      if (prop.dig > 0) r(ctx, x - 3 - prop.dig, y - 1, 6 + prop.dig * 2, 1, '#3a2618');
      r(ctx, x + 7, y - 14, 1, 14, '#c9a46a');
      r(ctx, x + 8, y - 14 + Math.round(Math.sin(t * 4 + x) * 1), 4, 2, '#ff7a2e');
    } else {
      r(ctx, x - 5, y - 2, 10, 2, '#6b4a30'); r(ctx, x - 3, y - 3, 6, 1, '#6b4a30');
      drawGrowingTree(ctx, x, prop.size, prop.seed);
    }
  }
  if (prop.kind === 'projector') {
    // Screen on a stand
    r(ctx, x - 1, y - 30, 2, 30, '#555');
    r(ctx, x - 22, y - 50, 44, 26, OUTLINE);
    const blink = Math.sin(t * 5) > 0;
    r(ctx, x - 21, y - 49, 42, 24, prop.working ? '#ffffff' : '#1f3fa8');
    if (prop.working) {
      r(ctx, x - 16, y - 44, 18, 3, '#2e5fb8'); r(ctx, x - 16, y - 38, 30, 2, '#999'); r(ctx, x - 16, y - 34, 24, 2, '#999');
      r(ctx, x + 6, y - 46, 10, 8, '#f6c623');
    } else if (blink) {
      r(ctx, x - 12, y - 39, 24, 3, '#ffffff'); // "INGEN SIGNAL"
    }
    // Projector on a small table in front
    r(ctx, x - 26, y - 10, 12, 2, '#6b4a30'); r(ctx, x - 25, y - 8, 2, 8, '#6b4a30'); r(ctx, x - 17, y - 8, 2, 8, '#6b4a30');
    r(ctx, x - 25, y - 15, 10, 5, OUTLINE); r(ctx, x - 24, y - 14, 8, 3, '#d8d8de'); r(ctx, x - 16, y - 13, 2, 2, prop.working ? '#fff7b0' : '#555');
  }
}
