// Sets up the canvas and runs the game loop. The game itself is in src/game.js.
import { WIDTH, HEIGHT } from './world.js';
import { clearPressed } from './input.js';
import { frame, startStory } from './game.js';
import { setScale } from './ui.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// Scale the 320×180 canvas up by a whole number so the pixels stay sharp.
function resize() {
  const s = Math.max(1, Math.floor(Math.min(innerWidth / WIDTH, (innerHeight - 30) / HEIGHT)));
  canvas.style.width = WIDTH * s + 'px';
  canvas.style.height = HEIGHT * s + 'px';
  setScale(s);
}
addEventListener('resize', resize);
resize();

// ?kapitel=3 in the address jumps straight to that story beat (0 = the Moon). Handy when testing.
const chapter = new URLSearchParams(location.search).get('kapitel');
if (chapter != null) startStory(parseInt(chapter, 10) || 0);

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  frame(ctx, dt);
  clearPressed();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
