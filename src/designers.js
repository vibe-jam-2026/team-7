// The UX designers Katarina, Jocke and Nikki. Now and then, while you walk around the Haga hub,
// one of them (sometimes all three) comes running from behind with a tablet full of Figma concepts.
// They are faster than you, so jump over them! If they catch you, you are stuck for a while
// listening to a pitch about user flows, design systems and the GUI.
// Lines and timing live in DESIGNERS in src/story.js.
import { WIDTH, GROUND_Y, pick, rand } from './world.js';
import { drawPerson } from './sprites.js';
import { SPEAKERS, DESIGNERS } from './story.js';
import { sfx } from './ljud.js';

const CATCH_DIST = 8;
const OVERSHOOT = 26;  // how far past you they run before skidding round
const MAX_TURNS = 2;   // turnarounds before they give up
const MAX_CHASE = 14;  // seconds

let cooldown = rand(5, 9); // the first chase comes quickly
let shoutT = 0;

// Called from the hub every frame
export function updateDesigners(g, dt) {
  g.designers ??= [];
  cooldown -= dt;
  if (cooldown <= 0 && g.designers.length === 0) {
    cooldown = rand(...DESIGNERS.chaseEvery);
    startChase(g);
  }
  if (shoutT > 0 && (shoutT -= dt) <= 0) g.shout(null);

  for (const d of g.designers) update(g, d, dt);
  g.designers = g.designers.filter((d) => !(d.state === 'leave' && (d.x < g.camX - 50 || d.x > g.camX + WIDTH + 50)));
}

function startChase(g) {
  const side = -(g.p.facing || 1); // they come from behind you
  if (Math.random() < 0.2) { // UX rush: all three at once
    g.shout(DESIGNERS.rush);
    shoutT = 1.8;
    sfx.siren();
    DESIGNERS.people.forEach((p, i) => spawn(g, p, side, i * 28));
  } else {
    spawn(g, pick(DESIGNERS.people), side, 0);
    sfx.kazoo();
  }
}

function spawn(g, person, side, behind) {
  const x = side > 0 ? g.camX + WIDTH + 16 + behind : g.camX - 16 - behind;
  g.designers.push({
    person, look: SPEAKERS[person.who].look, x, side: Math.sign(x - g.p.x) || side,
    dir: Math.sign(g.p.x - x) || -side, speed: DESIGNERS.speed * rand(0.95, 1.08),
    state: 'chase', age: 0, t: Math.random() * 5, barkT: behind / 60, turns: 0, passed: false, step: 0,
  });
}

function update(g, d, dt) {
  d.age += dt; d.t += dt;
  const p = g.p;
  const dist = Math.abs(d.x - p.x);

  if (d.state === 'chase') {
    d.x += d.dir * d.speed * dt;
    d.barkT -= dt;
    if (d.barkT <= 0) { d.barkT = rand(2, 2.8); g.say(pick(d.person.shout), d, 'ux', 2.2); }

    if (dist < CATCH_DIST && p.y > GROUND_Y - 22 && p.stun <= 0) { catchYou(g, d); return; }

    // Ran past you (you jumped over, or someone else is pitching to you): skid and turn round
    if (!d.passed && Math.sign(d.x - p.x) !== d.side && dist > 6) {
      d.passed = true;
      if (p.stun <= 0) { g.stats.uxDodged = (g.stats.uxDodged ?? 0) + 1; sfx.whoosh(); }
    }
    if (d.passed && dist > OVERSHOOT) {
      d.turns++;
      if (d.turns > MAX_TURNS) { leave(g, d, pick(DESIGNERS.giveUp)); return; }
      d.dir = -d.dir; d.side = -d.side; d.passed = false;
      d.speed *= 0.96;
      g.say(pick(['Vänta!', 'Bara EN frame till!', 'Hallå?! Feedback!', 'Du missade hover-staten!']), d, 'ux', 1.4);
    }
    if (d.age > MAX_CHASE) leave(g, d, pick(DESIGNERS.giveUp));
  } else if (d.state === 'pitch') {
    // Stand right next to you and hold the tablet up to your face
    d.dir = Math.sign(p.x - d.x) || 1;
    d.x += (p.x - d.dir * 14 - d.x) * Math.min(1, dt * 10);
    d.t2 += dt;
    const script = [
      [0, () => g.say(pick(d.person.pitch), d, 'ux', 1.5)],
      [0.9, () => g.say(pick(DESIGNERS.stuck), p, 'me', 1.2)],
      [1.6, () => g.say(pick(d.person.pitch), d, 'ux', 1.4)],
      [2.6, () => leave(g, d, 'Tack för feedbacken! Jag itererar!')],
    ];
    while (d.step < script.length && d.t2 >= script[d.step][0]) script[d.step++][1]();
  } else { // leave
    d.x += d.dir * d.speed * 0.8 * dt;
  }
}

function catchYou(g, d) {
  d.state = 'pitch'; d.t2 = 0; d.step = 0;
  g.p.stun = 2.8;
  g.p.vx = 0;
  g.stats.figma = (g.stats.figma ?? 0) + 1;
  sfx.bonk();
  sfx.kazoo();
  if (g.henrik && Math.random() < 0.4) g.henrikSay('Figma är inte en agendapunkt!', 2);
}

function leave(g, d, line) {
  d.state = 'leave';
  // Run off the nearest edge of the screen, away from you
  d.dir = Math.sign(d.x - g.p.x) || 1;
  if (line) g.say(line, d, 'ux', 2);
}

// Drawn in the hub, after Henrik
export function drawDesigners(ctx, g) {
  for (const d of g.designers || []) {
    const sx = d.x - g.camX;
    const moving = d.state !== 'pitch';
    drawPerson(ctx, sx, GROUND_Y, d.look, d.dir, d.t, moving);
    if (d.state === 'chase') {
      // Speed lines behind them and a stressed "!" over their head
      ctx.fillStyle = 'rgba(255,255,255,.75)';
      for (let i = 0; i < 3; i++) {
        const len = 4 + ((Math.floor(d.t * 20) + i) % 3) * 2;
        ctx.fillRect(Math.round(sx - d.dir * (8 + len)), GROUND_Y - 18 + i * 5, len, 1);
      }
      if (Math.sin(d.t * 14) > -0.3) {
        ctx.fillStyle = '#a259ff';
        ctx.fillRect(Math.round(sx), GROUND_Y - 38, 2, 5);
        ctx.fillRect(Math.round(sx), GROUND_Y - 32, 2, 2);
      }
    } else if (d.state === 'pitch') {
      // Sweat drops flying off you
      ctx.fillStyle = '#9fd0ff';
      const k = (d.t * 3) % 1;
      ctx.fillRect(Math.round(g.p.x - g.camX - 6 - k * 4), Math.round(g.p.y - 30 + k * 6), 1, 2);
      ctx.fillRect(Math.round(g.p.x - g.camX + 6 + k * 4), Math.round(g.p.y - 31 + k * 7), 1, 2);
    }
  }
}
