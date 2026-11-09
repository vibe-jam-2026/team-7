// The office: an open-plan room where the 13.2 delivery is on fire. One screen wide.
import { WIDTH, HEIGHT, GROUND_Y } from '../world.js';

function r(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }

function text(ctx, s, x, y, size, color, align = 'left') {
  ctx.font = `bold ${size}px monospace`;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  ctx.fillStyle = color;
  ctx.fillText(s, x, y);
}

export const kontoret = {
  name: 'Kontoret',
  width: WIDTH,
  gravity: 520,
  jumpSpeed: 200,
  dustColor: '#8a8f9c',
  draw(ctx, camX, t) {
    // Wall and ceiling
    r(ctx, 0, 0, WIDTH, GROUND_Y, '#dfe3ea');
    r(ctx, 0, 0, WIDTH, 10, '#c8ccd4');
    for (let x = 30; x < WIDTH; x += 90) { r(ctx, x, 10, 40, 2, '#fffbe0'); r(ctx, x + 2, 12, 36, 1, '#f0ecd0'); }
    r(ctx, 0, GROUND_Y - 6, WIDTH, 6, '#b9bec8'); // skirting

    // Window with the city outside
    r(ctx, 8, 30, 70, 60, '#8a909c'); r(ctx, 10, 32, 66, 56, '#9cc4e8');
    for (let i = 0; i < 7; i++) {
      const h = 14 + ((i * 37) % 26);
      r(ctx, 10 + i * 10, 88 - h, 9, h, '#6f8299');
      for (let y = 88 - h + 3; y < 86; y += 5) r(ctx, 12 + i * 10, y, 2, 2, '#c8d6e6');
    }
    r(ctx, 42, 32, 2, 56, '#8a909c'); r(ctx, 10, 59, 66, 2, '#8a909c');
    // Plant
    r(ctx, 82, GROUND_Y - 14, 10, 10, '#b5653a');
    for (let i = 0; i < 6; i++) r(ctx, 83 + i * 1.5, GROUND_Y - 26 + (i % 3) * 3, 2, 12, i % 2 ? '#3d7442' : '#4d8a50');

    // Whiteboard: the 13.2 delivery
    r(ctx, 100, 26, 92, 56, '#8a909c'); r(ctx, 102, 28, 88, 52, '#ffffff');
    text(ctx, 'LEVERANS', 146, 31, 8, '#2e5fb8', 'center');
    text(ctx, '13.2', 146, 40, 18, '#d63a3a', 'center');
    text(ctx, 'DEADLINE:', 106, 62, 7, '#333');
    text(ctx, 'fre', 150, 62, 7, '#999'); r(ctx, 149, 65, 15, 1, '#d63a3a');
    text(ctx, 'IGÅR', 166, 62, 7, '#d63a3a');
    text(ctx, '!!!', 106, 71, 7, '#d63a3a');

    // Kanban board: everything is in "In progress"
    r(ctx, 214, 24, 90, 64, '#8a909c'); r(ctx, 216, 26, 86, 60, '#f4f1e8');
    ['TODO', 'PÅGÅR', 'KLART'].forEach((h, i) => text(ctx, h, 230 + i * 28, 28, 6, '#555', 'center'));
    r(ctx, 244, 34, 1, 50, '#ccc'); r(ctx, 272, 34, 1, 50, '#ccc');
    const colors = ['#ffe66b', '#ff9fb2', '#9fd8ff', '#b5f0a0'];
    for (let i = 0; i < 12; i++) {
      const wob = Math.round(Math.sin(t * 3 + i) * 0.6);
      r(ctx, 248 + (i % 3) * 7 + wob, 36 + Math.floor(i / 3) * 11, 6, 6, colors[i % 4]);
    }
    r(ctx, 222, 36, 6, 6, '#ffe66b');

    // Wall clock
    r(ctx, 197, 92, 14, 14, '#555'); r(ctx, 198, 93, 12, 12, '#fff');
    r(ctx, 203, 95, 1, 5, '#222');
    const a = t * 2;
    r(ctx, 203 + Math.round(Math.cos(a) * 4), 99 + Math.round(Math.sin(a) * 4), 1, 1, '#d63a3a');

    // Floor
    r(ctx, 0, GROUND_Y, WIDTH, HEIGHT - GROUND_Y, '#5a6170');
    r(ctx, 0, GROUND_Y, WIDTH, 2, '#6d7484');
    for (let x = 0; x < WIDTH; x += 8) for (let y = GROUND_Y + 5; y < HEIGHT; y += 8) r(ctx, x + ((y / 8) % 2) * 4, y, 1, 1, '#4e5463');
  },
};
