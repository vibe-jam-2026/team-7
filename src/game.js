// The game engine: the Haga hub world, entering and leaving minigames, dialogue and title cards.
// The story (what happens when) lives in src/story.js. Each minigame lives in src/minispel/.
import { WIDTH, GROUND_Y, pick, rand } from './world.js';
import { wasPressed } from './input.js';
import { haga } from './levels/haga.js';
import { kontoret } from './levels/kontoret.js';
import { bussen } from './levels/bussen.js';
import { createPlayer, updatePlayer, drawPlayer } from './player.js';
import { drawPerson, drawItem, drawProp, PLAYER, HENRIK, COLLEAGUES } from './sprites.js';
import { MINIGAMES } from './minispel/index.js';
import { STORY, SPEAKERS, HUB, STUCK_LINES, END_STATS, FORBIDDEN } from './story.js';
import * as ui from './ui.js';

const LEVELS = { haga, kontoret, bussen };
const STEP = 1 / 120;


// ---- Shared state. Minigames get this object as `g`. ---------------------------
const g = {
  p: createPlayer(HUB.start), level: haga, camX: 0, time: 0,
  t: 0, left: 0, count: 0, meter: 100, flags: {}, dodgedHere: 0,
  items: [], props: [], walkers: [], fallers: [], bubbles: [], npcs: [],
  henrik: null, done: new Set(),
  stats: newStats(),

  item(kind, x, y, extra = {}) { const it = { kind, x, y, ...extra }; g.items.push(it); return it; },
  prop(kind, x, extra = {}) { const pr = { kind, x, ...extra }; g.props.push(pr); return pr; },
  faller(kind, x, extra = {}) { const f = { kind, x, y: -10, vy: 40, ...extra }; g.fallers.push(f); return f; },
  // A colleague walking towards you. Touching them gets you stuck in a "meeting"; jump over them.
  walker(lines, o = {}) {
    const side = o.side ?? (Math.random() < 0.5 ? -1 : 1);
    const x = o.x ?? (side > 0 ? g.camX + WIDTH + 16 : g.camX - 16);
    const w = {
      x, dir: Math.sign(g.p.x - x) || -side, speed: o.speed ?? rand(45, 65), look: o.look ?? pick(COLLEAGUES),
      line: Array.isArray(lines) ? pick(lines) : lines, said: false, done: false,
      side: Math.sign(x - g.p.x), age: 0, t: Math.random() * 5,
    };
    g.walkers.push(w);
    return w;
  },
  // A named person who stands still (or paces between two points) and can talk.
  npc(look, x, o = {}) {
    const n = { look, x, facing: o.facing ?? -1, patrol: o.patrol, speed: o.speed ?? 40, t: Math.random() * 5, walking: false };
    g.npcs.push(n);
    return n;
  },
  // Speech bubble above someone (`who` = g.p, g.henrik, a walker, or {x, y}).
  say(text, who = g.p, style = '', ttl = 2.4) {
    g.bubbles = g.bubbles.filter((b) => b.who !== who);
    g.bubbles.push({ text, who, style, ttl });
  },
  henrikSay(text, ttl = 2.6) { if (g.henrik) g.say(text, g.henrik, 'henrik', ttl); },
  shout(text) { ui.shout(text); },
};

function newStats() { return { coffee: 0, dodged: 0, meetings: 0, retries: 0, hits: 0 }; }

// ---- Flow: title → story beats → hub ↔ minigames → end -------------------------
let mode = 'title';
let beatIndex = 0;
let mg = null;                 // the minigame being played, or null in the hub
let cardT = 0, cardMin = 0, cardNext = null;
let dlg = null, dlgNext = null;
let barkT = 4, nearStation = null;
let acc = 0;

const beat = () => STORY[beatIndex] || {};

function showCard(info, next, duration = 1.8) {
  mode = 'card';
  ui.card(true, info);
  cardT = duration; cardMin = duration - 0.3; cardNext = next;
}

function talk(lines, next) {
  const list = (lines || []).map((l) => (typeof l === 'function' ? l(g) : l)).filter(Boolean);
  if (!list.length) { next(); return; }
  dlg = { lines: list, i: 0, n: 0 };
  dlgNext = next;
  mode = 'dialog';
  showLine();
}

function showLine() {
  const [who] = dlg.lines[dlg.i];
  const sp = SPEAKERS[who] || SPEAKERS.A;
  ui.dialog(sp, '', (pc) => drawPortrait(pc, who));
  dlg.n = 0;
}

function drawPortrait(pc, who) {
  const look = SPEAKERS[who]?.look || PLAYER;
  drawPerson(pc, 12, 34, look, 1, 0);
}

function updateDialog(dt) {
  const text = dlg.lines[dlg.i][1];
  const before = Math.floor(dlg.n);
  dlg.n = Math.min(text.length, dlg.n + dt * 70);
  if (Math.floor(dlg.n) !== before || dlg.n === text.length) ui.dialogText(text.slice(0, Math.floor(dlg.n)), dlg.n >= text.length);
  if (wasPressed('action') || wasPressed('up')) {
    if (dlg.n < text.length) { dlg.n = text.length; ui.dialogText(text, true); return; }
    dlg.i++;
    if (dlg.i >= dlg.lines.length) {
      ui.dialog(null);
      dlg = null;
      const n = dlgNext; dlgNext = null; n();
    } else showLine();
  }
}

function clearScene() {
  g.items = []; g.props = []; g.walkers = []; g.fallers = []; g.bubbles = []; g.npcs = [];
  ui.shout(null);
}

function snapCamera() { g.camX = clampCam(g.p.x - WIDTH / 2); }
function clampCam(x) { return Math.max(0, Math.min(g.level.width - WIDTH, x)); }

export function startStory(fromBeat = 0) {
  g.stats = newStats();
  g.done = new Set();
  for (let i = 0; i < fromBeat; i++) if (STORY[i]?.play) g.done.add(STORY[i].play);
  ui.card(false);
  startBeat(fromBeat);
}

// ---- Dev menu jumps (see src/devmeny.js) -------------------------------------------
function resetFlow() {
  dlg = null; dlgNext = null; cardNext = null;
  ui.dialog(null); ui.card(false); ui.shout(null);
}

// Jump to story beat i. direct = go straight into its minigame, otherwise play the beat from its start.
export function devJump(i, direct = true) {
  resetFlow();
  g.stats = newStats();
  g.done = new Set();
  for (let k = 0; k < i; k++) if (STORY[k]?.play) g.done.add(STORY[k].play);
  const b = STORY[i];
  if (direct && b?.play) {
    beatIndex = i;
    enterMinigame(b.play);
  } else startBeat(i);
}

// Play any minigame, also ones that are not part of the story yet.
export function devPlay(id) {
  resetFlow();
  const i = STORY.findIndex((b) => b.play === id);
  if (i >= 0) { devJump(i, true); return; }
  enterMinigame(id);
}

// ---- The red "TRYCK INTE" button (src/knappen.js): you lose, then the game starts over ----
let lostT = 0;
export function pressedForbidden() {
  if (mode === 'lost') return;
  resetFlow();
  mode = 'lost';
  lostT = 0;
  const l = pick(FORBIDDEN);
  ui.card(true, { top: 'Du förlorade!', title: l.title, sub: l.sub, hint: 'Spelet börjar om...', lost: true });
}

function updateLost(dt) {
  lostT += dt;
  if (lostT > 6 || (lostT > 1.5 && wasPressed('action'))) {
    ui.card(false);
    mg = null;
    startStory();
  }
}

// For testing: lets the console and scripts look at the game state.
export const debug = { g, get mode() { return mode; }, get minigame() { return mg?.id; } };

function startBeat(i) {
  beatIndex = i;
  const b = beat();
  if (!STORY[i]) { endGame(); return; }
  const info = { top: b.clock, title: b.title };
  if (b.play && b.auto) { // go straight into the minigame (e.g. the prologue on the Moon)
    setupMinigame(b.play);
    showCard(info, () => talk(b.before, () => talk(mg.intro, () => { mode = 'play'; })));
    return;
  }
  enterHub(i === 0 ? HUB.start : null);
  showCard(info, () => talk(b.before, () => {
    if (b.play) mode = 'hub'; else endGame();
  }));
}

function enterHub(x) {
  const cameFromElsewhere = mg != null || g.level !== haga;
  mg = null;
  clearScene();
  g.level = haga;
  if (x != null || cameFromElsewhere) g.p = createPlayer(x ?? HUB.start);
  const next = MINIGAMES[beat().play]?.station;
  g.henrik = { x: next ? next.x + 26 : g.p.x + 30, facing: -1, target: null };
  snapCamera();
}

function setupMinigame(id) {
  mg = MINIGAMES[id];
  clearScene();
  g.level = LEVELS[mg.level || 'haga'];
  g.p = createPlayer(mg.start ?? 100);
  g.henrik = mg.henrik != null ? { x: mg.henrik, facing: -1, target: null } : null;
  g.t = 0; g.left = mg.time || 0; g.count = 0; g.meter = 100; g.flags = {}; g.dodgedHere = 0;
  mg.setup?.(g);
  snapCamera();
}

function enterMinigame(id) {
  setupMinigame(id);
  showCard({ top: beat().clock, title: mg.title, sub: mg.tagline || '' },
    () => talk(mg.intro, () => { mode = 'play'; }));
}

function winMinigame() {
  ui.shout(null);
  mg.onWin?.(g);
  talk(mg.win, () => {
    g.done.add(mg.id);
    const station = mg.station;
    if (station) {
      enterHub(station.x);
      g.henrik.x = station.x + 26;
    }
    talk(beat().after, () => startBeat(beatIndex + 1));
  });
}

function failMinigame() {
  ui.shout(null);
  g.stats.retries++;
  talk(mg.fail, () => {
    const id = mg.id;
    setupMinigame(id);
    showCard({ top: beat().clock, title: 'Ett försök till!', sub: mg.title }, () => { mode = 'play'; }, 1.2);
  });
}

function endGame() {
  mode = 'end';
  ui.card(true, { top: 'Lunch till lunch', title: 'Du överlevde!', sub: END_STATS(g.stats), hint: 'Mellanslag: spela igen' });
}

// ---- Hub: walk around Haga and enter the next station ----------------------------
function stations() {
  return Object.values(MINIGAMES).filter((m) => m.station);
}

function updateHub(dt) {
  const nextId = beat().play;
  const next = MINIGAMES[nextId];
  if (next?.station) g.henrik.target = Math.min(g.level.width - 10, next.station.x + 26);

  nearStation = stations().find((m) => Math.abs(m.station.x - g.p.x) < 16) || null;
  if (nearStation && wasPressed('action')) {
    if (nearStation.id === nextId) { enterMinigame(nextId); return; }
    if (g.done.has(nearStation.id)) g.say(pick(HUB.alreadyDone), g.p, 'me', 2);
    else g.henrikSay(pick(HUB.notYet)(next?.station.label || 'lunch'));
  }

  barkT -= dt;
  if (barkT <= 0) { barkT = 8; g.henrikSay(pick(HUB.barks)); }
}

// ---- Minigame play -------------------------------------------------------------
function near(x, y, rx = 9, ry = 15) {
  return Math.abs(x - g.p.x) < rx && Math.abs(y - (g.p.y - 12)) < ry;
}

function updatePlay(dt) {
  g.t += dt;
  if (mg.cinematic && wasPressed('action')) { winMinigame(); return; }

  for (const it of g.items) {
    if (it.ttl != null) it.ttl -= dt;
    if (!it.gone && near(it.x, it.y)) {
      it.gone = true;
      if (mg.onCollect) mg.onCollect(g, it); else g.count++;
    }
  }
  g.items = g.items.filter((it) => !it.gone && (it.ttl == null || it.ttl > 0));

  for (const f of g.fallers) {
    f.y += f.vy * dt;
    if (!f.gone && near(f.x, f.y, 9, 14)) {
      f.gone = true;
      if (f.bad) {
        g.p.stun = Math.max(g.p.stun, f.stun ?? 0.9);
        g.stats.hits++;
        if (f.text) g.say(f.text, g.p, 'me', 1.6);
        mg.onHit?.(g, f);
      } else if (mg.onCatch) mg.onCatch(g, f); else g.count++;
    }
    if (f.y >= GROUND_Y - 4 && !f.gone) { f.gone = true; mg.onMiss?.(g, f); }
  }
  g.fallers = g.fallers.filter((f) => !f.gone);

  for (const w of g.walkers) {
    w.age += dt; w.t += dt;
    w.x += w.dir * w.speed * dt;
    const dist = Math.abs(w.x - g.p.x);
    if (!w.said && dist < 95) { w.said = true; g.say(w.line, w, '', 2.4); }
    if (!w.done) {
      if (dist < 8 && g.p.y > GROUND_Y - 22 && g.p.stun <= 0) {
        w.done = true;
        g.p.stun = 1.2;
        g.stats.meetings++;
        g.say(pick(STUCK_LINES), g.p, 'me', 1.4);
        w.dir = -w.dir; w.speed *= 1.8;
        mg.onWalkerHit?.(g, w);
      } else if (Math.sign(w.x - g.p.x) !== w.side && dist > 6) {
        w.done = true;
        g.stats.dodged++; g.dodgedHere++;
      }
    }
  }
  g.walkers = g.walkers.filter((w) => w.age < 1 || (w.x > g.camX - 60 && w.x < g.camX + WIDTH + 60));

  let result = mg.update?.(g, dt);
  if (!result && mg.time) {
    g.left -= dt;
    if (g.left <= 0) result = mg.timeoutWins ? 'win' : 'fail';
  }
  if (result === 'win') winMinigame();
  else if (result === 'fail') failMinigame();
}

// ---- Frame ---------------------------------------------------------------------
export function frame(ctx, dt) {
  g.time += dt;

  if (mode === 'title') {
    ui.card(true, {
      top: 'Haga slott · 24 timmar', title: 'LUNCH TILL LUNCH',
      sub: 'Ett spel om överlevnad, kaffe och agendapunkter', hint: 'Tryck mellanslag',
    });
    if (wasPressed('action')) { ui.card(false); startStory(); }
  } else if (mode === 'card') {
    cardT -= dt;
    if (cardT <= 0 || (cardT < cardMin && wasPressed('action'))) {
      ui.card(false);
      const n = cardNext; cardNext = null; n();
    }
  } else if (mode === 'dialog') updateDialog(dt);
  else if (mode === 'hub') updateHub(dt);
  else if (mode === 'play') updatePlay(dt);
  else if (mode === 'lost') updateLost(dt);
  else if (mode === 'end' && wasPressed('action')) { ui.card(false); startStory(); }

  const free = (mode === 'hub' || mode === 'play') && !mg?.lockPlayer && !mg?.cinematic;
  acc += dt;
  while (acc >= STEP) { updatePlayer(g.p, STEP, g.level, !free); acc -= STEP; }

  // Henrik walks to his target and otherwise looks at you
  const h = g.henrik;
  if (h) {
    h.walking = h.target != null && Math.abs(h.target - h.x) > 2;
    if (h.walking) { const d = Math.sign(h.target - h.x); h.x += d * 110 * dt; h.facing = d; }
    else h.facing = g.p.x < h.x ? -1 : 1;
  }

  // Pacing people
  for (const n of g.npcs) {
    n.t += dt;
    n.walking = false;
    if (n.patrol && !(mg?.lockNpcs && mode !== 'play')) {
      const [a, b] = n.patrol;
      if (n.x <= a) n.facing = 1;
      if (n.x >= b) n.facing = -1;
      n.x += n.facing * n.speed * dt;
      n.walking = true;
    } else if (!n.patrol) n.facing = g.p.x < n.x ? -1 : 1;
  }

  for (const b of g.bubbles) b.ttl -= dt;
  g.bubbles = g.bubbles.filter((b) => b.ttl > 0);

  g.camX += (clampCam(g.p.x - WIDTH / 2) - g.camX) * 0.12;
  draw(ctx);
  drawHud();
}

function draw(ctx) {
  const camX = g.camX, t = g.time;
  g.level.draw(ctx, camX, t);
  for (const pr of g.props) if (!pr.front) drawProp(ctx, pr.x - camX, pr, t);
  for (const n of g.npcs) drawPerson(ctx, n.x - camX, GROUND_Y, n.look, n.facing, n.t, n.walking);
  if (mode !== 'play' && !mg && g.level === haga) drawStations(ctx);
  for (const it of g.items) drawItem(ctx, it.x - camX, it.y, it, t);
  if (g.henrik) drawPerson(ctx, g.henrik.x - camX, GROUND_Y, HENRIK, g.henrik.facing, t, g.henrik.walking);
  for (const w of g.walkers) drawPerson(ctx, w.x - camX, GROUND_Y, w.look, w.dir, w.t, true);
  for (const f of g.fallers) drawItem(ctx, f.x - camX, f.y, f, t);
  g.p.hidden = !!mg?.cinematic;
  drawPlayer(ctx, g.p, camX, g.level.dustColor);
  for (const pr of g.props) if (pr.front) drawProp(ctx, pr.x - camX, pr, t);

  const tint = mg?.tint ?? beat().tint;
  if (tint) { ctx.fillStyle = tint; ctx.fillRect(0, 0, WIDTH, 180); }
  if (mg?.dark || (!mg && beat().dark)) {
    const px = g.p.x - camX, py = g.p.y - 14;
    const grad = ctx.createRadialGradient(px, py, 10, px, py, mg ? 62 : 120);
    grad.addColorStop(0, 'rgba(5,8,25,0)');
    grad.addColorStop(1, 'rgba(5,8,25,0.94)');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, WIDTH, 180);
  }
  if (mg?.draw && mode !== 'card') mg.draw(g, ctx);
  if (mg?.cinematic) { // letterbox bars for the film
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, WIDTH, 14); ctx.fillRect(0, 166, WIDTH, 14);
  }

  // Bubbles and station labels are HTML on top of the canvas
  const list = g.bubbles.map((b) => {
    const who = b.who;
    const isPlayer = who === g.p;
    const y = who.y != null && !isPlayer ? who.y : (isPlayer ? g.p.y - 30 : GROUND_Y - 33);
    return { text: b.text, x: who.x, y, style: b.style };
  });
  if (mode === 'hub' || (mode !== 'play' && !mg && g.level === haga)) {
    const nextId = beat().play;
    for (const m of stations()) {
      const style = 'station' + (m.id === nextId ? ' next' : '') + (g.done.has(m.id) ? ' done' : '');
      const label = (g.done.has(m.id) ? '✓ ' : '') + m.station.label;
      list.push({ text: label, x: m.station.x, y: GROUND_Y - 38, style });
    }
    if (mode === 'hub' && nearStation) {
      list.push({ text: nearStation.id === nextId ? 'Mellanslag: gå in' : '...', x: g.p.x, y: g.p.y - 30, style: 'me' });
    }
  }
  ui.bubbles(list, camX);
}

// A small doorway sign for each station, and a bouncing arrow over the next one.
function drawStations(ctx) {
  const nextId = beat().play;
  for (const m of stations()) {
    const x = Math.round(m.station.x - g.camX);
    if (x < -20 || x > WIDTH + 20) continue;
    ctx.fillStyle = '#6b4a30'; ctx.fillRect(x - 1, GROUND_Y - 30, 2, 30);
    ctx.fillStyle = m.id === nextId ? '#ffb838' : '#e8e2d0';
    ctx.fillRect(x - 6, GROUND_Y - 32, 12, 6);
    if (m.id === nextId && mode === 'hub') {
      const y = GROUND_Y - 62 + Math.round(Math.sin(g.time * 6) * 3);
      ctx.fillStyle = '#ffb838';
      ctx.fillRect(x - 1, y - 6, 3, 6); ctx.fillRect(x - 4, y, 9, 2); ctx.fillRect(x - 2, y + 2, 5, 2); ctx.fillRect(x, y + 4, 1, 1);
    }
  }
}

function drawHud() {
  const b = beat();
  ui.forbiddenButton(mode !== 'lost');
  if (mode === 'title' || mode === 'end' || mode === 'lost') { ui.hud({}); return; }
  if (mg) {
    ui.hud({
      clock: b.clock, goal: mode === 'play' ? (mg.goal?.(g) ?? '') : '',
      timer: mode === 'play' && mg.time && !mg.cinematic ? g.left : null,
      meter: mg.meter && mode === 'play' ? g.meter : null, meterLabel: mg.meter || '',
    });
  } else {
    const next = MINIGAMES[b.play];
    let goal = '';
    if (mode === 'hub' && next?.station) {
      const arrow = Math.abs(next.station.x - g.p.x) < 16 ? '▼' : next.station.x > g.p.x ? '→' : '←';
      goal = `Gå till ${next.station.label} ${arrow}`;
    }
    ui.hud({ clock: b.clock, goal });
  }
}
