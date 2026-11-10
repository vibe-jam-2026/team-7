// 13:00 Workshop: the post-it storm. Catch falling ideas and stick them on Henrik's flipchart.
// Three phases that get harder: warm-up, then Henrik turns on a fan (the notes drift in gusts),
// then an IDEA RAIN. Notes:
//   yellow = idea (+1)        gold = great idea (+2, falls fast)
//   red    = "SYNERGI!" (you get stuck)        grey = "Vi tar det offline" (takes an idea away)
// Every 4 ideas in a row without a mistake gives a FLOW bonus.
import { WIDTH, rand, pick } from '../world.js';

const NEED = 10;
const BAD = ['SYNERGI!', 'Paradigmskifte!', 'Låt oss zooma ut!', 'Kan vi parkera det?', 'Disruptivt!'];
const IDEAS = [
  'AI i kaffemaskinen!', 'Blockchain-fika!', 'Möte om färre möten!', 'Agil agenda!', 'Slack för Slack!',
  'Post-its av post-its!', 'Digital whiteboard, på papper!', 'Mindre Excel, mer Excel!', '13.2 som tjänst!',
  'Gamifiera tidrapporten!', 'Stående möten. I bastun.', 'Molnet, fast lokalt!', 'Tisdagar på fredagar!',
];
const GOLD = ['GULDIDÉ: fyra dagars vecka!', 'GULDIDÉ: inga möten på onsdag!', 'GULDIDÉ: release på en tisdag!'];
const BARKS = [
  'Alla idéer är bra idéer!', 'Tänk utanför boxen! Inom budget.', 'Ingen idé är för dum. Förutom den förra.',
  'Bra! Skriv en lapp till!', 'Vad skulle Steve Jobs ha gjort?', 'Ja, och...!',
];

// Phases by time: [start second, name, seconds between notes, share of bad notes, fall speed]
const PHASES = [
  { at: 0, name: null, every: 0.55, bad: 0.25, grey: 0.08, speed: [32, 50] },
  { at: 9, name: 'FLÄKTEN ÄR PÅ!', every: 0.5, bad: 0.28, grey: 0.12, speed: [34, 54], wind: true },
  { at: 18, name: 'IDÉREGN!', every: 0.3, bad: 0.32, grey: 0.12, speed: [48, 72], wind: true },
];

export default {
  id: 'workshop',
  title: 'Workshop: Post-it-stormen',
  tagline: `Fånga ${NEED} idéer. Undvik synergi.`,
  station: { x: 432, label: 'Workshop' },
  start: 560,
  henrik: 610,
  time: 28,
  intro: [
    ['H', 'Brainstorm! Fånga idéerna innan de landar, så sätter jag dem på blädderblocket.'],
    ['H', 'Gula lappar är idéer. GULDLAPPAR är guldidéer, de räknas dubbelt.'],
    ['H', 'Röda säger "SYNERGI", undvik dem. Grå säger "vi tar det offline", de äter upp en idé.'],
    ['D', 'Hur många idéer behöver vi?'],
    ['H', `${NEED}. Nio är för få, och elva är en ny workshop. Och jag kanske sätter på fläkten.`],
  ],
  goal: (g) => `Idéer på blädderblocket: ${g.count}/${NEED}` + (g.flags.combo >= 2 ? ` · ${g.flags.combo} i rad!` : ''),

  setup(g) {
    g.flags.board = g.prop('flipchart', 650, { notes: 0 });
    g.flags.spawn = 0.3; g.flags.bark = 1.2; g.flags.phase = 0; g.flags.combo = 0; g.flags.wind = 0;
  },

  update(g, dt) {
    const f = g.flags;
    // Next phase?
    const next = PHASES[f.phase + 1];
    if (next && g.t >= next.at) {
      f.phase++;
      g.shout(next.name);
      g.sfx.whistle();
      f.shoutT = 1.4;
      g.henrikSay(f.phase === 1 ? 'Jag satte på fläkten. För kreativitetens skull!' : 'Sista minuten! ALLA IDÉER NU!', 2);
    }
    if (f.shoutT > 0) { f.shoutT -= dt; if (f.shoutT <= 0) g.shout(null); }
    const ph = PHASES[f.phase];

    // Wind comes in gusts and pushes the notes sideways; every note also flutters a little
    f.wind = ph.wind ? Math.sin(g.t * 0.9) * 55 + Math.sin(g.t * 2.3) * 15 : 0;
    for (const n of g.fallers) n.x += (Math.sin(g.t * 3 + n.seed) * 14 + f.wind) * dt;

    // New notes
    f.spawn -= dt;
    if (f.spawn <= 0) {
      f.spawn = ph.every;
      // Spawn upwind, so the gusts carry the notes towards you
      const x = Math.max(20, Math.min(g.level.width - 20, g.p.x + rand(-130, 130) - f.wind * 1.5));
      const r = Math.random();
      const seed = Math.random() * 10;
      if (r < ph.bad) g.faller('postit', x, { vy: rand(...ph.speed), bad: true, text: pick(BAD), seed });
      else if (r < ph.bad + ph.grey) g.faller('postit', x, { vy: rand(...ph.speed), tone: 'grey', seed });
      else if (r < ph.bad + ph.grey + 0.09) g.faller('postit', x, { vy: rand(...ph.speed) * 1.45, tone: 'gold', seed });
      else g.faller('postit', x, { vy: rand(...ph.speed), seed });
    }

    f.bark -= dt;
    if (f.bark <= 0) { f.bark = 3.5; g.henrikSay(pick(BARKS)); }

    f.board.notes = g.count;
    if (g.count >= NEED) return 'win';
  },

  // Caught a note that wasn't red
  onCatch(g, n) {
    const f = g.flags;
    if (n.tone === 'grey') {
      g.count = Math.max(0, g.count - 1);
      f.combo = 0;
      g.sfx.nope();
      g.say('Vi tar det offline! −1', g.p, 'me', 1.4);
      return;
    }
    const gold = n.tone === 'gold';
    g.count += gold ? 2 : 1;
    f.combo++;
    if (gold) g.sfx.jingle();
    g.say(gold ? pick(GOLD) : pick(IDEAS), g.p, 'me', 1.3);
    if (f.combo % 4 === 0) { // flow bonus
      g.count++;
      g.sfx.ding();
      g.shout('FLOW! +1');
      f.shoutT = 0.9;
    }
  },
  onHit(g) { g.flags.combo = 0; },
  onMiss(g, n) {
    if (n.tone === 'grey') return;
    g.flags.combo = 0;
    if (Math.random() < 0.35) g.henrikSay('En idé föll på golvet! Den var säkert bra.');
  },

  // Wind streaks while the fan is on
  draw(g, ctx) {
    const w = g.flags.wind || 0;
    if (Math.abs(w) < 8) return;
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    for (let i = 0; i < 14; i++) {
      const y = 20 + ((i * 37) % 110);
      const len = 6 + (i % 3) * 4;
      const x = ((i * 53 + g.time * w * 3) % (WIDTH + 40) + WIDTH + 40) % (WIDTH + 40) - 20;
      ctx.fillRect(Math.round(x), y, len, 1);
    }
  },

  win: [
    (g) => ['H', `${g.count} idéer! Fantastiskt. Jag lägger in dem i ett Excelark som ingen någonsin öppnar igen.`],
    ['D', 'Varför gör vi det här då?'],
    ['H', 'För att det känns bra. Det står i punkt 14.'],
  ],
  fail: [['H', 'Idéerna blåste in i Mälaren. Fiskarna har nu en strategi. En gång till!']],
};
