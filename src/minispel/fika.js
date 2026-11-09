// 15:00 Fika: race to the last cinnamon bun while everyone wants "five minutes".
import { GROUND_Y } from '../world.js';

const ASKERS = [
  'Har du 5 minuter?', 'Snabb fråga!', 'Hur går det med 13.2?', 'Kan vi ta en kort sync?', 'Har du sett mitt mejl?',
  'Jag bokade in oss 15:00–17:30, lugnt?', 'Bara en liten grej...', 'Du som kan Git – kan du fixa min skrivare?',
];

export default {
  id: 'fika',
  title: 'Fika',
  tagline: 'Den sista kanelbullen',
  station: { x: 1110, label: 'Fikan' },
  start: 280,
  time: 22,
  intro: [
    ['H', 'Bullen ligger längst bort vid sjön. Spring! Och se upp: folk vill ha "fem minuter".'],
    ['D', 'Hur farligt kan fem minuter vara?'],
    ['H', 'Ingen har någonsin kommit tillbaka från fem minuter.'],
  ],
  goal: () => 'Nå den sista kanelbullen →',
  setup(g) {
    g.prop('table', 1060);
    g.item('bulle', 1060, GROUND_Y - 16);
    g.flags.spawn = 0.8;
  },
  update(g, dt) {
    g.flags.spawn -= dt;
    if (g.flags.spawn <= 0) { g.flags.spawn = 1.5; g.walker(ASKERS, { side: 1 }); }
    if (g.flags.won) return 'win';
  },
  onCollect(g) { g.flags.won = true; },
  onWin(g) {
    g.henrik = { x: 1078, facing: -1, target: null };
    g.walkers = [];
  },
  win: [
    ['H', '*mums* Åh. Var den här din?'],
    (g) => ['D', `Jag sprang hela vägen och hoppade över ${g.dodgedHere} sync-möten.`],
    ['H', 'Jag trodde det stod "chefen" på den. Det står "kanel". Nära.'],
    ['H', 'Som tack: middagen ikväll har ett tal. Mitt.'],
  ],
  fail: [['H', 'Fikan är slut. Bullen är historia. Precis som min diet. Igen!']],
};
