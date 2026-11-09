// The astronaut: movement, physics and an animated pixel-art drawing.
import { keys } from './input.js';
import { GROUND_Y } from './world.js';

const WALK_SPEED = 70;   // px/s
const ACCEL = 500;       // px/s²
const FRICTION = 600;    // px/s²
const GRAVITY = 220;     // low moon gravity, px/s²
const JUMP_SPEED = 120;  // px/s

const C = {
  outline: '#1b1b2a', suit: '#f1f1f5', shade: '#c4c4d2',
  visor: '#1f3a8a', glare: '#9fd0ff', pack: '#e07a2e', boot: '#55556a',
};

export function createPlayer(x) {
  return { x, y: GROUND_Y, vx: 0, vy: 0, facing: 1, onGround: true, walkTime: 0, time: 0, dust: [] };
}

export function updatePlayer(p, dt) {
  p.time += dt;
  const dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);

  if (dir !== 0) {
    p.vx += dir * ACCEL * dt;
    p.vx = Math.max(-WALK_SPEED, Math.min(WALK_SPEED, p.vx));
    p.facing = dir;
  } else {
    const slow = Math.min(Math.abs(p.vx), FRICTION * dt);
    p.vx -= Math.sign(p.vx) * slow;
  }

  if (keys.up && p.onGround) {
    p.vy = -JUMP_SPEED;
    p.onGround = false;
  }

  p.vy += GRAVITY * dt;
  p.x += p.vx * dt;
  p.y += p.vy * dt;

  if (p.y >= GROUND_Y) { // land on the solid ground
    if (!p.onGround) puff(p, 6);
    p.y = GROUND_Y; p.vy = 0; p.onGround = true;
  }

  const walking = p.onGround && Math.abs(p.vx) > 5;
  if (walking) {
    const before = Math.floor(p.walkTime * 2);
    p.walkTime += dt * (Math.abs(p.vx) / WALK_SPEED) * 1.6; // steps per second
    if (Math.floor(p.walkTime * 2) !== before) puff(p, 2);   // dust on each step
  } else {
    p.walkTime = 0;
  }

  for (const d of p.dust) { d.x += d.vx * dt; d.y += d.vy * dt; d.vy += 30 * dt; d.life -= dt; }
  p.dust = p.dust.filter((d) => d.life > 0);
}

function puff(p, n) {
  for (let i = 0; i < n; i++) {
    p.dust.push({ x: p.x + (Math.random() - 0.5) * 6, y: GROUND_Y - 1,
                  vx: (Math.random() - 0.5) * 30 - p.vx * 0.2, vy: -10 - Math.random() * 15, life: 0.4 + Math.random() * 0.3 });
  }
}

// Body parts are collected first, then drawn as one shared outline followed by the fills,
// so the astronaut gets a clean silhouette instead of an outline around every piece.
let parts = [];
function part(ctx, x, y, w, h, color) { parts.push([x, y, w, h, color]); }
function flush(ctx) {
  ctx.fillStyle = C.outline;
  for (const [x, y, w, h] of parts) ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  for (const [x, y, w, h, color] of parts) { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); }
  parts = [];
}

export function drawPlayer(ctx, p, camX) {
  ctx.fillStyle = '#9a9aa8';
  for (const d of p.dust) ctx.fillRect(Math.round(d.x - camX), Math.round(d.y), 1, 1);

  // Animation pose
  const walking = p.onGround && p.walkTime > 0;
  const phase = p.walkTime * Math.PI * 2;
  let legA = 0, legB = 0, liftA = 0, liftB = 0, arm = 0, bob = 0;
  if (!p.onGround) {
    legA = 2; legB = -2; liftA = 2; liftB = 1; arm = -3;          // jump pose
  } else if (walking) {
    const s = Math.sin(phase);
    legA = Math.round(s * 3); legB = -legA;
    liftA = s > 0.3 ? 1 : 0; liftB = s < -0.3 ? 1 : 0;
    arm = -Math.round(s * 2);
    bob = Math.abs(Math.cos(phase)) > 0.7 ? 0 : -1;
  } else {
    bob = Math.sin(p.time * 3) > 0.6 ? -1 : 0;                     // idle breathing
  }

  ctx.save();
  ctx.translate(Math.round(p.x - camX), Math.round(p.y));
  ctx.scale(p.facing, 1); // all drawing below faces right

  // Back leg and arm (darker, behind the body)
  part(ctx, -3 + legB, -7 - liftB, 3, 5, C.shade);
  part(ctx, -3 + legB, -2 - liftB, 4, 2, C.boot);
  part(ctx, -1 - arm, -14 + bob, 2, 5, C.shade);

  // Backpack and body
  part(ctx, -7, -17 + bob, 3, 8, C.pack);
  part(ctx, -4, -16 + bob, 8, 10, C.suit);

  // Front leg
  part(ctx, -1 + legA, -7 - liftA, 3, 5, C.suit);
  part(ctx, -1 + legA, -2 - liftA, 4, 2, C.boot);

  // Helmet with visor
  part(ctx, -5, -25 + bob, 10, 9, C.suit);

  flush(ctx);

  // Details on top
  ctx.fillStyle = C.pack; ctx.fillRect(-2, -12 + bob, 2, 2);      // chest panel
  ctx.fillStyle = C.shade; ctx.fillRect(-4, -7 + bob, 8, 1);       // belt
  ctx.fillRect(-5, -17 + bob, 10, 1);                              // helmet ring
  ctx.fillStyle = C.outline; ctx.fillRect(-1, -24 + bob, 7, 7);    // visor frame
  ctx.fillStyle = C.visor; ctx.fillRect(0, -23 + bob, 5, 5);
  ctx.fillStyle = C.glare; ctx.fillRect(3, -22 + bob, 1, 2); ctx.fillRect(2, -22 + bob, 1, 1);

  // Front arm, outlined on its own so it reads against the body while it swings
  part(ctx, arm - 1, -15 + bob, 3, 6, C.suit);
  part(ctx, arm - 1, -9 + bob, 3, 1, C.shade); // glove
  flush(ctx);

  ctx.restore();
}
