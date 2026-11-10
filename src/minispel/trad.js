// 09:30 Hållbarhetspunkten: plant trees in the park.
// "Den bästa tiden att plantera ett träd var för 20 år sedan. Den näst bästa tiden är nu."
// Pick up a sapling at the crate, stand by a stake and dig with ↓. One sapling at a time.
// Digging is a timing game: a marker swings over a bar, press ↓ while it is in the green.
// Dead centre = a double dig, a miss = you hit a stone and are stuck for a moment.
// A squirrel wants your sapling: jump over it, or it steals it and you have to fetch a new one.
import { wasPressed } from '../input.js';
import { GROUND_Y, WIDTH, pick, rand } from '../world.js';
import { power } from '../powerups.js';
import { drawGrowingTree } from '../sprites.js';

const CRATE_X = 975;
const PLOTS = [770, 835, 900, 1045, 1105, 1160];
const DIGS = 3; // good digs needed for a hole
const SQUIRREL_SPEED = 135; // faster than you (95 px/s): jump over it
const STONES = ['Sten!', 'Aj, en rot!', 'Klonk!', 'Ett gammalt Nokia?!', 'Lera!'];
const PERFECT = ['PERFEKT SPADTAG!', 'Mitt i prick!', 'Spadmästare!'];
const SQUIRREL_LINES = ['Ekorren tog plantan!', 'Nej! Min planta!', 'Ekorren ska plantera själv?!'];

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
  powerups: ['speed', 'jump', 'shield', 'slow', 'quickwin'], // no magnet: saplings are picked up at the crate, not as items
  powerupText: { shield: 'Folk som vill "förankra" studsar av i 10 sekunder.' }, // what the power-ups mean here
  title: 'Plantera träd',
  tagline: 'Den bästa tiden var för 20 år sedan. Den näst bästa är nu.',
  station: { x: 1048, label: 'Trädplantering' },
  start: 990,
  henrik: 1010,
  time: 55,
  intro: [
    ['H', 'Agendapunkt 1: hållbarhet. Vi ska plantera en lund här i parken.'],
    ['H', 'Ett kinesiskt ordspråk säger: den bästa tiden att plantera ett träd var för 20 år sedan.'],
    ['D', 'För 20 år sedan hade jag inte ens skrivit min första bugg.'],
    ['H', 'Precis! Därför: den näst bästa tiden är NU. Sex plantor. Lådan står här.'],
    ['H', 'Hämta en planta och ställ dig vid en pinne med band. Tryck ↓ när markören är i det gröna. Mitt i prick = dubbelt!'],
    ['H', 'Och se upp för ekorren. Den vill också ha en planta. Hoppa över den! Och över folk som vill "förankra" först.'],
  ],
  goal: (g) => `Planterade träd: ${g.count}/${PLOTS.length}` + (g.flags.carry ? ' · Du bär en planta' : ' · Hämta en planta i lådan'),
  setup(g) {
    g.prop('saplings', CRATE_X);
    g.flags.plots = PLOTS.map((x, i) => g.prop('plot', x, { dig: 0, planted: false, size: 0, target: 0, seed: i + 1 }));
    g.flags.carry = false;
    g.flags.spawn = 3;
    g.flags.bark = 2;
    g.flags.last = 0;
    g.flags.meter = 0; g.flags.meterDir = 1;
    g.flags.squirrel = null; g.flags.squirrelT = rand(4, 6);
    g.flags.pops = [];
  },
  update(g, dt) {
    const f = g.flags;
    const onGround = g.p.y >= GROUND_Y - 1;

    // Pick up a sapling at the crate
    if (!f.carry && onGround && Math.abs(g.p.x - CRATE_X) < 14) {
      f.carry = true;
      g.sfx.pickup();
      g.say('En planta!', g.p, 'me', 1);
    }

    // Dig at the nearest free stake: a marker swings over a bar, press ↓ in the green
    const plot = f.plots.find((p) => !p.planted && Math.abs(p.x - g.p.x) < 10);
    f.digPlot = f.carry && onGround ? plot : null;
    const swing = 1.3 + g.count * 0.18; // gets faster for every tree
    f.zone = Math.max(0.16, 0.34 - g.count * 0.03);
    if (f.digPlot) {
      f.meter += f.meterDir * swing * dt;
      if (f.meter > 1) { f.meter = 1; f.meterDir = -1; }
      if (f.meter < 0) { f.meter = 0; f.meterDir = 1; }
    }
    if (plot && wasPressed('down') && g.p.stun <= 0) {
      if (!f.carry) { g.sfx.nope(); g.say('Jag behöver en planta.', g.p, 'me', 1.2); }
      else {
        g.p.vx = 0;
        const off = Math.abs(f.meter - 0.5);
        if (off < f.zone * 0.18) { // dead centre
          plot.dig += 2; g.sfx.dig(); g.sfx.pickup();
          f.pops.push({ text: pick(PERFECT), x: plot.x, y: GROUND_Y - 56, age: 0, col: '#ffd25e' });
        } else if (off < f.zone / 2) {
          plot.dig++; g.sfx.dig();
        } else { // a stone
          g.p.stun = 0.6; g.sfx.nope();
          f.pops.push({ text: pick(STONES), x: plot.x, y: GROUND_Y - 56, age: 0, col: '#ff8a7a' });
        }
        if (plot.dig >= DIGS) {
          plot.planted = true; plot.target = 0.15;
          f.carry = false;
          g.count++;
          g.sfx.plant();
          g.say(pick(PRAISE), g.p, 'me', 1.3);
        }
      }
    }

    // The squirrel comes for your sapling while you carry one
    f.squirrelT -= dt;
    if (!f.squirrel && f.carry && f.squirrelT <= 0) {
      const side = Math.random() < 0.5 ? -1 : 1;
      const x = side < 0 ? g.camX - 10 : g.camX + WIDTH + 10;
      f.squirrel = { x, dir: -side, side, t: 0, state: 'run', loot: false };
      g.sfx.whoosh();
      g.henrikSay('EKORRE! Skydda plantan!', 1.6);
    }
    const q = f.squirrel;
    if (q) {
      q.t += dt;
      q.x += q.dir * SQUIRREL_SPEED * (q.state === 'flee' ? 1.2 : 1) * dt;
      const dist = Math.abs(q.x - g.p.x);
      if (q.state === 'run' && dist < 7 && g.p.y > GROUND_Y - 14) {
        if (power.shield > 0) { q.state = 'flee'; q.dir = -q.dir; g.sfx.whoosh(); }
        else if (f.carry) {
          f.carry = false; q.loot = true; q.state = 'flee'; q.dir = -q.dir;
          g.sfx.nope(); g.say(pick(SQUIRREL_LINES), g.p, 'me', 1.6);
        }
      }
      if (q.state === 'run' && Math.sign(q.x - g.p.x) !== q.side && dist > 8) { q.state = 'gone'; g.sfx.whoosh(); }
      if (q.x < g.camX - 30 || q.x > g.camX + WIDTH + 30) { f.squirrel = null; f.squirrelT = rand(5, 8); }
    }
    for (const pp of f.pops) { pp.age += dt; pp.y -= 12 * dt; }
    f.pops = f.pops.filter((pp) => pp.age < 1.1);

    // Planted trees grow a little while you work
    for (const p of f.plots) if (p.planted) p.target = Math.min(0.4, p.target + dt * 0.012);

    // Colleagues who want to "anchor it first"
    f.spawn -= dt;
    if (f.spawn <= 0) { f.spawn = 3.4; g.walker(ASKERS); }
    f.bark -= dt;
    if (f.bark <= 0) { f.bark = 4.5; g.henrikSay(pick(HENRIK_BARKS)); }

    if (g.count >= PLOTS.length) return 'win';
  },
  onWin(g) {
    g.walkers = [];
    g.flags.carry = false;
    g.flags.squirrel = null; g.flags.digPlot = null;
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
    // The dig meter above you: green zone, gold centre, swinging marker
    if (f.digPlot && !f.timelapse) {
      const bx = Math.round(g.p.x - g.camX - 16), by = Math.round(g.p.y - 44), w = 32;
      ctx.fillStyle = '#1b1b2a'; ctx.fillRect(bx - 1, by - 1, w + 2, 6);
      ctx.fillStyle = '#7a3a2a'; ctx.fillRect(bx, by, w, 4);
      const zw = Math.round(w * f.zone), cw = Math.max(2, Math.round(w * f.zone * 0.36));
      ctx.fillStyle = '#57d27a'; ctx.fillRect(bx + Math.round((w - zw) / 2), by, zw, 4);
      ctx.fillStyle = '#ffd25e'; ctx.fillRect(bx + Math.round((w - cw) / 2), by, cw, 4);
      const mx = bx + Math.round(f.meter * (w - 1));
      ctx.fillStyle = '#ffffff'; ctx.fillRect(mx, by - 3, 1, 10);
      ctx.fillStyle = '#1b1b2a'; ctx.fillRect(mx - 1, by - 4, 3, 1);
      // Progress: one dot per dig
      const plot = f.digPlot;
      for (let i = 0; i < DIGS; i++) { ctx.fillStyle = i < plot.dig ? '#ffd25e' : '#3a3550'; ctx.fillRect(bx + 10 + i * 4, by + 7, 3, 2); }
    }
    // The squirrel: brown body, big bushy tail, and the stolen sapling when it flees
    const q = f.squirrel;
    if (q) {
      const x = Math.round(q.x - g.camX), y = GROUND_Y, d = q.dir, hop = Math.abs(Math.sin(q.t * 18)) * 3 | 0;
      const R = (dx, dy, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(d > 0 ? x + dx : x - dx - w, y - dy - hop, w, h); };
      R(-9, 12, 4, 8, '#a0522d'); R(-11, 14, 4, 5, '#a0522d'); R(-8, 13, 2, 6, '#c8743c'); // tail
      R(-5, 6, 8, 5, '#a0522d'); R(-4, 5, 6, 1, '#d89a62');                                // body
      R(2, 9, 4, 4, '#a0522d'); R(4, 8, 1, 1, '#1b1b2a'); R(5, 7, 1, 1, '#ffffff');        // head and eye
      R(2, 11, 1, 2, '#a0522d');                                                            // ear
      R(-4, 1, 2, 1, '#6b3a1d'); R(1, 1, 2, 1, '#6b3a1d');                                  // feet
      if (q.loot) { ctx.save(); ctx.translate(0, -hop - 6); drawGrowingTree(ctx, x + d * 5, 0.05, 2); ctx.restore(); }
    }
    // Popping texts: PERFEKT SPADTAG!, Sten! ...
    ctx.font = "6px 'Press Start 2P', monospace"; ctx.textAlign = 'center';
    for (const pp of f.pops) {
      const x = Math.round(pp.x - g.camX), y = Math.round(pp.y);
      ctx.fillStyle = '#1b1b2a'; ctx.fillText(pp.text, x + 1, y + 1);
      ctx.fillStyle = pp.col; ctx.fillText(pp.text, x, y);
    }
    ctx.textAlign = 'left';
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
    ['D', 'Den bästa tiden var för 20 år sedan. Den näst bästa var i dag. Klockan tolv.'],
    ['H', 'Enligt agendan! Nu: tälten.'],
  ],
  fail: [['H', 'Tiden tog slut. Men vet du vad? Den näst bästa tiden är fortfarande nu. Igen!']],
};
