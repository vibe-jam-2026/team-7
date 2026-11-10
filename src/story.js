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

// Names on the name tags of the colleagues who walk up to you ("har du fem minuter?")
export const COLLEAGUE_NAMES = ['Anders', 'Maria', 'Johan', 'Sara', 'Mikael', 'Emma', 'Peter', 'Linda', 'Fredrik', 'Åsa', 'Mats', 'Elin'];

// The UX designers who now and then chase you around the Haga hub (src/designers.js).
// They ALWAYS come as a group: Jocke, Katarina and Nikki. They take turns talking (one bubble at a time)
// so there is time to read. shout = what they yell while running after you,
// pitch = group conversations when they catch you (lines of [who, text]; 'me' is you),
// giveUp = what they say when you have jumped over them too many times.
export const DESIGNERS = {
  chaseEvery: [18, 30], // seconds in the hub between chases (random in this range)
  speed: 55,            // a slow jog (you walk at 95 px/s) so their lines can be read; stand still and they catch you
  lineTime: 3.2,        // seconds each chase line stays up (and the gap until the next one)
  pitchLine: 2.6,       // seconds per line in the group pitch
  order: ['J', 'KA', 'NI'], // the order they run in: Jocke first
  people: [
    {
      who: 'J', name: 'Jocke',
      shout: [
        'STOPP! Din padding är 7px! SJU! Det finns inte i 8-punktsgriden!',
        'Vi måste få inUniform-ramverket IGÅR!',
        'Någon har satt margin-left: 13px. Jag gråter. Jag GRÅTER.',
        'Ni har hårdkodat #333! Det heter grey-900-alpha-80!',
        'Margin collapse är inte en feature! Det är ett SVEK!',
        'Jag har gjort om hela designsystemet. IGEN! Med inUniform!',
        'Vem centrerade det där med &nbsp;?! VEM?!',
      ],
    },
    {
      who: 'KA', name: 'Katarina',
      shout: [
        'Whitespace är inte tomrum! Det är ANDNING!',
        'inUniform-tokens! Har ni ens LÄST tokens-sidan?!',
        'Rubriken har 2px för lite luft ovanför! Användarna KÄNNER det!',
        'Det är bara lo-fi! Men pixelperfekt!',
        'Användaren hittar inte knappen! Den behöver mer margin-bottom!',
        'Varför är det negativ marginal på footern?! Varför?!',
      ],
    },
    {
      who: 'NI', name: 'Nikki',
      shout: [
        'Jag pratade med EN användare och hon HATAR 12px gutter!',
        'Kan vi flytta CTA:n tre pixlar? Strategiskt!',
        'Kent, vår persona, har ångest av ojämna marginaler!',
        'inUniform skulle ha löst det här! Om vi hade det! IGÅR!',
        'Det är inte en bugg, det är marginalskuld!',
        'Line-height 1.2?! Är vi djur?!',
      ],
    },
  ],
  // Lines when they skid past you and turn around
  turn: [
    'Vänta! Din margin-right sticker ut!',
    'Bara EN frame till!',
    'Hallå?! Spacing-feedback!',
    'Du missade hover-staten!',
    'Du hoppade med fel easing-kurva!',
    'Det där hoppet var inte på griden!',
  ],
  // Group conversations when they catch you. 'me' = you.
  pitch: [
    [
      ['J', 'Okej. Titta på den här knappen. Vad ser du?'],
      ['me', 'En... knapp?'],
      ['KA', 'FEL! Du ser 14px padding. Det ska vara 16!'],
      ['NI', 'Kent såg det också. Kent grät.'],
      ['J', 'Med inUniform hade det här varit en token. space-400.'],
      ['me', 'Kan du lägga det i Jira?'],
      ['KA', 'Det LIGGER i Jira. Med fel marginaler.'],
    ],
    [
      ['KA', 'Vi har en fråga. Bara en. Snabb.'],
      ['NI', 'Varför finns inte inUniform-ramverket i produktion?'],
      ['J', 'Vi behövde det IGÅR. Förrgår, egentligen.'],
      ['me', 'Det finns inte ens än...'],
      ['J', 'Exakt! Det är DET som är problemet!'],
      ['KA', 'Jag har 340 frames som förutsätter det.'],
      ['NI', 'Och en persona som kräver det. Kent.'],
    ],
    [
      ['NI', 'Kolla den här sidan. Ser du marginalerna?'],
      ['J', 'Vänster: 24px. Höger: 23px. TJUGOTRE.'],
      ['KA', 'Det är som att bära en strumpa ut och in.'],
      ['me', 'Det ser... väldigt lila ut.'],
      ['J', 'Lila är inte problemet. Lila är brand.'],
      ['NI', 'Problemet är att DU använder margin. Vi använder gap.'],
      ['KA', 'Och om vi hade inUniform hade det varit gap-300.'],
    ],
    [
      ['J', 'Snabb design-crit. Tre minuter. Max fyrtio.'],
      ['KA', 'Steg ett: ta bort allt som inte är whitespace.'],
      ['NI', 'Steg två: lägg till mer whitespace.'],
      ['me', 'Är det där ens möjligt i CSS?'],
      ['J', 'Med inUniform-ramverket? Allt är möjligt.'],
      ['KA', 'Ramverket som vi skulle haft IGÅR, påminner jag.'],
      ['NI', 'Jag har bokat en workshop om det. Kl 03.'],
    ],
    [
      ['KA', 'Vem har skrivit style="margin: 0 auto 0 -2px"?'],
      ['me', 'Jag är backend...'],
      ['J', 'Det är ingen ursäkt. Backend har också marginaler.'],
      ['NI', 'Inre marginaler. Känslomässiga marginaler.'],
      ['KA', 'inUniform har en token för det. inner-calm-200.'],
      ['J', 'När vi får det. Vilket skulle varit IGÅR.'],
    ],
  ],
  giveUp: ['Jag lägger länken i Slack!', 'Jag bokar en design-crit kl 03!', 'Vänta tills du ser v8!', 'Jag taggar dig i Figma då!', 'inUniform kommer! Någon gång! Förhoppningsvis igår!'],
  leaveLine: ['Tack för feedbacken! Vi itererar!', 'Vi ses i nästa spacing-sync!', 'Jag skickar ett Loom om marginaler!'],
  // Shown big when the group arrives
  rush: ['UX-RUSH! Jocke, Katarina och Nikki har Figma-länkar!', 'UX-GÄNGET! Kolla dina marginaler!', 'DESIGN-CRIT PÅ LÖPANDE BAND!'],
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
  Keynote-slogans du duckade: ${s.slogans ?? 0}<br>
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
    clock: 'Dag 2 · 11:59', title: 'Agendapunkt 46,75',
    play: 'finalfinalboss',
    before: [
      ['H', 'En minut till lunch! Men först: punkt 46,75. Den är i platina.'],
      ['D', 'Det finns ingen platina-penna.'],
      ['H', 'Jag köpte en. Till keynoten! Segertoft väntar i slottets konferensrum.'],
      ['D', 'En keynote. En minut före lunch.'],
      ['H', 'Den är på två minuter. Han har en Gripen-spellista. In i konferensrummet!'],
    ],
  },
  {
    clock: 'Dag 2 · 12:01', title: 'Lunch. Igen.',
    before: [
      ['H', 'Och så var det lunch igen. Nästan enligt agendan.'],
      ['H', 'Bra jobbat. Du överlevde lunch till lunch.'],
      ['D', 'Tack. Vad kom vi fram till?'],
      ['H', 'Tio idéer, sex träd, en demo och en keynote. Och en ny tradition!'],
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
