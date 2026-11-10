// The UX designers Jocke, Katarina and Nikki. Now and then, while you walk around the Haga hub,
// all three come running from behind as a group with tablets full of Figma concepts.
// They jog slowly so you can read what they shout. If one of them catches you, the whole gang
// gathers round and you are stuck listening to a group pitch about margins, spacing
// and the inUniform framework they needed yesterday.
// They take turns talking, one line at a time, so there is time to read.
// Lines and timing live in DESIGNERS in src/story.js.
import { WIDTH, GROUND_Y, pick, rand } from './world.js';
import { drawPerson } from './sprites.js';
import { SPEAKERS, DESIGNERS } from './story.js';
import { sfx } from './ljud.js';

const CATCH_DIST = 8;
const OVERSHOOT = 50;  // how far past you they run before skidding round (time to turn and get ready)
const MAX_TURNS = 2;   // turnarounds before they give up
const MAX_CHASE = 28;  // seconds (they are slow, so give them time)
const SPACING = 11;    // px between them: a tight pack, so one jump clears all three

let cooldown = rand(6, 10); // the first chase comes quickly
let shoutT = 0;
let group = null;      // shared state for the current chase: who talks next, the pitch script

// Called from the hub every frame
export function updateDesigners(g, dt) {
  g.designers ??= [];
  cooldown -= dt;
  if (cooldown <= 0 && g.designers.length === 0) {
    cooldown = rand(...DESIGNERS.chaseEvery);
    startChase(g);
  }
  if (shoutT > 0 && (shoutT -= dt) <= 0) g.shout(null);

  if (group) { updatePack(g, dt); updateGroup(g, dt); }
  for (const d of g.designers) update(g, d, dt);
  g.designers = g.designers.filter((d) => !(d.state === 'leave' && (d.x < g.camX - 60 || d.x > g.camX + WIDTH + 60)));
  if (g.designers.length === 0) group = null;
}

function startChase(g) {
  const side = -(g.p.facing || 1); // they come from behind you
  g.shout(pick(DESIGNERS.rush));
  shoutT = 2.6;
  sfx.siren();
  sfx.kazoo();
  const byWho = Object.fromEntries(DESIGNERS.people.map((p) => [p.who, p]));
  // They move as one pack: `pack.x` is the leader, the others trail right behind.
  const x = side > 0 ? g.camX + WIDTH + 16 : g.camX - 16;
  const pack = { x, side: Math.sign(x - g.p.x) || side, dir: Math.sign(g.p.x - x) || -side, speed: DESIGNERS.speed, turns: 0, passed: false, age: 0 };
  group = { talkT: 0.8, next: 0, pitch: null, pack };
  DESIGNERS.order.forEach((who, rank) => g.designers.push({
    person: byWho[who], look: SPEAKERS[who].look, rank, x: x - pack.dir * rank * SPACING, dir: pack.dir,
    speed: pack.speed, state: 'chase', t: Math.random() * 5, slot: 0,
  }));
}

// The pack runs at you. Only the leader can catch you, so you never get stuck between them;
// once the last one is past you, they all skid round together.
function updatePack(g, dt) {
  const k = group.pack, p = g.p;
  const chasing = g.designers.filter((d) => d.state === 'chase');
  if (!chasing.length || group.pitch) return;
  k.age += dt;
  k.x += k.dir * k.speed * dt;
  for (const d of chasing) { d.x = k.x - k.dir * d.rank * SPACING; d.dir = k.dir; }
  const lead = chasing.reduce((a, d) => (d.rank < a.rank ? d : a));
  const tail = chasing.reduce((a, d) => (d.rank > a.rank ? d : a));

  // Only while the leader is still in front of you: once it has run in under you, you are clear
  const ahead = Math.sign(lead.x - p.x) === k.side;
  if (!k.passed && ahead && Math.abs(lead.x - p.x) < CATCH_DIST && p.y > GROUND_Y - 22 && p.stun <= 0) { catchYou(g, lead); return; }

  // The whole pack ran past you (you jumped over them): skid and turn round together
  if (!k.passed && Math.sign(tail.x - p.x) !== k.side && Math.abs(tail.x - p.x) > 6) {
    k.passed = true;
    if (p.stun <= 0) { g.stats.uxDodged = (g.stats.uxDodged ?? 0) + 1; sfx.whoosh(); }
  }
  if (k.passed && Math.abs(tail.x - p.x) > OVERSHOOT) {
    k.turns++;
    if (k.turns > MAX_TURNS) { chasing.forEach((d, i) => leave(g, d, i === 0 ? pick(DESIGNERS.giveUp) : null)); return; }
    // The last one becomes the leader, so nobody jumps on screen
    const maxRank = Math.max(...chasing.map((d) => d.rank));
    k.x = tail.x; k.dir = -k.dir; k.side = -k.side; k.passed = false; k.speed *= 0.96;
    for (const d of chasing) d.rank = maxRank - d.rank;
    if (Math.random() < 0.5) { g.say(pick(DESIGNERS.turn), tail, 'ux', 2.4); group.talkT = Math.max(group.talkT, 2.4); }
  }
  if (k.age > MAX_CHASE) chasing.forEach((d) => leave(g, d, null));
}

// One of them talks at a time, taking turns, so the bubbles can be read
function updateGroup(g, dt) {
  if (group.pitch) return runPitch(g, dt);
  const chasing = g.designers.filter((d) => d.state === 'chase');
  if (!chasing.length) return;
  group.talkT -= dt;
  if (group.talkT > 0) return;
  const d = chasing[group.next++ % chasing.length];
  g.say(pick(d.person.shout), d, 'ux', DESIGNERS.lineTime);
  group.talkT = DESIGNERS.lineTime + 0.3;
}

function update(g, d, dt) {
  d.t += dt;
  const p = g.p;

  if (d.state === 'chase') {
    // moved by updatePack
  } else if (d.state === 'pitch') {
    // Gather round you and hold the tablets up to your face
    const target = p.x + d.slot;
    d.dir = Math.sign(p.x - d.x) || 1;
    const gap = target - d.x;
    if (Math.abs(gap) > 2) { d.x += Math.sign(gap) * Math.min(Math.abs(gap), d.speed * 1.2 * dt); d.walking = true; }
    else d.walking = false;
  } else { // leave
    d.x += d.dir * d.speed * 0.8 * dt;
  }
}

// One caught you: the whole group gathers round for a long pitch
function catchYou(g, d) {
  const script = pick(DESIGNERS.pitch);
  const dur = script.length * DESIGNERS.pitchLine + 0.6;
  group.pitch = { script, step: 0, t: 0, dur };
  const slots = [-14, 14, -28];
  // The one who caught you stands closest; the others take the remaining spots
  const team = [d, ...g.designers.filter((o) => o !== d && o.state === 'chase')];
  team.forEach((o, i) => { o.state = 'pitch'; o.slot = slots[i] ?? -42; });
  g.p.stun = dur;
  g.p.vx = 0;
  g.stats.figma = (g.stats.figma ?? 0) + 1;
  sfx.bonk();
  sfx.kazoo();
  if (g.henrik && Math.random() < 0.4) g.henrikSay('Figma är inte en agendapunkt!', 2.5);
}

function runPitch(g, dt) {
  const pi = group.pitch;
  pi.t += dt;
  const L = DESIGNERS.pitchLine;
  while (pi.step < pi.script.length && pi.t >= pi.step * L) {
    const [who, text] = pi.script[pi.step++];
    const speaker = who === 'me' ? g.p : g.designers.find((o) => o.person.who === who && o.state === 'pitch');
    if (speaker) g.say(text, speaker, who === 'me' ? 'me' : 'ux', L - 0.15);
  }
  if (pi.t >= pi.dur) {
    group.pitch = null;
    group.talkT = 99; // no more shouting on the way out
    const team = g.designers.filter((o) => o.state === 'pitch');
    team.forEach((o, i) => leave(g, o, i === 0 ? pick(DESIGNERS.leaveLine) : null));
  }
}

function leave(g, d, line) {
  d.state = 'leave';
  // Run off the nearest edge of the screen, away from you
  d.dir = Math.sign(d.x - g.p.x) || 1;
  if (line) g.say(line, d, 'ux', 2.6);
}

// Drawn in the hub, after Henrik
export function drawDesigners(ctx, g) {
  for (const d of g.designers || []) {
    const sx = d.x - g.camX;
    const moving = d.state !== 'pitch' || d.walking;
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
