// The red "TRYCK INTE" button. Pressing it loses the game: a silly message, then the game starts over.
import { pressedForbidden } from './game.js';

const btn = document.getElementById('forbidden');
// Never take keyboard focus, otherwise space (the action key) would press it by mistake
btn.addEventListener('mousedown', (e) => e.preventDefault());
btn.addEventListener('click', () => { btn.blur(); pressedForbidden(); });
