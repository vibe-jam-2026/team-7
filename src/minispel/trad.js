// 09:30 Hållbarhetspunkten: plant trees in the park.
// "Den bästa tiden att plantera ett träd var för 20 år sedan. Den näst bästa tiden är nu."
// Pick up a sapling at the crate, stand by a stake and tap ↓ to dig and plant. One sapling at a time.
import { wasPressed } from '../input.js';
import { GROUND_Y, pick } from '../world.js';
import { drawGrowingTree } from '../sprites.js';

const CRATE_X = 975;
const PLOTS = [770, 835, 900, 1045, 1105, 1160];
const DIGS = 3; // taps of ↓ to dig a hole and plant

const ASKERS = [
  'Har du 5 minuter?', 'Ska vi inte skapa en arbetsgrupp först?', 'Finns det en budget för träd?',
  'Har vi förankrat det här med ledningen?', 'Kan vi plantera nästa kvartal?', 'Är det här en KPI?',
];
const PRAISE = ['Ett träd!', 'Om 20 år: skugga!', 'Hållbart!', 'Henrik ser stolt ut.', 'Rötter!'];
const HENRIK_BARKS = [
  'Den bästa tiden var för 20 år sedan!', 'Den näst bästa är NU!', 'Gräv, gräv, gräv!',
  'Varje träd binder koldioxid och synergier!', 'Jag har en slide om ekar.',
];

export default {
  id: 'trad',
  title: 'Plantera träd',
  tagline: 'Den bästa tiden var för 20 år sedan. Den näst bästa är nu.',
  station: { x: 1048, label: 'Trädplantering' },
  start: 990,
  henrik: 1010,
  time: 45,
  intro: [
    ['H', 'Agendapunkt 31: hållbarhet. Vi ska plantera en lund här i parken.'],
    ['H', 'Ett kinesiskt ordspråk säger: den bästa tiden att plantera ett träd var för 20 år sedan.'],
    ['D', 'För 20 år sedan hade jag inte ens skrivit min första bugg.'],
    ['H', 'Precis! Därför: den näst bästa tiden är NU. Sex plantor. Lådan står här.'],
    ['H', 'Hämta en planta, ställ dig vid en pinne med band och tryck ↓ för att gräva. Se upp för folk som vill "förankra" först.'],
  ],
  goal: (g) => `Planterade träd: ${g.count}/${PLOTS.length}` + (g.flags.carry ? ' · Du bär en planta' : ' · Hämta en planta i lådan'),
  setup(g) {
    g.prop('saplings', CRATE_X);
    g.flags.plots = PLOTS.map((x, i) => g.prop('plot', x, { dig: 0, planted: false, size: 0, target: 0, seed: i + 1 }));
    g.flags.carry = false;
    g.flags.spawn = 3;
    g.flags.bark = 2;
    g.flags.last = 0;
  },
  update(g, dt) {
    const f = g.flags;
    const onGround = g.p.y >= GROUND_Y - 1;

    // Pick up a sapling at the crate
    if (!f.carry && onGround && Math.abs(g.p.x - CRATE_X) < 14) {
      f.carry = true;
      g.say('En planta!', g.p, 'me', 1);
    }

    // Dig and plant at the nearest free stake
    const plot = f.plots.find((p) => !p.planted && Math.abs(p.x - g.p.x) < 10);
    if (plot && wasPressed('down') && g.p.stun <= 0) {
      if (!f.carry) g.say('Jag behöver en planta.', g.p, 'me', 1.2);
      else {
        plot.dig++;
        g.p.vx = 0;
        if (plot.dig >= DIGS) {
          plot.planted = true; plot.target = 0.15;
          f.carry = false;
          g.count++;
          g.say(pick(PRAISE), g.p, 'me', 1.3);
        }
      }
    }

    // Planted trees grow a little while you work
    for (const p of f.plots) if (p.planted) p.target = Math.min(0.4, p.target + dt * 0.012);

    // Colleagues who want to "anchor it first"
    f.spawn -= dt;
    if (f.spawn <= 0) { f.spawn = 2.6; g.walker(ASKERS); }
    f.bark -= dt;
    if (f.bark <= 0) { f.bark = 4.5; g.henrikSay(pick(HENRIK_BARKS)); }

    if (g.count >= PLOTS.length) return 'win';
  },
  onWin(g) {
    g.walkers = [];
    g.flags.carry = false;
    g.flags.timelapse = true;
    for (const p of g.flags.plots) p.target = 1;
    g.shout('20 ÅR SENARE...');
  },
  // Animate growth (also during the win dialogue: a time-lapse) and draw the sapling you carry.
  draw(g, ctx) {
    const f = g.flags;
    const dt = Math.min(0.1, g.time - (f.last || g.time));
    f.last = g.time;
    const speed = f.timelapse ? 0.25 : 0.6;
    for (const p of f.plots || []) {
      if (p.size < p.target) p.size = Math.min(p.target, p.size + dt * speed);
    }
    if (f.carry) {
      const x = Math.round(g.p.x - g.camX + g.p.facing * 6);
      ctx.save(); ctx.translate(0, Math.round(g.p.y - GROUND_Y - 10));
      drawGrowingTree(ctx, x, 0.05, 2);
      ctx.restore();
    }
    // Dirt flying while digging
    const digging = (f.plots || []).find((p) => !p.planted && p.dig > 0 && Math.abs(p.x - g.p.x) < 10);
    if (digging && Math.sin(g.time * 20) > 0) {
      const x = Math.round(digging.x - g.camX);
      ctx.fillStyle = '#6b4a30';
      ctx.fillRect(x - 6, GROUND_Y - 5, 2, 2); ctx.fillRect(x + 4, GROUND_Y - 7, 2, 2);
    }
  },
  win: [
    ['H', 'Titta. En hel lund. Vi döper den till Agendalunden.'],
    ['D', 'Vänta... de växte väldigt fort?'],
    ['H', 'Det är så det känns om 20 år. Då står någon här i skuggan och tänker: tur att de planterade då.'],
    ['D', 'Den bästa tiden var för 20 år sedan. Den näst bästa var i dag. Klockan 09:30.'],
    ['H', 'Enligt agendan! Nu: demon.'],
  ],
  fail: [['H', 'Tiden tog slut. Men vet du vad? Den näst bästa tiden är fortfarande nu. Igen!']],
};
