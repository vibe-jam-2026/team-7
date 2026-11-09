// Sets up the canvas and runs the game loop. The game itself is in src/game.js.
import { WIDTH, HEIGHT } from './world.js';
import { clearPressed } from './input.js';
import { frame, startStory } from './game.js';
import { setScale } from './ui.js';
import { devMenuOpen } from './devmeny.js';
import { toggleMute, audioStatus, soundButton } from './ljud.js';
import './knappen.js';

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

// ?kapitel=3 in the address jumps straight to that story beat (0 = the office, 1 = the bus, 2 = arriving at Haga). Handy when testing.
const chapter = new URLSearchParams(location.search).get('kapitel');
if (chapter != null) startStory(parseInt(chapter, 10) || 0);

// M turns the sound on and off
// The sound button under the game shows whether sound is on, off or blocked by the browser
const ljudBtn = document.getElementById('ljudbtn');
const LJUD_TEXT = {
  waiting: '🔈 Ljud: tryck en tangent',
  on: '🔊 Ljud på (M)',
  off: '🔇 Ljud av (M)',
  blocked: '⚠ Ljudet blockeras av webbläsaren – klicka här',
};
const showMute = () => {
  const st = audioStatus();
  ljudBtn.textContent = LJUD_TEXT[st];
  ljudBtn.classList.toggle('blocked', st === 'blocked');
};
ljudBtn.addEventListener('mousedown', (e) => e.preventDefault()); // don't steal keyboard focus
ljudBtn.addEventListener('click', () => { soundButton(); setTimeout(showMute, 100); });
addEventListener('keydown', (e) => { if (e.key === 'm' || e.key === 'M') toggleMute(); });
setInterval(showMute, 400);
showMute();

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!devMenuOpen()) frame(ctx, dt); // the game pauses while the dev menu is open
  clearPressed();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
