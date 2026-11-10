// The story: lunch to lunch at Haga slott, told as a list of beats.
// Each beat has a clock, Henrik's lines before and after, and which minigame (station) comes next.
// Edit the text here freely. Lines are ['H', 'text'] (see SPEAKERS for who is who),
// or a function (g) => [...] when the line needs live numbers.
import { HENRIK, PLAYER, NATALIE, MARKUS, GUSTAV, KERSTIN, KATARINA, JOCKE, NIKKI } from './sprites.js';

export const SPEAKERS = {
  H: { name: 'Henrik Kauhanen', role: 'chefen', color: '#ffb838', look: HENRIK },
  D: { name: 'Du', role: 'utvecklare', color: '#9fd0ff', look: PLAYER },
  N: { name: 'Natalie', role: 'projektledare', color: '#ff9fc8', look: NATALIE },
  M: { name: 'Markus', role: 'projektledare', color: '#a8e08a', look: MARKUS },
  G: { name: 'Gustav', role: 'projektledare', color: '#c8b0ff', look: GUSTAV },
  K: { name: 'Kerstin', role: 'avdelning Kontrakt', color: '#ff7a6a', look: KERSTIN },
  KA: { name: 'Katarina', role: 'UX-designer', color: '#c9a2ff', look: KATARINA },
  J: { name: 'Jocke', role: 'UX-designer', color: '#c9a2ff', look: JOCKE },
  NI: { name: 'Nikki', role: 'UX-designer', color: '#c9a2ff', look: NIKKI },
};

// The UX designers who now and then chase you around the Haga hub (src/designers.js).
// shout = what they yell while running after you, pitch = what they say when they catch you,
// giveUp = what they say when you have jumped over them too many times.
export const DESIGNERS = {
  chaseEvery: [16, 28], // seconds in the hub between chases (random in this range)
  speed: 112,           // you walk at 95 px/s, so you have to jump over them
  people: [
    {
      who: 'KA', name: 'Katarina',
      shout: [
        'Har du fem sek?! Jag har 14 nya flöden!',
        'Användarflödet är TRASIGT! Jag har en ny happy path!',
        'Det är bara lo-fi! Men pixelperfekt!',
        'Min prototyp har 312 frames! Kolla!',
        'Användaren hittar inte knappen! Den måste bli mer... knappig!',
      ],
      pitch: [
        'Se här: onboarding i 11 steg. Nej, 12!',
        'Swipea här! Nej, inte där! Där är det en hover!',
        'Det här är user journeyn. Den gråter i steg 4.',
      ],
    },
    {
      who: 'J', name: 'Jocke',
      shout: [
        'Knappen ligger inte i 8-punktsgriden!',
        'Jag har gjort om hela designsystemet. IGEN!',
        'Hamburgermenyn är död! Leve kebabmenyn!',
        'Ni har hårdkodat #333! Det heter grey-900-alpha-80!',
        'Glassmorphism! Neumorphism! Allt-morphism!',
      ],
      pitch: [
        'Auto layout! AUTO LAYOUT! Ser du?!',
        'final_FINAL_v7_riktig_DENNA.fig',
        'Och här öppnas en modal. I en modal. I en modal.',
      ],
    },
    {
      who: 'NI', name: 'Nikki',
      shout: [
        'Jag pratade med EN användare och hon HATAR dropdowns!',
        'Kan vi flytta CTA:n tre pixlar? Strategiskt!',
        'Dark mode! Varför finns inget dark mode?!',
        'Jag har en persona! Han heter Kent! Kent är arg!',
        'Det är inte en bugg, det är UX-skuld!',
      ],
      pitch: [
        'Empatikartan säger att Kent vill ha konfetti.',
        'Jag har taggat dig i 40 kommentarer i Figma!',
        'Kan vi bara... A/B-testa hela appen? Idag?',
      ],
    },
  ],
  // What you say when one of them catches you
  stuck: ['Jag är backend...', 'Det ser... väldigt lila ut.', 'Kan du lägga det i Jira?', 'Snyggt! Absolut! Jag måste gå.', 'Är det där ens möjligt i CSS?'],
  giveUp: ['Jag lägger länken i Slack!', 'Jag bokar en design-crit kl 03!', 'Vänta tills du ser v8!', 'Jag taggar dig i Figma då!'],
  // Sometimes all three come at once
  rush: 'UX-RUSH! Alla tre har Figma-länkar!',
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
  Möten du hoppade över: ${s.dodged}<br>
  Möten du fastnade i: ${s.meetings}<br>
  Kerstins knappar du tryckte på: ${s.buttons ?? 0}<br>
  Figma-koncept du tvingades se: ${s.figma ?? 0}<br>
  UX-designers du hoppade över: ${s.uxDodged ?? 0}<br>
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
    play: 'workshop',
    before: [
      ['H', 'Välkomna till Haga slott! Lunch till lunch: 24 timmar ren effektivitet.'],
      ['D', 'Lunch till lunch. Det låter som... mest lunch?'],
      ['H', 'Agendan har 47 punkter. Jag har färgkodat dem. Ingen vet vad färgerna betyder.'],
      ['H', 'Lunchen har jag strukit. Och fikan. Vi tar igen det imorgon. Kanske.'],
      ['H', 'Punkt 1: workshop i flygeln. Vi ska ta fram framtiden. Jag har köpt 4 000 post-its.'],
    ],
  },
  {
    clock: 'Dag 1 · 16:30', title: 'Mingel på terrassen',
    play: 'kontrakt',
    before: [
      ['H', 'Mingel på terrassen! Nätverka över avdelningsgränserna. Det står i punkt 17.'],
      ['D', 'Jag tar ett glas vatten och står nära utgången.'],
      ['H', 'Kerstin från Kontrakt har frågat efter dig. Fyra gånger. Med en pärm.'],
      ['D', 'En pärm? Vad har jag gjort?'],
      ['H', 'Något med kontona. Ett tips: tryck inte på hennes knappar.'],
    ],
  },
  {
    clock: 'Dag 2 · 07:00', title: 'God morgon', tint: 'rgba(255,170,190,0.12)',
    play: 'energizer',
    before: [
      ['H', 'GOOOOD MORGON HAGA! Har alla sovit gott?'],
      ['D', 'Vänta, vad hände med middagen? Och natten?'],
      ['H', 'Strukna ur agendan. Effektivisering! Vi sov stående i mingelkön.'],
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
      ['H', 'Åtta idéer, sex träd och en demo. Och en ny tradition!'],
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
