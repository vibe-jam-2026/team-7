// All minigames. To add one: copy _mall.js to a new file, then import it here.
import raketen from './raketen.js';
import buffe from './buffe.js';
import workshop from './workshop.js';
import fika from './fika.js';
import middag from './middag.js';
import natt from './natt.js';
import energizer from './energizer.js';
import trad from './trad.js';
import demo from './demo.js';

export const MINIGAMES = Object.fromEntries(
  [raketen, buffe, workshop, fika, middag, natt, energizer, trad, demo].map((m) => [m.id, m]),
);
