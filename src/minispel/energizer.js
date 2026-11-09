// 07:00 Morning energizer: do exactly what Henrik shouts, fast.
import { wasPressed } from '../input.js';
import { pick } from '../world.js';

const COMMANDS = [
  { key: 'up', label: '↑ HOPPA!' },
  { key: 'left', label: '← VÄNSTER!' },
  { key: 'right', label: '→ HÖGER!' },
  { key: 'down', label: '↓ NER I KNÄ!' },
];
const PRAISE = ['JA!', 'ENERGI!', 'Underbart!', 'Känn synergin!', 'Mer! MER!', 'Det där var KPI-värdigt!'];
const WRONG = ['Fel håll!', 'Andra vänster!', 'Nej nej nej!', 'Det där var en annan energizer!'];
const NEED = 8, MAX_MISSES = 4;

export default {
  id: 'energizer',
  title: 'Morgon-energizer',
  tagline: 'Gör exakt som Henrik säger',
  station: { x: 895, label: 'Gräsmattan' },
  start: 600,
  henrik: 650,
  tint: 'rgba(255,170,190,0.12)',
  intro: [
    ['H', 'Gör EXAKT som jag säger! Piltangenterna. Snabbt. Med ett leende.'],
    ['A', 'Hur ska någon se att jag ler? Jag har hjälm.'],
    ['H', 'Jag ser det på din aura. Redo? KÖR!'],
  ],
  goal: (g) => `Gör som Henrik säger: ${g.flags.ok}/${NEED} · Fel: ${g.flags.miss}/${MAX_MISSES}`,
  setup(g) { g.flags.ok = 0; g.flags.miss = 0; g.flags.cur = null; g.flags.gap = 0.8; },
  update(g, dt) {
    const f = g.flags;
    if (!f.cur) {
      f.gap -= dt;
      if (f.gap <= 0) {
        f.cur = pick(COMMANDS.filter((c) => c !== f.last));
        f.last = f.cur;
        f.window = Math.max(0.9, 1.9 - f.ok * 0.13);
        g.shout(f.cur.label);
        g.henrikSay(f.cur.label, 1);
      }
    } else {
      f.window -= dt;
      const pressed = ['up', 'down', 'left', 'right'].find((k) => wasPressed(k));
      if (pressed || f.window <= 0) {
        if (pressed === f.cur.key) { f.ok++; g.henrikSay(pick(PRAISE), 1); }
        else { f.miss++; g.henrikSay(pressed ? pick(WRONG) : 'För långsamt! Vakna!', 1.2); }
        f.cur = null; f.gap = 0.45;
        g.shout(null);
      }
    }
    if (f.ok >= NEED) return 'win';
    if (f.miss >= MAX_MISSES) return 'fail';
  },
  win: [
    ['H', 'FANTASTISKT! Jag ser verkligen energin. Eller paniken. Svårt att säga genom en hjälm.'],
    ['A', 'Mina ben har slutat svara på mejl.'],
  ],
  fail: [['H', 'Fyra fel! Inga problem. Energizers är som strategier: man kör tills det känns rätt.']],
};
