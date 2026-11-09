// All levels in play order. To add one: create src/levels/<name>.js exporting a level
// object (see moon.js or haga.js for the fields) and add it here.
import { moon } from './moon.js';
import { haga } from './haga.js';

export const LEVELS = [moon, haga];
