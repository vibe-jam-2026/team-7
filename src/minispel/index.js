// All minigames. To add one: copy _mall.js to a new file, then import it here.
import kontoret from './kontoret.js';
import bussen from './bussen.js';
import buffe from './buffe.js';
import workshop from './workshop.js';
import fika from './fika.js';
import middag from './middag.js';
import natt from './natt.js';
import energizer from './energizer.js';
import trad from './trad.js';
import demo from './demo.js';
import talt from './talt.js';
import spa from './spa.js';

export const MINIGAMES = Object.fromEntries(
  [kontoret, bussen, buffe, workshop, fika, middag, natt, energizer, trad, demo, talt, spa].map((m) => [m.id, m]),
);
