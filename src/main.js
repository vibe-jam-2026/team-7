// Game loop: fixed time step update, then draw.
import { WIDTH, HEIGHT, drawWorld } from './world.js';
import { createPlayer, updatePlayer, drawPlayer } from './player.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// Scale the 320×180 canvas up by a whole number so the pixels stay sharp.
function resize() {
  const s = Math.max(1, Math.floor(Math.min(innerWidth / WIDTH, innerHeight / HEIGHT)));
  canvas.style.width = WIDTH * s + 'px';
  canvas.style.height = HEIGHT * s + 'px';
}
addEventListener('resize', resize);
resize();

const player = createPlayer(WIDTH / 2);
let camX = 0;

const STEP = 1 / 120;
let last = performance.now();
let acc = 0;

function frame(now) {
  acc += Math.min(0.1, (now - last) / 1000);
  last = now;
  while (acc >= STEP) {
    updatePlayer(player, STEP);
    acc -= STEP;
  }

  // Camera follows the astronaut smoothly.
  camX += (player.x - WIDTH / 2 - camX) * 0.1;

  drawWorld(ctx, camX);
  drawPlayer(ctx, player, camX);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
