// Keyboard state. Other modules read `keys.left` etc. instead of listening themselves.
// `wasPressed(k)` is true only in the frame a key went down (for dialogue and commands).
const MAP = {
  ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
  ' ': 'action', Enter: 'action',
};

export const keys = { left: false, right: false, up: false, down: false, action: false };
const pressed = new Set();
let typed = 0; // letters and digits pressed this frame (for mashing the keyboard in the intro)
const isTypingKey = (e) => e.key.length === 1 && /[\p{L}\p{N}]/u.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey;

function set(e, down) {
  if (down && !e.repeat && isTypingKey(e)) typed++;
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
// How many letter/digit keys went down this frame
export function typedCount() { return typed; }
export function clearPressed() { pressed.clear(); typed = 0; }
