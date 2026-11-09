// Keyboard state. Other modules read `keys.left` etc. instead of listening themselves.
const MAP = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };

export const keys = { left: false, right: false, up: false, down: false };

function set(e, down) {
  const k = MAP[e.key];
  if (!k) return;
  keys[k] = down;
  e.preventDefault(); // stop arrow keys from scrolling the page
}

addEventListener('keydown', (e) => set(e, true));
addEventListener('keyup', (e) => set(e, false));
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
