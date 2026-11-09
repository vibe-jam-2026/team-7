// 11:58 BOSS: Koppartälten. Henrik hides the last cinnamon bun under one of three tents,
// shuffles them, and you pick one. Three rounds, faster each time. Three misses and you start over.
// ← → choose a tent · mellanslag (or ↑ / ↓) lifts it.
import { wasPressed } from '../input.js';
import { GROUND_Y, pick } from '../world.js';
import { drawItem } from '../sprites.js';

const SLOTS = [742, 774, 806];        // where the three tents stand
const ROUNDS = [                       // how many swaps, and seconds per swap
  { swaps: 5, dur: 0.5 },
  { swaps: 8, dur: 0.33 },
  { swaps: 12, dur: 0.22 },
];
const MAX_MISSES = 3;

const SHUFFLE_BARKS = [
  'Håll koll på bullen!', 'Snabbare! Agilt!', 'Det här är en förändringsresa!', 'Hokus pokus, fokus!',
  'Ingen fuskar. Utom jag.', 'Det här kallas omorganisation!', 'Jag har övat sedan 2019!',
];
const RIGHT = ['BULLEN!', 'Där var den!', 'Ha! Örnöga!'];
const WRONG = ['En post-it?!', 'Bara en agendapunkt...', 'Tomt. Som min kalender aldrig är.'];

function startRound(g) {
  const f = g.flags;
  const r = ROUNDS[f.round];
  f.bulle = Math.floor(Math.random() * 3);   // which tent (not slot) hides the bun
  for (const t of f.tents) t.target = 0;
  f.tents[f.bulle].target = 1;               // show where the bun is
  f.phase = 'show'; f.pt = 1.5;
  f.swapsLeft = r.swaps; f.dur = r.dur; f.swap = null;
  f.cursor = 1; f.chosen = null;
  g.henrikSay(f.round === ROUNDS.length - 1 ? 'SLUTRUNDA! Nu kör jag på riktigt!' : 'Bullen ligger HÄR. Titta noga!', 1.5);
}

const tentAt = (f, slot) => f.tents.find((t) => t.slot === slot);
const ease = (e) => e * e * (3 - 2 * e);

export default {
  id: 'talt',
  title: 'BOSS: Koppartälten',
  tagline: 'Henrik har gömt den sista kanelbullen under ett tält. Håll koll!',
  station: { x: 790, label: 'Koppartälten' },
  start: 700,
  henrik: 845,
  lockPlayer: true,
  meter: 'Henrik',
  intro: [
    ['H', 'Innan lunch: agendapunkt 47. Den är guld. Det betyder BOSS.'],
    ['D', 'Varför finns det en boss på en konferens?'],
    ['H', 'Minns du den sista kanelbullen på fikan? Jag tog den. Den ligger under ett av Koppartälten.'],
    ['H', 'Jag lyfter tältet, sen skyfflar jag runt dem. Du väljer ett med ← → och lyfter det med mellanslag.'],
    ['H', 'Tre rätt så är bullen din. Tre fel så börjar vi om. Och jag blir snabbare för varje runda.'],
    ['D', 'Det här är det mest fokuserade jag har varit på hela konferensen.'],
  ],
  goal(g) {
    const f = g.flags;
    const head = `Runda ${Math.min(f.round + 1, ROUNDS.length)}/${ROUNDS.length} · Missar: ${f.miss}/${MAX_MISSES}`;
    const tip = { show: 'Titta var bullen ligger!', drop: 'Titta var bullen ligger!', shuffle: 'Håll koll på tältet...',
      choose: '← → välj tält · mellanslag: lyft', reveal: '' }[f.phase] ?? '';
    return tip ? `${head} · ${tip}` : head;
  },
  setup(g) {
    const f = g.flags;
    f.round = 0; f.miss = 0;
    f.tents = SLOTS.map((x, i) => ({ slot: i, x, hop: 0, lift: 0, target: 0, junk: pick(['postit', 'coffee']) }));
    f.bark = 1;
    g.meter = 100;
    startRound(g);
  },
  update(g, dt) {
    const f = g.flags;
    if (f.phase === 'show') {
      f.pt -= dt;
      if (f.pt <= 0) { for (const t of f.tents) t.target = 0; f.phase = 'drop'; f.pt = 0.5; }
    } else if (f.phase === 'drop') {
      f.pt -= dt;
      if (f.pt <= 0) f.phase = 'shuffle';
    } else if (f.phase === 'shuffle') {
      if (!f.swap) {
        const a = Math.floor(Math.random() * 3);
        const b = (a + 1 + Math.floor(Math.random() * 2)) % 3;
        f.swap = { a: tentAt(f, a), b: tentAt(f, b), from: a, to: b, e: 0 };
      }
      const s = f.swap;
      s.e = Math.min(1, s.e + dt / f.dur);
      const k = ease(s.e);
      s.a.x = SLOTS[s.from] + (SLOTS[s.to] - SLOTS[s.from]) * k;
      s.b.x = SLOTS[s.to] + (SLOTS[s.from] - SLOTS[s.to]) * k;
      s.a.hop = Math.sin(Math.PI * s.e) * 10;
      s.b.hop = Math.sin(Math.PI * s.e) * 3;
      if (s.e >= 1) {
        s.a.slot = s.to; s.b.slot = s.from;
        s.a.x = SLOTS[s.to]; s.b.x = SLOTS[s.from];
        s.a.hop = s.b.hop = 0;
        f.swap = null;
        if (--f.swapsLeft <= 0) { f.phase = 'choose'; g.henrikSay('Nå? Vilket tält?', 2); }
      }
      f.bark -= dt;
      if (f.bark <= 0) { f.bark = 1.6; g.henrikSay(pick(SHUFFLE_BARKS), 1.4); }
    } else if (f.phase === 'choose') {
      if (wasPressed('left')) f.cursor = Math.max(0, f.cursor - 1);
      if (wasPressed('right')) f.cursor = Math.min(2, f.cursor + 1);
      if (wasPressed('action') || wasPressed('up') || wasPressed('down')) {
        f.chosen = tentAt(f, f.cursor);
        f.chosen.target = 1;
        f.right = f.chosen === f.tents[f.bulle];
        f.phase = 'reveal'; f.pt = 1.6;
        g.say(pick(f.right ? RIGHT : WRONG), g.p, 'me', 1.5);
        if (f.right) { g.meter = Math.max(0, g.meter - 34); g.henrikSay(pick(['NEEEJ!', 'Tur!', 'Hur?!']), 1.4); }
        else g.henrikSay(pick(['Haha! Bullen är MIN!', 'Fel tält! Klassiskt.', 'Den låg här hela tiden!']), 1.6);
      }
    } else if (f.phase === 'reveal') {
      f.pt -= dt;
      if (!f.right && f.pt < 1.0) f.tents[f.bulle].target = 1; // show where it really was
      if (f.pt <= 0) {
        if (f.right) {
          f.round++;
          if (f.round >= ROUNDS.length) return 'win';
        } else if (++f.miss >= MAX_MISSES) return 'fail';
        startRound(g);
      }
    }
  },
  onWin(g) { g.shout('BULLEN ÄR DIN!'); for (const t of g.flags.tents) t.target = 1; },
  draw(g, ctx) {
    const f = g.flags;
    if (!f.tents) return;
    // Lifting is animated here so it also runs during the win dialogue
    const dt = Math.min(0.1, g.time - (f.last || g.time));
    f.last = g.time;
    for (const t of f.tents) t.lift += Math.max(-dt * 4, Math.min(dt * 4, t.target - t.lift));
    // What lies under each tent: the bun under one, junk under the others
    f.tents.forEach((t, i) => {
      if (t.lift < 0.05) return;
      const x = Math.round(t.x - g.camX);
      if (i === f.bulle) drawItem(ctx, x, GROUND_Y - 2, { kind: 'bulle' }, g.time);
      else drawItem(ctx, x, GROUND_Y - 4, { kind: t.junk }, g.time);
    });
    // Tents: the one hopping highest is drawn last, so it passes in front
    for (const t of [...f.tents].sort((a, b) => a.hop - b.hop)) {
      const sel = f.phase === 'choose' && t.slot === f.cursor;
      drawTent(ctx, Math.round(t.x - g.camX), Math.round(GROUND_Y - t.hop - t.lift * 26), sel, g.time, t.lift > 0.05);
    }
    // Bouncing arrow over the chosen slot
    if (f.phase === 'choose') {
      const x = Math.round(SLOTS[f.cursor] - g.camX);
      const y = GROUND_Y - 46 + Math.round(Math.sin(g.time * 8) * 2);
      ctx.fillStyle = '#ffb838';
      ctx.fillRect(x - 1, y - 5, 3, 5); ctx.fillRect(x - 4, y, 9, 2); ctx.fillRect(x - 2, y + 2, 5, 2); ctx.fillRect(x, y + 4, 1, 1);
    }
  },
  win: [
    ['D', 'Tre av tre. Ge mig bullen.'],
    ['H', 'Imponerande! Du har tydligen bättre koll på tält än på agendan.'],
    ['H', '(tuggar) Mm. Den var faktiskt jättegod.'],
    ['D', '...du åt upp den.'],
    ['H', 'Jag tänkte att den passar bättre i min KPI. Nu: LUNCH!'],
  ],
  fail: [['H', 'Tre fel! Bullen stannar hos mig. Vi skyfflar om från början!']],
};

// A small copper tent in the style of Koppartälten at Haga: blue and gold striped walls,
// a green copper roof and a pennant. (x, y) = bottom centre; y rises when the tent is lifted.
function drawTent(ctx, x, y, selected, t, lifted) {
  const r = (xx, yy, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(xx, yy, w, h); };
  if (lifted) { r(x - 12, GROUND_Y, 24, 1, 'rgba(0,0,0,0.25)'); }
  const out = selected ? '#ffffff' : '#1e1b22';
  // Walls with vertical stripes
  r(x - 13, y - 15, 26, 15, out);
  for (let i = 0; i < 24; i++) r(x - 12 + i, y - 14, 1, 14, Math.floor(i / 3) % 2 ? '#f6c623' : '#2f5fa8');
  r(x - 3, y - 10, 6, 10, '#1e1b22'); // the opening
  r(x - 2, y - 9, 4, 9, '#3a2a40');
  // Copper roof: a triangle with a scalloped gold edge
  for (let i = 0; i < 14; i++) {
    const w = 4 + i * 2;
    r(x - w / 2 - 1, y - 29 + i, w + 2, 1, out);
    r(x - w / 2, y - 29 + i, w, 1, i < 3 ? '#7fc4a8' : '#4f9f8a');
  }
  for (let i = 0; i < 7; i++) r(x - 13 + i * 4, y - 15, 2, 2, '#f6c623');
  // Pole and pennant
  r(x, y - 35, 1, 6, '#d8d8de');
  const wave = Math.round(Math.sin(t * 6 + x) * 1);
  r(x + 1, y - 35 + wave, 4, 2, '#d63a3a'); r(x + 5, y - 34 + wave, 1, 1, '#d63a3a');
}
