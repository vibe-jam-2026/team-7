// Game loop: fixed time step update, then draw. Also handles switching levels.
import { WIDTH, HEIGHT } from './world.js';
import { LEVELS } from './levels/index.js';
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

let levelIndex = 0;
let level, player, camX, bannerTime;

function startLevel(i) {
  levelIndex = (i + LEVELS.length) % LEVELS.length;
  level = LEVELS[levelIndex];
  player = createPlayer(level.startX);
  camX = clampCam(player.x - WIDTH / 2);
  bannerTime = 2.5;
}

function clampCam(x) {
  return Math.max(0, Math.min(level.width - WIDTH, x));
}

// Number keys jump straight to a level: 1 = first level, 2 = second, ...
addEventListener('keydown', (e) => {
  const n = parseInt(e.key, 10);
  if (n >= 1 && n <= LEVELS.length) startLevel(n - 1);
});

// Optional ?level=2 in the address starts on that level.
startLevel((parseInt(new URLSearchParams(location.search).get('level'), 10) || 1) - 1);

function drawBanner() {
  if (bannerTime <= 0) return;
  ctx.globalAlpha = Math.min(1, bannerTime);
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillText(level.name, WIDTH / 2 + 1, 25);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(level.name, WIDTH / 2, 24);
  ctx.globalAlpha = 1;
}

const STEP = 1 / 120;
let last = performance.now();
let acc = 0;
let time = 0;

function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  acc += dt;
  time += dt;
  bannerTime -= dt;
  while (acc >= STEP) {
    updatePlayer(player, STEP, level);
    acc -= STEP;
  }

  // Reaching the level's exit (e.g. the rocket on the Moon) starts the next level.
  if (level.exitX != null && player.x >= level.exitX) startLevel(levelIndex + 1);

  // Camera follows the astronaut smoothly and stops at the level's edges.
  camX += (clampCam(player.x - WIDTH / 2) - camX) * 0.1;

  level.draw(ctx, camX, time);
  drawPlayer(ctx, player, camX, level.dustColor);
  drawBanner();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
