// 11:52 The demo: collect the HDMI adapter, the USB-C dongle and a charger, dodge error pop-ups,
// then get back to the projector before lunch.
import { GROUND_Y, rand, pick } from '../world.js';

const ERRORS = [
  'Ingen signal', 'Uppdatering krävs. 3 h kvar.', 'Kan ni se min skärm?', 'Du är på mute!',
  'Teams har slutat svara', 'Ange lösenord för Wi-Fi', 'Batteri 2 %',
];
const PROJECTOR_X = 700;

export default {
  id: 'demo',
  powerups: ['speed', 'jump', 'shield', 'slow', 'magnet', 'quickwin'], // all of them: cables to grab, pop-ups and a clock
  title: 'Demon: Projektorn',
  tagline: 'Ledningsgruppen väntar. Projektorn säger "Ingen signal".',
  // Not in the story right now (reach it with the dev menu). Add `station: { x: 700, label: 'Stora salen' }` to bring it back.
  start: 660,
  henrik: 735,
  time: 35,
  intro: [
    ['H', 'Ledningsgruppen sitter på plats. Projektorn säger... "INGEN SIGNAL".'],
    ['D', 'Jag behöver HDMI-adaptern, USB-C-dongeln och en laddare. Jag har ingen av dem.'],
    ['H', 'Klassiskt! Jag håller dem varma med mitt bästa skämt. Det tar ungefär tolv minuter.'],
  ],
  goal: (g) => g.count < 3 ? `Hitta sladdarna: ${g.count}/3` : 'Spring till projektorn!',
  setup(g) {
    g.flags.projector = g.prop('projector', PROJECTOR_X, { working: false });
    g.item('charger', 190, GROUND_Y - 10, { bob: true });
    g.item('hdmi', 400, GROUND_Y - 32, { bob: true });
    g.item('dongle', 1000, GROUND_Y - 10, { bob: true });
    g.flags.spawn = 1; g.flags.bark = 1.5;
  },
  update(g, dt) {
    g.flags.spawn -= dt;
    if (g.flags.spawn <= 0) {
      g.flags.spawn = 0.8;
      g.faller('popup', g.p.x + rand(-110, 110), { vy: rand(45, 70), bad: true, text: pick(ERRORS) });
    }
    g.flags.bark -= dt;
    if (g.flags.bark <= 0) {
      g.flags.bark = 3.2;
      g.henrikSay(pick([
        'Kan någon ringa IT? Nej? Någon som ÄR IT?',
        'Tryck F7. Eller F8. Vänta, är det en Mac?',
        'Ledningsgruppen tittar på klockan. Positivt!',
        'Vi tar en kort energizer medan vi väntar!',
        'Har ni testat att dra ut och sätta i?',
      ]));
    }
    if (g.count >= 3 && Math.abs(g.p.x - PROJECTOR_X) < 18) return 'win';
  },
  onCollect(g, item) {
    g.count++;
    const names = { hdmi: 'HDMI-adaptern!', dongle: 'Dongeln!', charger: 'Laddaren!' };
    g.say(names[item.kind], g.p, 'me', 1.4);
  },
  onWin(g) { g.flags.projector.working = true; g.fallers = []; g.sfx.powerUp(); },
  win: [
    ['D', 'Bild! VI HAR BILD!'],
    ['H', 'Applåder! Och precis i tid till...'],
  ],
  fail: [['H', 'Lunchen började utan oss. Ledningsgruppen åt upp demon. Vi tar om!']],
};
