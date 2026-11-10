// Ett litet 3×5-pixeltypsnitt för text som ritas direkt på canvasen (slogans, skyltar).
// Används av FinalFinalBoss och AI-Göran. Å Ä Ö ritas som A/O med märken ovanför.
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

const GLYPH = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111',
  F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010',
  K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010',
  P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
  U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010',
  Z: '111001010100111', 0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110',
  4: '101101111001001', 5: '111100110001110', 6: '011100111101111', 7: '111001010010010', 8: '111101111101111',
  9: '111101111001110', ' ': '000000000000000', '!': '010010010000010', '?': '110001010000010', '.': '000000000000010',
  ',': '000000000010100', '-': '000000111000000', ':': '000010000010000', "'": '010010000000000', '/': '001001010100100',
  '%': '101001010100101', '+': '000010111010000',
};
const ACCENT = { Å: ['A', [[1, -2]]], Ä: ['A', [[0, -2], [2, -2]]], Ö: ['O', [[0, -2], [2, -2]]] };
const textCache = new Map();
export function textSprite(str, o) {
  str = str.toUpperCase();
  const key = `${str}|${o.color}|${o.plate}|${o.border}|${o.pad}|${o.scale}`;
  let c = textCache.get(key);
  if (c) return c;
  const s = o.scale || 1, pad = o.pad || 0, top = /[ÅÄÖ]/.test(str) ? 2 * s : 0;
  c = mk(str.length * 4 * s - s + pad * 2, 5 * s + top + pad * 2);
  const x = c.getContext('2d');
  if (o.plate) {
    x.fillStyle = o.border || o.plate;
    x.fillRect(1, 0, c.width - 2, c.height); x.fillRect(0, 1, c.width, c.height - 2);
    if (o.border) { x.fillStyle = o.plate; x.fillRect(1, 1, c.width - 2, c.height - 2); }
  }
  x.fillStyle = o.color;
  for (let i = 0; i < str.length; i++) {
    const acc = ACCENT[str[i]];
    const g = GLYPH[acc ? acc[0] : str[i]] || GLYPH['?'];
    const gx = pad + i * 4 * s, gy = pad + top;
    for (let p = 0; p < 15; p++) if (g[p] === '1') x.fillRect(gx + (p % 3) * s, gy + ((p / 3) | 0) * s, s, s);
    if (acc) for (const [mx, my] of acc[1]) x.fillRect(gx + mx * s, gy + my * s, s, s);
  }
  textCache.set(key, c);
  return c;
}
export function drawText(ctx, str, x, y, o, align = 'left') {
  const spr = textSprite(str, o);
  const dx = align === 'center' ? x - spr.width / 2 : align === 'right' ? x - spr.width : x;
  ctx.drawImage(spr, Math.round(dx), Math.round(y));
}
