// 12:00 Lunch buffet: grab five dishes while colleagues cut in line.
import { GROUND_Y } from '../world.js';

const CUTTERS = [
  'Ursäkta, jag ska bara ta lite sallad!',
  'Är det glutenfritt? HAR NÅGON KOLL?',
  'Jag sträcker mig bara förbi dig...',
  'Är det här kön eller bara folk?',
  'Oj, förlåt! Jag ska bara ha sås.',
  'Vem tar ens sill till lunch? Jag!',
  'Står 13.2 med på menyn?',
];

export default {
  id: 'buffe',
  title: 'Lunchbuffén',
  tagline: 'Ta 5 rätter innan passet börjar 12:05',
  station: { x: 220, label: 'Buffén' },
  start: 110,
  henrik: 80,
  time: 30,
  intro: [
    ['H', 'Fem rätter, 30 sekunder. Nästa pass börjar 12:05.'],
    ['H', 'Hoppa över folk som tränger sig. Med ↑. Respektfullt.'],
  ],
  goal: (g) => `Ta rätter från buffén: ${g.count}/5`,
  setup(g) {
    [200, 330, 460, 590, 720].forEach((x, i) => {
      g.prop('table', x);
      g.item('plate', x, GROUND_Y - 15, { dish: i });
    });
    g.flags.spawn = 1.2;
  },
  update(g, dt) {
    g.flags.spawn -= dt;
    if (g.flags.spawn <= 0) { g.flags.spawn = 2.6; g.walker(CUTTERS, { side: 1 }); }
    if (g.count >= 5) return 'win';
  },
  win: [
    (g) => ['H', `${Math.ceil(30 - g.t)} sekunder kvar! Imponerande. Mitt rekord är 12 sekunder. Jag åt stående.`],
    ['D', 'Kände du ens smaken?'],
    ['H', 'Smak är ett möte jag har tackat nej till.'],
  ],
  fail: [['H', 'Klockan är 12:05 och din tallrik är tom. Jag skriver in det som en lärdom.']],
};
