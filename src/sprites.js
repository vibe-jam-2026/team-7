// Pixel-art drawings for people, items and props. All coordinates are logical pixels.
import { GROUND_Y } from './world.js';

const OUTLINE = '#1e1b22';

// How Henrik looks. Change these to make him look more like the real Henrik.
export const HENRIK = {
  jacket: '#2b3550', pants: '#2a2a33', shirt: '#e8eef7', hair: '#6b4a2b',
  skin: '#e8b894', shoes: '#3a2a20', glasses: true, lanyard: '#c0392b', prop: 'mug',
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
  r(ctx, -3, -27 + bob, 7, 3, look.hair);                    // hair
  r(ctx, -3, -25 + bob, 2, 3, look.hair);
  r(ctx, 2, -24 + bob, 1, 1, OUTLINE);                       // eye
  r(ctx, 2, -21 + bob, 2, 1, '#a0604a');                     // mouth
  if (look.glasses) { r(ctx, 1, -25 + bob, 4, 1, OUTLINE); r(ctx, 1, -24 + bob, 1, 2, OUTLINE); r(ctx, 3, -24 + bob, 1, 2, OUTLINE); }
  if (look.lanyard) { r(ctx, 1, -18 + bob, 1, 4, look.lanyard); r(ctx, 0, -14 + bob, 3, 3, '#fff'); }

  // Arm and whatever they are holding
  r(ctx, -2, -18 + bob, 3, 8, OUTLINE); r(ctx, -1, -17 + bob, 1, 6, look.jacket);
  r(ctx, -1, -11 + bob, 2, 2, look.skin);
  if (look.prop === 'mug') { r(ctx, 1, -14 + bob, 4, 4, '#fff'); r(ctx, 1, -14 + bob, 4, 1, '#6b3e1f'); r(ctx, 5, -13 + bob, 1, 2, '#fff'); }
  if (look.prop === 'laptop') { r(ctx, 0, -15 + bob, 8, 5, '#9aa0a8'); r(ctx, 1, -14 + bob, 6, 3, '#cfe3ff'); }
  if (look.prop === 'phone') { r(ctx, 1, -15 + bob, 3, 5, '#222'); r(ctx, 2, -14 + bob, 1, 3, '#7fc4ff'); }
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

// Props stand on the ground and are not picked up.
export function drawProp(ctx, sx, prop, t) {
  const x = Math.round(sx);
  const y = GROUND_Y;
  if (prop.kind === 'table') {
    r(ctx, x - 14, y - 13, 28, 2, OUTLINE); r(ctx, x - 13, y - 13, 26, 1, '#fff');
    r(ctx, x - 13, y - 12, 26, 3, '#f2efe6'); // tablecloth
    r(ctx, x - 12, y - 9, 2, 9, '#6b4a30'); r(ctx, x + 10, y - 9, 2, 9, '#6b4a30');
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
