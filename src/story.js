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
  Stress efter spat: 0 %<br>
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
    clock: 'Dag 2 · 09:30', title: 'Hållbarhetspunkten',
    play: 'trad',
    before: [
      ['H', 'Agendapunkt 31! Den är grön. Det betyder hållbarhet. Eller att jag fick slut på de andra pennorna.'],
      ['D', 'Vad ska vi göra?'],
      ['H', 'Plantera träd! Ut i parken, vid trädplanteringen. Spaden är redan där.'],
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
    clock: 'Dag 2 · 11:58', title: 'Agendapunkt 46,5',
    play: 'talt',
    before: [
      ['H', 'Två minuter till lunch! Men först: punkt 46,5. Den är i guld.'],
      ['D', 'Jag trodde demon var sista punkten.'],
      ['H', 'Jag lade till en halv: "Lyfta på tältet". Ut till Koppartälten!'],
      ['D', 'Är det en metafor?'],
      ['H', 'Det är ett tält.'],
    ],
  },
  {
    clock: 'Dag 2 · 12:00', title: 'Lunch. Igen.',
    before: [
      ['H', 'Och så var det lunch igen. Precis enligt agendan.'],
      ['H', 'Bra jobbat. Du överlevde lunch till lunch.'],
      ['D', 'Tack. Vad kom vi fram till?'],
      ['H', 'Åtta idéer, sex träd, noll kanelbullar och en demo. Och en ny tradition!'],
      ['H', 'Nästa år kör vi frukost till frukost.'],
      ['D', 'Jag tar bussen tillbaka. Det känns som att jag glömt något.'],
      ['H', 'Vänta! Agendapunkt 47. Den är vit. Det betyder: ingenting.'],
      ['H', 'Jag har bokat spat åt dig. Badrocken ligger framme. Stäng av mobilen.'],
      ['D', 'Spa? Inga slides? Ingen energizer?'],
      ['H', 'Inga slides. Ner till spat vid bryggan. Det är en order.'],
    ],
    play: 'spa',
    after: [
      ['H', '(från bastun) Nästa år: frukost till frukost. MED spa.'],
      ['D', 'Då kanske jag kommer.'],
    ],
  },
];

// Shown when someone presses the red "TRYCK INTE" button (src/knappen.js). One is picked at random.
export const FORBIDDEN = [
  { title: 'Du tryckte.', sub: 'Det stod TRYCK INTE. Med versaler. På svenska.<br>Henrik har bokat in dig på en kurs i att läsa instruktioner.' },
  { title: 'Oj.', sub: 'Du raderade precis hela 13.2-leveransen.<br>Natalie gråter. Markus gråter. Gustav har redan bytt jobb.' },
  { title: 'Kaboom.', sub: 'Haga slott är nu Haga ruin.<br>Henrik: "Vi kallar det en teambuildingövning."' },
  { title: 'GAME OVER', sub: 'Knappen var kopplad till brandlarmet.<br>Alla 140 kollegor står ute i regnet. I badrockar. De vet att det var du.' },
  { title: 'Grattis!', sub: 'Du har anmält dig som frivillig att planera nästa års<br>FRUKOST TILL FRUKOST.' },
  { title: 'Tryckt.', sub: 'Du skickade "ok" till hela bolaget. 2 000 personer.<br>Från Henriks mejl.' },
];
