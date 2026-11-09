// 19:00 Dinner: stay awake through Henrik's speech by drinking coffee.
import { GROUND_Y, WIDTH, HEIGHT, rand } from '../world.js';

const SPEECH = [
  'Kära kollegor. När jag började här fanns det bara en PowerPoint.',
  'Slide 4: Vår resa. Och resan... är målet.',
  'Slide 12: Ett kort skämt. Det tar ungefär tolv minuter.',
  'Jag vill tacka mig själv för att jag bokade lokalen.',
  'Slide 31: Värdeord. Mod. Lagom. Mer lagom.',
  'Här är ett diagram. Det går uppåt. Eller så är det upp och ner.',
  'Slide 58: Nu ska vi prata om slide 57.',
  'Nu närmar vi oss slutet! Slide 62.',
];

export default {
  id: 'middag',
  title: 'Middag med tal',
  tagline: 'Håll dig vaken i 20 sekunder',
  station: { x: 585, label: 'Matsalen' },
  start: 620,
  henrik: 690,
  time: 20,
  timeoutWins: true,
  meter: 'Vakenhet',
  intro: [
    ['H', 'Ladies and gentlemen... nu börjar talet!'],
    ['D', 'Jag har varit vaken sedan 13.1-releasen...'],
    ['H', 'Drick kaffe! Somnar du börjar jag om från slide 1.'],
  ],
  goal: (g) => `Håll dig vaken! Kaffe: ${g.flags.cups}`,
  setup(g) { g.flags.spawn = 0.4; g.flags.line = 0; g.flags.bark = 0.2; g.flags.cups = 0; g.flags.slide = 1; },
  update(g, dt) {
    g.meter -= 9 * dt;
    g.flags.spawn -= dt;
    if (g.flags.spawn <= 0) {
      g.flags.spawn = 1.3;
      const side = Math.random() < 0.5 ? -1 : 1;
      const x = Math.max(20, Math.min(g.level.width - 20, g.p.x + side * rand(45, 120)));
      g.item('coffee', x, GROUND_Y - 6, { ttl: 4, bob: true });
    }
    g.flags.bark -= dt;
    if (g.flags.bark <= 0) {
      g.flags.bark = 2.5;
      g.henrikSay(SPEECH[g.flags.line % SPEECH.length], 2.4);
      g.flags.line++;
      g.flags.slide += 7;
    }
    if (g.meter <= 0) return 'fail';
  },
  onCollect(g) {
    g.meter = Math.min(100, g.meter + 30);
    g.flags.cups++; g.stats.coffee++;
  },
  // Eyelids close as you get sleepy
  draw(g, ctx) {
    const sleepy = Math.max(0, 1 - g.meter / 55);
    const h = Math.round(sleepy * HEIGHT / 2);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, WIDTH, h);
    ctx.fillRect(0, HEIGHT - h, WIDTH, h);
  },
  win: [
    ['H', '...och slide 83: TACK! Frågor? Nej? Perfekt.'],
    (g) => ['D', `Jag har druckit ${g.flags.cups} koppar kaffe. Jag kan höra färger.`],
    ['H', 'Nu: bastu och allsång! Vi ses där!'],
  ],
  fail: [
    (g) => ['H', `Du somnade på slide ${Math.min(83, g.flags.slide)}. Inga problem, jag börjar om!`],
    ['H', 'Slide 1: Vem är jag? En resa i bilder.'],
  ],
};
