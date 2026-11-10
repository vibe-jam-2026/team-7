// 16:30 Mingel: Kerstin från avdelning Kontrakt vill prata kontohantering.
// "Tryck inte på knappen", fast som metafor: tryck inte på Kerstins knappar.
// Varje runda säger Kerstin något och du väljer ett svar med ← ↑ →. Fel svar (eller tystnad)
// trycker in en av hennes tre röda knappar, som svävar ovanför huvudet. Tre intryckta: kaboom.
// Tre lugna, korrekta svar räcker för att vinna. Det avgörande tredje svaret är alltid LAST.
import { wasPressed } from '../input.js';
import { pick } from '../world.js';
import { KERSTIN } from '../sprites.js';

const KERSTIN_X = 345;
const ROUNDS_TOTAL = 8;   // frågor som finns i högen (fler än som behövs)
const CALM_NEEDED = 3;   // så många rätta svar krävs för att vinna
const BUTTONS = 3;
const KEYS = [['left', '←'], ['up', '↑'], ['right', '→']];

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
  f.pushed++;
  g.stats.buttons = (g.stats.buttons ?? 0) + 1;
  f.flash = 1; f.pressAnim[f.pushed - 1] = 0;
  g.sfx.buzzer(); g.sfx.error();
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

export default {
  id: 'kontrakt',
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
    f.pressAnim = []; f.steam = []; f.steamT = 0;
    f.kerstin = g.npc({ ...KERSTIN }, KERSTIN_X, { facing: -1, name: 'Kerstin' });
    g.p.facing = 1;
    nextRound(g);
  },

  update(g, dt) {
    const f = g.flags;
    f.flash = Math.max(0, f.flash - dt * 1.8);
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
  },

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
