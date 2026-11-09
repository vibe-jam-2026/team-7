// 11:58 BOSS: Koppartälten. "Vi måste lyfta på tältet och hitta samarbetet!"
// Henrik hides the team's collaboration (samarbetet) under one of three tents,
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

// All of Henrik's lines here are jokes about "lyfta på tältet".
const SHUFFLE_BARKS = [
  'Vem lyfter tältet? DU lyfter tältet!', 'Ett tält lyfter sig inte självt!', 'Tältet är en metafor! Och ett tält!',
  'Lyft blicken! Sen tältet!', 'Vi lyfter tältet tillsammans. Men du först.', 'Det här tältet har lyft-potential!',
  'Under ett av tälten: samarbetet. Under de andra: tält.', 'Det finns inga dumma tält. Bara olyfta.',
];
const RIGHT = ['Jag lyfte på tältet! SAMARBETE!', 'Där låg det! Under tältet!', 'Lyft på tält, hitta samarbete!'];
const HENRIK_RIGHT = ['Du lyfte på tältet!', 'Det där var ett riktigt tältlyft!', 'NEEEJ! Rätt tält!'];
const HENRIK_WRONG = [
  'Fel tält! Lyft ett annat!', 'Man måste lyfta på RÄTT tält!', 'Det tältet var bara... ett tält.',
  'Där låg inget samarbete. Bara mer tält.', 'Lyftet var bra. Tältet var fel.',
];
// What you find when you lift the wrong tent. One is picked at random.
const JUNK = [
  { item: 'postit', say: 'En post-it: "Lyft nästa tält."' },
  { item: 'postit', say: 'Under tältet: ett mindre tält.' },
  { item: 'postit', say: 'En lapp: "Här låg samarbetet. Det har flyttat till ett annat tält."' },
  { item: 'postit', say: 'En instruktion: "Så lyfter du ett tält. Steg 1: lyft tältet."' },
  { item: 'postit', say: 'En post-it: "Tältlyft pågår. Återkom."' },
  { item: 'postit', say: 'Ingenting. Bara tältluft.' },
];

function startRound(g) {
  const f = g.flags;
  const r = ROUNDS[f.round];
  f.prize = Math.floor(Math.random() * 3);   // which tent (not slot) hides samarbetet
  for (const t of f.tents) { t.target = 0; t.junk = pick(JUNK); }
  f.tents[f.prize].target = 1;               // show where it is
  f.phase = 'show'; f.pt = 1.5;
  f.swapsLeft = r.swaps; f.dur = r.dur; f.swap = null;
  f.cursor = 1; f.chosen = null;
  g.henrikSay(f.round === ROUNDS.length - 1 ? 'SLUTRUNDA! Nu lyfter vi tältet på riktigt!' : 'Jag lyfter på tältet... Samarbetet ligger HÄR!', 1.5);
}

const tentAt = (f, slot) => f.tents.find((t) => t.slot === slot);
const ease = (e) => e * e * (3 - 2 * e);

export default {
  id: 'talt',
  title: 'BOSS: Koppartälten',
  tagline: 'Lyft på rätt tält och hitta samarbetet!',
  station: { x: 790, label: 'Koppartälten' },
  start: 700,
  henrik: 845,
  lockPlayer: true,
  meter: 'Henrik',
  intro: [
    ['H', 'Agendapunkt 47: "Vi behöver lyfta på tältet." Det stod i medarbetarundersökningen.'],
    ['D', 'Jag tror det stod "lyfta på taket".'],
    ['H', 'Tält! Och jag har tagit det bokstavligt. Under ett av Koppartälten ligger samarbetet.'],
    ['H', 'Jag lyfter på tältet, sen skyfflar jag runt dem. Välj tält med ← → och lyft med mellanslag.'],
    ['H', 'Tre rätta tältlyft så har vi samarbete. Tre fel så börjar vi om. Och jag lyfter snabbare för varje runda.'],
    ['D', 'Så samarbete är något man hittar under ett tält?'],
    ['H', 'Var trodde du? Under en presenning?'],
  ],
  goal(g) {
    const f = g.flags;
    const head = `Runda ${Math.min(f.round + 1, ROUNDS.length)}/${ROUNDS.length} · Missar: ${f.miss}/${MAX_MISSES}`;
    const tip = { show: 'Titta var samarbetet ligger!', drop: 'Titta var samarbetet ligger!', shuffle: 'Håll koll på tältet...',
      choose: '← → välj tält · mellanslag: lyft', reveal: '' }[f.phase] ?? '';
    return tip ? `${head} · ${tip}` : head;
  },
  setup(g) {
    const f = g.flags;
    f.round = 0; f.miss = 0;
    f.tents = SLOTS.map((x, i) => ({ slot: i, x, hop: 0, lift: 0, target: 0, junk: JUNK[0] }));
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
        if (--f.swapsLeft <= 0) { f.phase = 'choose'; g.henrikSay('Nå? Vilket tält lyfter du på?', 2); }
      }
      f.bark -= dt;
      if (f.bark <= 0) { f.bark = 1.6; g.henrikSay(pick(SHUFFLE_BARKS), 1.4); }
    } else if (f.phase === 'choose') {
      if (wasPressed('left')) f.cursor = Math.max(0, f.cursor - 1);
      if (wasPressed('right')) f.cursor = Math.min(2, f.cursor + 1);
      if (wasPressed('action') || wasPressed('up') || wasPressed('down')) {
        f.chosen = tentAt(f, f.cursor);
        f.chosen.target = 1;
        f.right = f.chosen === f.tents[f.prize];
        f.phase = 'reveal'; f.pt = 2.2;
        g.say(f.right ? pick(RIGHT) : f.chosen.junk.say, g.p, 'me', 2.2);
        if (f.right) { g.meter = Math.max(0, g.meter - 34); g.shout('SAMARBETE!'); g.henrikSay(pick(HENRIK_RIGHT), 1.8); }
        else g.henrikSay(pick(HENRIK_WRONG), 2);
      }
    } else if (f.phase === 'reveal') {
      f.pt -= dt;
      if (!f.right && f.pt < 1.3) f.tents[f.prize].target = 1; // show where it really was
      if (f.pt <= 0) {
        g.shout(null);
        if (f.right) {
          f.round++;
          if (f.round >= ROUNDS.length) return 'win';
        } else if (++f.miss >= MAX_MISSES) return 'fail';
        startRound(g);
      }
    }
  },
  onWin(g) { g.shout('TÄLTET ÄR LYFT!'); for (const t of g.flags.tents) t.target = 1; },
  draw(g, ctx) {
    const f = g.flags;
    if (!f.tents) return;
    // Lifting is animated here so it also runs during the win dialogue
    const dt = Math.min(0.1, g.time - (f.last || g.time));
    f.last = g.time;
    for (const t of f.tents) t.lift += Math.max(-dt * 4, Math.min(dt * 4, t.target - t.lift));
    // What lies under each tent: samarbetet under one, junk under the others
    f.tents.forEach((t, i) => {
      if (t.lift < 0.05) return;
      const x = Math.round(t.x - g.camX);
      if (i === f.prize) drawSamarbete(ctx, x, g.time);
      else drawItem(ctx, x, GROUND_Y - 4, { kind: t.junk.item }, g.time);
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
    ['D', 'Tre av tre. Jag har lyft på tältet. Där låg samarbetet.'],
    ['H', 'Fantastiskt! Det här ska in i årsredovisningen: "Vi lyfte på tältet."'],
    ['H', 'Nästa år lyfter vi på hela Haga slott.'],
    ['D', 'Det är inget tält.'],
    ['H', 'Inte med den inställningen. Nu: LUNCH!'],
  ],
  fail: [
    ['H', 'Tre fel tält! Du har lyft på allt utom samarbetet.'],
    ['H', 'Vi skyfflar om. Ett tält i taget, ett lyft i taget!'],
  ],
};

// Samarbetet: two tiny colleagues giving each other a high five, with a heart above them.
function drawSamarbete(ctx, x, t) {
  const r = (xx, yy, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(xx, yy, w, h); };
  const y = GROUND_Y;
  for (const [dx, c] of [[-4, '#3d6fb0'], [4, '#b0457a']]) {
    r(x + dx - 1, y - 3, 1, 3, '#2a2a33'); r(x + dx + 1, y - 3, 1, 3, '#2a2a33'); // legs
    r(x + dx - 1, y - 7, 3, 4, c);                                              // body
    r(x + dx - 1, y - 10, 3, 3, '#f0c4a0');                                     // head
  }
  r(x - 2, y - 9, 1, 1, '#f0c4a0'); r(x - 1, y - 10, 2, 1, '#f0c4a0'); r(x + 1, y - 9, 1, 1, '#f0c4a0'); // high five
  if (Math.sin(t * 5) > -0.3) { // blinking heart
    r(x - 2, y - 15, 2, 1, '#ff5d73'); r(x + 1, y - 15, 2, 1, '#ff5d73');
    r(x - 2, y - 14, 5, 1, '#ff5d73'); r(x - 1, y - 13, 3, 1, '#ff5d73'); r(x, y - 12, 1, 1, '#ff5d73');
  }
}

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
