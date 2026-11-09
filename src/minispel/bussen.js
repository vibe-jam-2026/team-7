// A short film: the bus ride to Haga slott. Press space to skip.
import { SEATS, HEAD_Y } from '../levels/bussen.js';

// [seconds, who, line]
const SCRIPT = [
  [0.4, 'H', 'Välkomna ombord på Haga Express! Jag är er guide.'],
  [2.3, 'N', 'Har bussen wifi? Jag måste pusha 13.2!'],
  [4.2, 'H', 'Under resan går vi igenom agendan. Punkt 1 av 47.'],
  [6.1, 'M', 'Testmiljön är fortfarande nere. Jag ser det härifrån.'],
  [8.0, 'G', 'Jag flyttar deadline till efter lunch. Imorgon.'],
  [9.9, 'H', 'Punkt 2: varför agendan är så lång.'],
  [11.8, 'D', 'Är vi framme snart?'],
];

export default {
  id: 'bussen',
  title: 'Bussen till Haga',
  level: 'bussen',
  start: 160,
  cinematic: true,
  time: 13.8,
  timeoutWins: true,
  intro: [],
  goal: () => 'Mellanslag: hoppa över',
  setup(g) { g.flags.i = 0; },
  update(g) {
    while (g.flags.i < SCRIPT.length && g.t >= SCRIPT[g.flags.i][0]) {
      const [, who, text] = SCRIPT[g.flags.i++];
      g.bubbles = [];
      g.say(text, { x: SEATS[who], y: HEAD_Y - 6 }, who === 'H' ? 'henrik' : who === 'D' ? 'me' : '', 1.9);
    }
  },
  win: [],
  fail: [],
};
