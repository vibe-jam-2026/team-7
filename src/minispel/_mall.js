// MALL för ett nytt minispel. Kopiera filen, byt namn, och lägg till den i index.js.
// För att den ska synas i världen: ge den en `station`. För att den ska ingå i berättelsen:
// lägg till ett steg med `play: '<id>'` i src/story.js.
//
// Motorn skickar in `g` till alla funktioner. Det mest användbara:
//   g.p                spelaren (x, y, vx, stun ...)      g.t      sekunder sedan start
//   g.count            räknare som du styr själv           g.flags  ditt eget tillstånd
//   g.meter            mätare 0–100 (om `meter` är satt)   g.stats  statistik till slutskärmen
//   g.item(kind, x, y, {...})   föremål man plockar upp  (kind: plate, coffee, bulle, key, hdmi, dongle, charger, postit)
//   g.faller(kind, x, {vy, bad, text})  något som faller; bad: true = man fastnar en stund
//   g.walker(['repliker'], {side})       en kollega som går mot dig; hoppa över!
//   g.prop('table' | 'projector', x)     dekor på marken
//   g.say(text, vem), g.henrikSay(text), g.shout('STOR TEXT')
//   g.sfx.ding(), g.sfx.kazoo(), g.sfx.sadTrombone() ...  ljudeffekter, se src/ljud.js
import { GROUND_Y } from '../world.js';

export default {
  id: 'mitt-spel',                     // unikt namn
  title: 'Mitt minispel',              // visas på titelkortet
  tagline: 'Kort beskrivning av målet',
  station: { x: 300, label: 'Skylt' }, // var i Haga man går in (ta bort för att dölja)
  level: 'haga',                       // 'haga', 'kontoret' eller 'bussen'
  // lockPlayer: true,                // spelaren står still (tangenterna används till annat)
  // cinematic: true,                 // filmsekvens: ingen styrning, mellanslag hoppar över
  start: 300,                          // spelarens startposition
  henrik: 340,                         // var Henrik står (null = inte med)
  time: 20,                            // sekunder, eller ta bort för ingen tidsgräns
  // timeoutWins: true,                // överlev tiden = vinst
  // meter: 'Energi',                  // visar en mätare (g.meter)
  // dark: true, tint: 'rgba(...)',    // mörker och färgton

  intro: [['H', 'Henrik förklarar reglerna.']],
  goal: (g) => `Plocka saker: ${g.count}/3`,

  setup(g) {
    g.item('coffee', 360, GROUND_Y - 6);
  },
  update(g, dt) {
    if (g.count >= 1) return 'win'; // returnera 'win' eller 'fail'
  },
  // onCollect(g, item) {}, onCatch(g, f) {}, onMiss(g, f) {}, onWin(g) {}, draw(g, ctx) {}

  win: [['H', 'Bra jobbat!']],
  fail: [['H', 'Igen!']],
};
