// All minigames. To add one: copy _mall.js to a new file, then import it here.
import kontoret from './kontoret.js';
import bussen from './bussen.js';
import trad from './trad.js';
import demo from './demo.js';
import talt from './talt.js';
import spa from './spa.js';
import kontrakt from './kontrakt.js';
import finalfinalboss from './finalfinalboss.js';
import siloescape from './siloescape.js';
import aiboss from './aiboss.js';

export const MINIGAMES = Object.fromEntries(
  [kontoret, bussen, kontrakt, trad, aiboss, demo, talt, spa, finalfinalboss, siloescape].map((m) => [m.id, m]),
);
