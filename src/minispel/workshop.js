// 13:00 Workshop: catch falling post-it ideas, avoid the red "SYNERGI" ones.
import { rand, pick } from '../world.js';

const BAD = ['SYNERGI!', 'Vi tar det offline!', 'Kan vi parkera det?', 'Paradigmskifte!', 'Låt oss zooma ut!'];

export default {
  id: 'workshop',
  title: 'Workshop: Post-it-stormen',
  tagline: 'Fånga 8 idéer. Undvik synergi.',
  station: { x: 432, label: 'Workshop' },
  start: 560,
  henrik: 610,
  time: 25,
  intro: [
    ['H', 'Brainstorm! Gula lappar är idéer. Fånga dem innan de landar.'],
    ['H', 'Röda lappar säger "SYNERGI". Undvik dem. Vi har redan nog med synergi.'],
    ['A', 'Hur många idéer behöver vi?'],
    ['H', 'Åtta. Sju är för få, och nio är en ny workshop.'],
  ],
  goal: (g) => `Fånga idéer: ${g.count}/8`,
  setup(g) { g.flags.spawn = 0.3; g.flags.bark = 1; },
  update(g, dt) {
    g.flags.spawn -= dt;
    if (g.flags.spawn <= 0) {
      g.flags.spawn = 0.55;
      const x = Math.max(20, Math.min(g.level.width - 20, g.p.x + rand(-130, 130)));
      const bad = Math.random() < 0.3;
      g.faller('postit', x, { vy: rand(32, 52), bad, text: bad ? pick(BAD) : null });
    }
    g.flags.bark -= dt;
    if (g.flags.bark <= 0) {
      g.flags.bark = 3;
      g.henrikSay(pick(['Alla idéer är bra idéer!', 'Tänk utanför boxen! Inom budget.', 'Ingen idé är för dum. Förutom den förra.', 'Bra! Skriv en lapp till!', 'Vad skulle Steve Jobs ha gjort?']));
    }
    if (g.count >= 8) return 'win';
  },
  onMiss(g, f) { if (!f.bad && Math.random() < 0.4) g.henrikSay('En idé föll på golvet! Den var säkert bra.'); },
  win: [
    ['H', 'Åtta idéer! Fantastiskt. Jag lägger in dem i ett Excelark som ingen någonsin öppnar igen.'],
    ['A', 'Varför gör vi det här då?'],
    ['H', 'För att det känns bra. Det står i punkt 14.'],
  ],
  fail: [['H', 'Idéerna landade på golvet. Städpersonalen tackar för inspirationen. En gång till!']],
};
