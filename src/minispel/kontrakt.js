// 16:30 Mingel: Kerstin från avdelning Kontrakt vill prata kontohantering.
// "Tryck inte på knappen", fast som metafor: tryck inte på Kerstins knappar.
// Varje runda säger Kerstin något och du väljer ett svar med ← ↑ →. Fel svar (eller tystnad)
// trycker in en av hennes tre röda knappar, som svävar ovanför huvudet. Tre intryckta: kaboom.
// Tre lugna, korrekta svar räcker för att vinna. Det avgörande tredje svaret är alltid LAST.
import { wasPressed } from '../input.js';
import { pick, rand, WIDTH as W, HEIGHT as H } from '../world.js';
import { KERSTIN } from '../sprites.js';
import { power } from '../powerups.js';

const KERSTIN_X = 345;
const ROUNDS_TOTAL = 8;   // frågor som finns i högen (fler än som behövs)
const CALM_NEEDED = 3;   // så många rätta svar krävs för att vinna
const BUTTONS = 3;
const KEYS = [['left', '←'], ['up', '↑'], ['right', '→']];
// When you answer wrong: the camera zooms in on Kerstin, the screen shakes and she thinks "TRIGGERED"
const ZOOM = 2.5;          // how far in we zoom
const HEAD_Y = 129;        // Kerstin's face (world y) ...
const FOCUS = [118, 112];  // ... ends up here on screen, with room for the thought bubble to the right
const TRIG_WORDS = ['TRIGGERED', 'TRIGGERED!!', 'TRIGGERED!!!'];
const ease = (k) => 1 - (1 - k) ** 3;
let zoomCanvas = null;     // a copy of the frame, scaled up

// good: det lugna, korrekta svaret. bad: [svar, Kerstins reaktion].
const FIRST = [
  {
    q: 'Hej. Faktura 4471. Den saknar avtalsnummer.',
    good: 'Oj, förlåt! Jag letar upp avtalsnumret direkt.',
    bad: [
      ['Räcker det inte att vi vet vilket avtal det är?', 'VI VET INGENTING UTAN AVTALSNUMMER.'],
      ['Jag skrev "se mejl" i referensfältet.', '"SE MEJL"?! Vilket mejl?! Det finns 40 000 mejl!'],
    ],
  },
  {
    q: 'Den är konterad på 6990. Övriga externa kostnader.',
    good: 'Vilket konto borde den ligga på? Jag rättar.',
    bad: [
      ['Övrigt är ju bra, där får allt plats!', 'ÖVRIGT ÄR INTE ETT KONTO. ÖVRIGT ÄR ETT NEDERLAG.'],
      ['Är inte allt bara pengar i slutändan?', 'Säg det till revisorn. Säg det TILL REVISORN.'],
    ],
  },
  {
    q: 'Kostnadsstället är "Henrik". Det är inte ett kostnadsställe. Det är en person.',
    good: 'Rätt, det ska vara 4120 Leverans. Jag ändrar.',
    bad: [
      ['Henrik sa att han ÄR kostnadsstället.', 'Henrik är en kostnad. Inte ett ställe.'],
      ['Jag tog det som stod först i listan.', 'Listan är I BOKSTAVSORDNING!'],
    ],
  },
];

const MIDDLE = [
  {
    q: 'Projektnumret står som "13.2".',
    good: 'Jag hämtar rätt projektnummer från projektregistret.',
    bad: [
      ['Alla vet ju vad 13.2 är!', 'Systemet vet inte. Systemet har inga KÄNSLOR.'],
      ['Vi kan döpa om det till 13.2-final-v3?', 'Det där var en knapp. Jag hörde den.'],
    ],
  },
  {
    q: 'Momsen ligger på 2640. Det här är omvänd skattskyldighet.',
    good: 'Då flyttar jag den till rätt momskonto. Tack för att du såg det.',
    bad: [
      ['Moms är moms, typ?', 'TYP?! Skatteverket säger inte "typ"!'],
      ['Vi jämnar väl ut det i december?', 'December. DECEMBER. Vet du vad som händer i december?!'],
    ],
  },
  {
    q: 'Avtalet gick ut 31 mars. Fakturan gäller april.',
    good: 'Då behöver vi en förlängning. Jag pratar med avtalsägaren.',
    bad: [
      ['Avtal är mer som riktlinjer.', 'Avtal är AVTAL. Det står i ordet!'],
      ['Det är ett muntligt avtal, vi känner varandra!', 'Muntligt. Konterat på vad? LUFT?!'],
    ],
  },
  {
    q: 'Vem har attesterat? Det står bara en smiley.',
    good: 'Budgetansvarig ska attestera. Jag skickar den rätt väg.',
    bad: [
      ['Smileyn är Henriks. Han attesterar med känsla.', 'En smiley är inte en attest. Det är ett HÅN.'],
      ['Jag attesterade själv. Det kändes rätt.', 'Du kan inte attestera din egen... NEJ. NEJ NEJ NEJ.'],
    ],
  },
  {
    q: 'Jag har 340 fakturor i kön. Alla på "Övrigt".',
    good: 'Kan jag hjälpa till? Visa hur du vill ha dem konterade.',
    bad: [
      ['Har du testat att sortera på datum?', 'HAR JAG TESTAT ATT SORTERA PÅ DATUM?!'],
      ['Lugna dig, det är bara siffror.', 'Säg aldrig "lugna dig". ALDRIG.'],
    ],
  },
  {
    q: 'Excelarket "konton_NY_slutgiltig(2).xlsx". Vem gjorde det?',
    good: 'Ingen aning, men allt borde in i ekonomisystemet.',
    bad: [
      ['Jag! Jag lade till en flik som heter "Diverse".', 'DIVERSE. Det är Övrigt i en lösmustasch.'],
      ['Det är vår nya kontoplan. Den är mer agil.', 'Kontoplanen heter BAS. Den är inte AGIL.'],
    ],
  },
];

const LAST = {
  q: 'Ska vi gå igenom hela kontoplanen tillsammans? Nu. Under mingelt.',
  good: '...Gärna. Ordning och reda.',
  bad: [
    ['Kan vi ta det offline?', 'Vi ÄR offline. Vi är på ett SLOTT.'],
    ['Låter som en uppgift för AI.', 'AI:n konterade allt på Övrigt. JAG HAR SETT DET.'],
  ],
};

const CALM = ['...Tack.', 'Bra. Fortsätt så.', 'Hm. Korrekt.', 'Äntligen någon som lyssnar.', 'Ja. JA. Precis så.'];
const SILENCE = ['Tystnad?! Det tolkar jag som "Övrigt".', 'Svara! Klockan tickar. Räntan också.', 'Du tittar bort. Precis som kontoplanen.'];
const HENRIK_PUSH = ['Härligt engagemang!', 'Så ska det låta! Passion!', 'Det här är nätverkande!', 'Jag skriver upp det som "dialog".'];

const shuffle = (a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

function nextRound(g) {
  const f = g.flags;
  const r = f.rounds[f.round];
  const opts = shuffle([{ text: r.good, good: true }, ...r.bad.map(([text, react]) => ({ text, react }))]);
  f.cur = { q: r.q, opts };
  f.phase = 'typing'; f.n = 0; f.picked = -1; f.mood = '';
  f.limit = Math.max(4.5, 9 - f.round * 0.6); // it gets more intense
  f.left = f.limit;
  g.sfx.chatter('K', 5);
}

function react(g, text, good) {
  const f = g.flags;
  f.phase = 'react'; f.wait = good ? 1.3 : 2.1;
  f.cur.q = text; f.mood = good ? 'calm' : 'angry';
  if (good) { f.calm++; g.sfx.ding(); return; }
  if (power.shield > 0) { // "Uppåt, framåt!" shield: this wrong answer doesn't count, but it uses up the shield
    power.shield = 0;
    f.mood = 'calm';
    f.cur.q = 'Uppåt, framåt? Jaha. Vi går vidare, då. Men jag har antecknat det.';
    g.sfx.whoosh();
    return;
  }
  f.pushed++;
  g.stats.buttons = (g.stats.buttons ?? 0) + 1;
  f.flash = 1; f.pressAnim[f.pushed - 1] = 0;
  f.wait += 0.4; // a little longer, so the zoom gets to shine
  f.trig = { t: 0, dur: f.wait, word: TRIG_WORDS[Math.min(f.pushed, TRIG_WORDS.length) - 1], lines: [] };
  g.sfx.buzzer(); g.sfx.error(); g.sfx.siren();
  if (g.henrik && Math.random() < 0.6) g.henrikSay(pick(HENRIK_PUSH), 1.8);
}

function choose(g, i) {
  const f = g.flags;
  if (f.phase !== 'choose') return;
  f.picked = i;
  const o = f.cur.opts[i];
  react(g, o.good ? pick(CALM) : o.react, !!o.good);
}

// Kerstin gets redder for every button pushed
function mix(a, b, k) {
  const p = (s, i) => parseInt(s.slice(1 + i * 2, 3 + i * 2), 16);
  return '#' + [0, 1, 2].map((i) => Math.round(p(a, i) + (p(b, i) - p(a, i)) * k).toString(16).padStart(2, '0')).join('');
}

// Zoom in on Kerstin, shake everything, speed lines, and a thought bubble: TRIGGERED
function drawTriggered(g, ctx, f) {
  const T = f.trig.t, d = f.trig.dur;
  const k = ease(Math.min(1, T / 0.14)) * Math.min(1, (d - T) / 0.3);
  const z = 1 + (ZOOM - 1) * k + Math.sin(T * 40) * 0.04 * k;
  const fx = f.kerstin.x - g.camX;
  const sx = Math.max(0, Math.min(W - W / z, fx - FOCUS[0] / z));
  const sy = Math.max(0, Math.min(H - H / z, HEAD_Y - FOCUS[1] / z));
  const amp = (T < 0.5 ? 7 : 3.5) * k + 1;
  const ox = Math.round(rand(-amp, amp)), oy = Math.round(rand(-amp, amp));
  zoomCanvas ??= Object.assign(document.createElement('canvas'), { width: W, height: H });
  const zc = zoomCanvas.getContext('2d');
  zc.drawImage(ctx.canvas, 0, 0, W, H, 0, 0, W, H);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  ctx.drawImage(zoomCanvas, sx, sy, W / z, H / z, ox, oy, W, H);
  // Where her head is on screen now
  const hx = (fx - sx) * z + ox, hy = (HEAD_Y - sy) * z + oy;
  // Red pulse and speed lines rushing in towards her
  const pulse = 0.18 + 0.12 * Math.sin(T * 30);
  const grad = ctx.createRadialGradient(hx, hy, 20, hx, hy, 220);
  grad.addColorStop(0, 'rgba(255,0,0,0)'); grad.addColorStop(1, `rgba(200,0,0,${(pulse + 0.25) * k})`);
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = `rgba(255,255,255,${0.55 * k})`; ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 28; i++) {
    const a = rand(0, Math.PI * 2), r0 = rand(60, 110), r1 = r0 + rand(40, 120);
    ctx.moveTo(hx + Math.cos(a) * r0, hy + Math.sin(a) * r0);
    ctx.lineTo(hx + Math.cos(a) * r1, hy + Math.sin(a) * r1);
  }
  ctx.stroke();
  // Thought bubble to the right of her head: three little puffs, then the cloud
  if (T > 0.1) {
    const pop = Math.min(1, (T - 0.1) / 0.12);
    const bx = Math.round(hx + 92 + rand(-1.5, 1.5)), by = Math.round(hy - 6 + rand(-1.5, 1.5));
    const cloud = (x, y, r) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); };
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#1e1b22'; ctx.lineWidth = 2;
    [[22, -6, 3], [34, -10, 4.5], [48, -12, 6]].forEach(([dx, dy, r]) => cloud(hx + dx, hy + dy, r * pop));
    const puffs = [[-40, 0, 13], [-24, -10, 15], [-4, -12, 16], [18, -10, 15], [36, -2, 13], [24, 9, 13], [0, 11, 14], [-24, 9, 13]];
    for (const [dx, dy, r] of puffs) cloud(bx + dx * pop, by + dy * pop, r * pop);
    ctx.lineWidth = 0;
    for (const [dx, dy, r] of puffs) { ctx.beginPath(); ctx.arc(bx + dx * pop, by + dy * pop, (r - 1.5) * pop, 0, Math.PI * 2); ctx.fill(); }
    // The word, wobbling and flashing red
    const big = 1 + 0.12 * Math.sin(T * 26);
    ctx.font = `${Math.round(9 * big * pop)}px 'Press Start 2P', monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const word = f.trig.word;
    ctx.fillStyle = '#1e1b22'; ctx.fillText(word, bx + 1 + rand(-1, 1), by + 2 + rand(-1, 1));
    ctx.fillStyle = Math.floor(T * 12) % 2 ? '#ff2a2a' : '#c40000';
    ctx.fillText(word, bx + rand(-1, 1), by + 1 + rand(-1, 1));
  }
  ctx.restore();
}

export default {
  id: 'kontrakt',
  powerups: ['slow', 'shield'], // more time to answer; the shield saves you from one wrong answer
  powerupText: {
    slow: 'Kerstin pratar i slowmotion i 6 sekunder. Mer betänketid!',
    shield: 'Ditt nästa felsvar räknas inte. Kerstin går uppåt, framåt.',
  }, // what the power-ups mean here
  title: 'Tryck inte på knapparna',
  tagline: 'Kerstin från Kontrakt vill prata kontohantering.',
  station: { x: 330, label: 'Terrassen' },
  start: 305,
  henrik: 440,
  lockPlayer: true, // piltangenterna väljer svar
  intro: [
    ['K', 'Hej. Kerstin, avdelning Kontrakt. Vi behöver prata om kontohanteringen.'],
    ['D', '(Henrik sa en sak om Kerstin: "Tryck inte på hennes knappar.")'],
    ['K', 'Jag har tre knappar kvar. De andra trycktes in under bokslutet 2019.'],
    ['K', 'Och rör INTE den röda knappen där uppe. Den går direkt till huvudboken.'],
    ['D', '(Svara med ← ↑ →. Lugnt. Korrekt. Med rätt kontonummer.)'],
  ],
  goal: (g) => `Rätta svar: ${g.flags.calm}/${CALM_NEEDED} · Knappar intryckta: ${g.flags.pushed}/${BUTTONS}`,

  setup(g) {
    const f = g.flags;
    f.rounds = [...FIRST, ...shuffle(MIDDLE).slice(0, ROUNDS_TOTAL - FIRST.length - 1)];
    f.lastUsed = false;
    f.round = 0; f.pushed = 0; f.calm = 0; f.flash = 0;
    f.pressAnim = []; f.steam = []; f.steamT = 0; f.trig = null;
    f.kerstin = g.npc({ ...KERSTIN }, KERSTIN_X, { facing: -1, name: 'Kerstin' });
    g.p.facing = 1;
    nextRound(g);
  },

  update(g, dt) {
    const f = g.flags;
    f.flash = Math.max(0, f.flash - dt * 1.8);
    if (f.trig && (f.trig.t += dt) >= f.trig.dur) f.trig = null;
    if (f.trig) { // extra steam bursting out while triggered
      if (Math.random() < 0.35) f.steam.push({ x: f.kerstin.x + (Math.random() < 0.5 ? -5 : 6), y: 118, age: 0.3 });
    }
    f.pressAnim = f.pressAnim.map((a) => a + dt);
    f.kerstin.look.skin = mix(KERSTIN.skin, '#e04a3a', Math.min(1, f.pushed / BUTTONS + f.flash * 0.3));

    // Steam from the ears once two buttons are pushed
    f.steamT -= dt;
    if (f.pushed >= 2 && f.steamT <= 0) {
      f.steamT = 0.25;
      f.steam.push({ x: f.kerstin.x + (Math.random() < 0.5 ? -4 : 5), y: 124, age: 0 });
    }
    for (const s of f.steam) { s.age += dt; s.y -= 14 * dt; s.x += Math.sin(s.age * 6) * 0.3; }
    f.steam = f.steam.filter((s) => s.age < 1.2);

    if (f.phase === 'typing') {
      const before = Math.floor(f.n);
      f.n = Math.min(f.cur.q.length, f.n + dt * 55);
      if (Math.floor(f.n) !== before && Math.floor(f.n) % 3 === 0) g.sfx.blip('K');
      if (KEYS.some(([k]) => wasPressed(k))) f.n = f.cur.q.length;
      if (f.n >= f.cur.q.length) f.phase = 'choose';
    } else if (f.phase === 'choose') {
      const i = KEYS.findIndex(([k]) => wasPressed(k));
      if (i >= 0) choose(g, i);
      else {
        const before = Math.ceil(f.left);
        f.left -= dt;
        if (Math.ceil(f.left) !== before && before <= 3) g.sfx.tick();
        if (f.left <= 0) { f.picked = -1; react(g, pick(SILENCE), false); }
      }
    } else if (f.phase === 'react') {
      f.wait -= dt;
      if (f.wait <= 0) {
        if (f.pushed >= BUTTONS) return 'fail';
        if (f.calm >= CALM_NEEDED) return 'win';
        f.round++;
        // One right answer left: the next question is the big one (the whole chart of accounts)
        if (f.calm === CALM_NEEDED - 1 && !f.lastUsed) { f.rounds.splice(f.round, 0, LAST); f.lastUsed = true; }
        if (f.round >= f.rounds.length) f.rounds.push(pick(MIDDLE));
        nextRound(g);
      }
    }

    // The dialogue panel (HTML on top of the canvas)
    const show = f.phase !== 'typing';
    g.choices({
      who: 'Kerstin · avdelning Kontrakt',
      text: f.phase === 'typing' ? f.cur.q.slice(0, Math.floor(f.n)) : f.cur.q,
      mood: f.mood,
      options: f.cur.opts.map((o, i) => ({
        key: KEYS[i][1], text: o.text,
        state: !show ? 'hidden' : f.picked === i ? (o.good ? 'good' : 'bad') : f.phase === 'react' ? 'dim' : '',
      })),
      bar: f.phase === 'choose' ? f.left / f.limit : f.phase === 'typing' ? 1 : null,
    }, (i) => choose(g, i));
  },

  // Kerstin's three red buttons, floating above the head, and a red flash when one is pushed
  draw(g, ctx) {
    const f = g.flags;
    const r = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
    const cx = Math.round(f.kerstin.x - g.camX);
    const top = 92 + Math.round(Math.sin(g.t * 2) * 1.5);
    // Wires down to the head
    for (let y = top + 12; y < 120; y += 2) r(cx, y, 1, 1, '#1e1b22');
    r(cx - 21, top + 5, 42, 8, '#1e1b22');
    r(cx - 20, top + 6, 40, 6, '#8a8f9c');
    r(cx - 20, top + 6, 40, 1, '#b9bec8');
    for (let i = 0; i < BUTTONS; i++) {
      const bx = cx - 17 + i * 12;
      const pushed = i < f.pushed;
      const age = f.pressAnim[i] ?? 9;
      if (pushed) {
        const blink = Math.sin(g.t * 14 + i) > 0;
        if (age < 0.6) { // glow ring right after the press
          ctx.fillStyle = `rgba(255,80,60,${0.6 - age})`;
          ctx.fillRect(bx - 4, top - 2, 18, 12);
        }
        r(bx - 1, top + 3, 12, 4, '#1e1b22');
        r(bx, top + 4, 10, 2, blink ? '#ff5a4a' : '#9c1c1c');
      } else {
        r(bx - 1, top - 1, 12, 8, '#1e1b22');
        r(bx, top, 10, 6, '#d42a2a');
        r(bx + 1, top + 1, 8, 1, '#ff7a6a');
        r(bx + 1, top + 5, 8, 1, '#8e1414');
      }
    }
    for (const s of f.steam) {
      ctx.fillStyle = `rgba(255,255,255,${0.75 * (1 - s.age / 1.2)})`;
      const w = 2 + Math.round(s.age * 3);
      ctx.fillRect(Math.round(s.x - g.camX - w / 2), Math.round(s.y), w, w);
    }
    if (f.flash > 0) { ctx.fillStyle = `rgba(220,20,20,${f.flash * 0.3})`; ctx.fillRect(0, 0, 320, 180); }
    if (f.trig) drawTriggered(g, ctx, f);
  },

  // While Kerstin is triggered the camera is zoomed in, so the HTML name tags would end up in the wrong place
  hideTags: (g) => !!g.flags.trig,

  win: [
    ['K', '...Rätt konto. Rätt kostnadsställe. Rätt projektnummer.'],
    ['K', 'Jag behöver sitta ner. Ingen har konterat rätt sedan 2019.'],
    ['H', 'Härligt! Två avdelningar som möts. Det står i punkt 17. Orange.'],
    ['D', 'Jag har aldrig varit så rädd för ett kontonummer.'],
  ],
  fail: [
    ['K', 'NU. RÄCKER. DET.'],
    ['K', 'Jag konterar DIG på 6990. Övriga externa kostnader. Ingen attest.'],
    ['H', 'Oj! Vi tar ett djupt andetag och börjar om från faktura 4471.'],
  ],
};
