// Intro: you are coding the 13.2 delivery while the project managers panic around you.
// Mash the keys to code. New bugs push the progress back. At 99 % Henrik walks in.
import { pick } from '../world.js';
import { wasPressed } from '../input.js';
import { NATALIE, MARKUS, GUSTAV } from '../sprites.js';

const PANIC = {
  N: ['Kunden ringer IGEN!', 'Hur många procent?! HUR MÅNGA?!', 'Kan du koda med båda händerna?', 'Jag har lovat 13.2 till 14:00!'],
  M: ['Testmiljön blinkar!', 'Vem har rört main?!', 'Pipelinen är röd! Nej, grön! RÖD!', 'Jag ser en varning! Är det en varning?!'],
  G: ['Jag flyttar deadline till igår!', 'Ska vi ta ett snabbt statusmöte om stressen?', 'Jag har gjort en Gantt-chart över paniken!', 'Kan vi parallellisera dig?'],
};
const BUGS = ['NY BUGG I PROD!', 'MERGE-KONFLIKT!', 'KUNDEN VILL HA DET I LILA!', 'NPM INSTALL...'];

export default {
  id: 'kontoret',
  title: '13.2-leveransen',
  tagline: 'Hamra på tangenterna!',
  level: 'kontoret',
  start: 150,
  lockPlayer: true,
  meter: '13.2',
  intro: [
    ['G', 'Hamra på tangenterna! Alla tangenter! Det är så man kodar!'],
    ['N', 'Piltangenterna och mellanslag. FORT!'],
  ],
  goal: (g) => `Koda 13.2: ${Math.floor(g.meter)} % · hamra på tangenterna!`,
  setup(g) {
    g.p.facing = 1;
    g.flags.desk = g.prop('desk', 157, { front: true, lines: 0 });
    g.flags.pms = {
      N: g.npc(NATALIE, 110, { facing: 1 }),
      M: g.npc(MARKUS, 214, { facing: -1 }),
      G: g.npc(GUSTAV, 270, { patrol: [240, 300], speed: 75 }),
    };
    g.meter = 12;
    g.flags.shoutT = 0.4; g.flags.who = 0; g.flags.bugT = 3.5; g.flags.bigT = 0;
  },
  update(g, dt) {
    const presses = ['left', 'right', 'up', 'down', 'action'].filter((k) => wasPressed(k)).length;
    if (presses) { g.meter = Math.min(99, g.meter + 2.6 * presses); g.flags.desk.lines += presses; g.sfx.type(); }

    // The project managers take turns shouting
    g.flags.shoutT -= dt;
    if (g.flags.shoutT <= 0) {
      g.flags.shoutT = 1.3;
      const who = ['N', 'M', 'G'][g.flags.who++ % 3];
      g.say(pick(PANIC[who]), g.flags.pms[who], '', 1.6);
    }
    // Bugs appear and push you back
    g.flags.bugT -= dt;
    if (g.flags.bugT <= 0) {
      g.flags.bugT = 4;
      g.meter = Math.max(5, g.meter - 12);
      g.shout(pick(BUGS));
      g.sfx.siren();
      g.flags.bigT = 1.2;
    }
    g.flags.bigT -= dt;
    if (g.flags.bigT <= 0) g.shout(null);

    if (g.meter >= 99) return 'win';
  },
  // Red warning light in the ceiling
  draw(g, ctx) {
    const on = Math.sin(g.time * 8) > 0;
    ctx.fillStyle = '#555'; ctx.fillRect(156, 10, 8, 3);
    ctx.fillStyle = on ? '#ff3b3b' : '#8a1f1f'; ctx.fillRect(157, 13, 6, 4);
    if (on) { ctx.fillStyle = 'rgba(255,40,40,0.13)'; ctx.fillRect(0, 0, 320, 180); }
  },
  onWin(g) {
    g.henrik = { x: 345, facing: -1, target: 196 };
    g.flags.pms.G.patrol = null;
  },
  win: [
    ['H', 'STOPP! Alla! Släpp det ni har.'],
    ['N', 'Men 13.2 är på 99 procent!'],
    ['H', 'Lunch till lunch på Haga slott. Högsta prio. Bussen går om fem minuter.'],
    ['M', 'Högre prio än 13.2?'],
    ['H', 'Det finns inget högre prio än lunch. Det står i agendan. Punkt 0.'],
    ['G', 'Då flyttar jag deadline till... efter lunch till lunch.'],
    ['D', 'Så jag lämnar den bara på 99 procent?'],
    ['H', '99 procent är nästan 100. Det är praktiskt taget agilt. TILL BUSSEN!'],
  ],
  fail: [],
};
