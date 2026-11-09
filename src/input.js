// Keyboard state. Other modules read `keys.left` etc. instead of listening themselves.
// `wasPressed(k)` is true only in the frame a key went down (for dialogue and commands).
const MAP = {
  ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
  ' ': 'action', Enter: 'action',
};

export const keys = { left: false, right: false, up: false, down: false, action: false };
const pressed = new Set();

function set(e, down) {
  const k = MAP[e.key];
  if (!k) return;
  if (down && !keys[k]) pressed.add(k);
  keys[k] = down;
  e.preventDefault(); // stop arrow keys and space from scrolling the page
}

addEventListener('keydown', (e) => set(e, true));
addEventListener('keyup', (e) => set(e, false));
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

export function wasPressed(k) { return pressed.has(k); }
export function clearPressed() { pressed.clear(); }
