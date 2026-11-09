// You, the player: movement, physics and drawing.
import { keys } from './input.js';
import { GROUND_Y } from './world.js';
import { drawPerson, PLAYER } from './sprites.js';

const WALK_SPEED = 95;   // px/s
const ACCEL = 500;       // px/s²
const FRICTION = 600;    // px/s²

export function createPlayer(x) {
  return { x, y: GROUND_Y, vx: 0, vy: 0, facing: 1, onGround: true, walkTime: 0, time: 0, stun: 0, dust: [] };
}

// `level` gives gravity, jump speed and the level width (see src/levels/).
// `frozen` ignores the keyboard (during dialogue); `p.stun` does the same for a while.
export function updatePlayer(p, dt, level, frozen = false) {
  p.time += dt;
  p.stun = Math.max(0, p.stun - dt);
  const control = !frozen && p.stun <= 0;
  const dir = control ? (keys.right ? 1 : 0) - (keys.left ? 1 : 0) : 0;

  if (dir !== 0) {
    p.vx += dir * ACCEL * dt;
    p.vx = Math.max(-WALK_SPEED, Math.min(WALK_SPEED, p.vx));
    p.facing = dir;
  } else {
    const slow = Math.min(Math.abs(p.vx), FRICTION * dt);
    p.vx -= Math.sign(p.vx) * slow;
  }

  if (control && keys.up && p.onGround) {
    p.vy = -level.jumpSpeed;
    p.onGround = false;
  }

  p.vy += level.gravity * dt;
  p.x += p.vx * dt;
  p.y += p.vy * dt;

  // Stay inside the level
  if (p.x < 6) { p.x = 6; p.vx = Math.max(0, p.vx); }
  if (p.x > level.width - 6) { p.x = level.width - 6; p.vx = Math.min(0, p.vx); }

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

export function drawPlayer(ctx, p, camX, dustColor = '#9a9aa8') {
  ctx.fillStyle = dustColor;
  for (const d of p.dust) ctx.fillRect(Math.round(d.x - camX), Math.round(d.y), 1, 1);

  if (p.hidden) return;
  if (p.stun > 0 && Math.floor(p.time * 16) % 2) return; // blink while stuck in a meeting
  const walking = p.onGround && p.walkTime > 0;
  drawPerson(ctx, p.x - camX, p.y, PLAYER, p.facing, p.walkTime * 0.9, walking);
}
