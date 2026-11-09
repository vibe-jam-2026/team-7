// The story: lunch to lunch at Haga slott, told as a list of beats.
// Each beat has a clock, Henrik's lines before and after, and which minigame (station) comes next.
// Edit the text here freely. Lines are ['H', 'text'] (see SPEAKERS for who is who),
// or a function (g) => [...] when the line needs live numbers.
import { HENRIK, PLAYER, NATALIE, MARKUS, GUSTAV } from './sprites.js';

export const SPEAKERS = {
  H: { name: 'Henrik Kauhanen', role: 'chefen', color: '#ffb838', look: HENRIK },
  D: { name: 'Du', role: 'utvecklare', color: '#9fd0ff', look: PLAYER },
  N: { name: 'Natalie', role: 'projektledare', color: '#ff9fc8', look: NATALIE },
  M: { name: 'Markus', role: 'projektledare', color: '#a8e08a', look: MARKUS },
  G: { name: 'Gustav', role: 'projektledare', color: '#c8b0ff', look: GUSTAV },
};

export const HUB = {
  start: 50, // where you arrive at Haga
  // Henrik's chatter while you walk around the hub
  barks: [
    'Agendan väntar inte!',
    'Vi ligger 4 minuter efter. Det är 0,3 % av dygnet!',
    'Har alla fyllt i förväntningsenkäten?',
    'Kom ihåg: det finns inga dumma frågor. Bara dumma tider.',
    'Jag har en slide om att vara i tid.',
    'Hurra för oss! Det står på punkt 22.',
  ],
  notYet: [
    (next) => `Inte än! Agendan säger ${next}.`,
    (next) => `Den punkten är lila. Vi är på gul. ${next} först!`,
    (next) => `Snyggt initiativ, fel ordning. ${next}!`,
  ],
  alreadyDone: ['Den har jag redan klarat.', 'Aldrig igen.', 'Nej tack, jag är mätt på det.'],
};

// What you say when a colleague catches you
export const STUCK_LINES = ['...javisst, 5 minuter.', 'Fastnade i ett möte!', 'Kan vi ta det på mejl?', 'Mm. Mm. Spännande.'];

export const END_STATS = (s) => `
  Kaffekoppar: ${s.coffee}<br>
  Möten du hoppade över: ${s.dodged}<br>
  Möten du fastnade i: ${s.meetings}<br>
  Kanelbullar ätna: 0<br>
  Slides i Henriks tal: 83<br>
  Omtag: ${s.retries}`;

export const STORY = [
  {
    clock: 'Dag 1 · 10:47', title: 'Kontoret',
    play: 'kontoret', auto: true,
    before: [
      ['N', 'HUR GÅR DET MED 13.2?! Kunden har ringt sju gånger!'],
      ['M', 'Testmiljön är nere! Eller uppe! Den blinkar!'],
      ['G', 'Jag har flyttat deadline till igår. Hoppas det är okej!'],
      ['D', 'Jag kodar så fort jag kan...'],
      ['N', 'KODA FORTARE!'],
    ],
  },
  {
    clock: 'Dag 1 · 11:15', title: 'Bussen till Haga',
    play: 'bussen', auto: true,
  },
  {
    clock: 'Dag 1 · 12:00', title: 'Ankomst Haga slott',
    play: 'buffe',
    before: [
      ['H', 'Välkomna till Haga slott! Lunch till lunch: 24 timmar ren effektivitet.'],
      ['D', 'Lunch till lunch. Det låter som... mest lunch?'],
      ['H', 'Två luncher. Däremellan: workshop, fika, middag, tal, natt och energizer klockan sju.'],
      ['H', 'Agendan har 47 punkter. Jag har färgkodat dem. Ingen vet vad färgerna betyder.'],
      ['H', 'Punkt 1: lunch. Följ pilen till buffén. Spring!'],
    ],
  },
  {
    clock: 'Dag 1 · 13:00', title: 'Eftermiddagspasset',
    play: 'workshop',
    before: [
      ['H', 'Mätta? Bra. Nu: workshop i flygeln. Vi ska ta fram framtiden.'],
      ['D', 'Hela framtiden? Före fika?'],
      ['H', 'Vi har en timme. Jag har köpt 4 000 post-its.'],
    ],
  },
  {
    clock: 'Dag 1 · 15:00', title: 'Fika',
    play: 'fika',
    before: [
      ['H', 'FIKA! Nere vid bryggan. Det finns kaffe och EN kanelbulle kvar.'],
      ['D', 'En bulle? Till hela teamet?'],
      ['H', 'Jag kallar det resursoptimering.'],
    ],
  },
  {
    clock: 'Dag 1 · 19:00', title: 'Middag', tint: 'rgba(255,120,40,0.16)',
    play: 'middag',
    before: [
      ['H', 'Middag i stora salen! Trerätters, och mellan varje rätt: mitt tal.'],
      ['D', 'Hur långt är talet?'],
      ['H', 'Kort! 83 slides. Ett par av dem har video. En har en egen agenda.'],
    ],
  },
  {
    clock: 'Dag 1 · 23:47', title: 'Natten', tint: 'rgba(10,20,70,0.35)', dark: true,
    play: 'natt',
    before: [
      ['D', 'Talet tog slut. Jag tror jag åldrades. Nu: sängen.'],
      ['D', '...där rumsnyckeln borde ha legat. Den är borta.'],
      ['H', '(från bastun) ALLSÅNGEN BÖRJAR OM FEM MINUTER! ALLA SKA MED!'],
      ['D', 'Jag letar i parken. Med mobilens ficklampa. 4 % batteri.'],
    ],
  },
  {
    clock: 'Dag 2 · 07:00', title: 'God morgon', tint: 'rgba(255,170,190,0.12)',
    play: 'energizer',
    before: [
      ['H', 'GOOOOD MORGON HAGA! Har alla sovit gott?'],
      ['D', 'Jag sov fyra timmar. Två av dem i en allsång.'],
      ['H', 'Perfekt! Då är du redo för ENERGIZERN. Ut på gräsmattan!'],
    ],
  },
  {
    clock: 'Dag 2 · 11:52', title: 'Strax före lunch',
    play: 'demo',
    before: [
      ['H', 'Sista punkten före lunch: demon för ledningsgruppen.'],
      ['D', 'Vilken demo?'],
      ['H', 'Din. Det stod i punkt 46. Lila. In i stora salen!'],
    ],
  },
  {
    clock: 'Dag 2 · 12:00', title: 'Lunch. Igen.',
    before: [
      ['H', 'Och så var det lunch igen. Precis enligt agendan.'],
      ['H', 'Bra jobbat. Du överlevde lunch till lunch.'],
      ['D', 'Tack. Vad kom vi fram till?'],
      ['H', 'Åtta idéer, noll kanelbullar och en demo. Och en ny tradition!'],
      ['H', 'Nästa år kör vi frukost till frukost.'],
      ['D', 'Jag tar bussen tillbaka. Det känns som att jag glömt något.'],
      ['N', '13.2!!! HUR GÅR DET MED 13.2?!'],
    ],
  },
];
