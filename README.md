# team-7 · Lunch till lunch
Vibe Jam 2026 – lag 7

Live: https://vibe-jam-2026.github.io/team-7/ · Instruktioner: [instructions.html](instructions.html)

Du sitter och kodar på 13.2-leveransen medan projektledarna Natalie, Markus och Gustav får panik.
Då kliver chefen Henrik Kauhanen in: alla ska på "lunch till lunch" på Haga slott, högsta prio.
Efter bussresan går man runt på Haga (navvärlden) och går in i minispel vid stationerna, i den ordning
agendan säger, från lunch dag 1 till lunch dag 2.

## Kör lokalt
Spelet använder ES-moduler och måste därför köras via en webbserver:

```bash
python3 -m http.server 8000
```

Öppna sedan http://localhost:8000. Med `?kapitel=3` i adressen hoppar man direkt till ett kapitel (0 = kontoret, 1 = bussen, 2 = ankomst Haga).

## Kontroller
← → gå · ↑ hoppa · mellanslag: prata vidare / gå in vid en station

## Struktur
Vanlig JavaScript utan byggsteg. Allt ritas på en 320×180-canvas som skalas upp; text och dialog är HTML ovanpå.

| Fil | Innehåll |
|---|---|
| `src/story.js` | **Berättelsen:** klockslag, Henriks repliker och ordningen på minispelen. Ändra dialog här. |
| `src/minispel/` | **Ett minispel per fil.** `_mall.js` är en mall att kopiera. Registreras i `index.js`. |
| `src/game.js` | Motorn: navvärlden, in och ut ur minispel, dialog, kollegor som vill ha "fem minuter" |
| `src/sprites.js` | Pixelgrafik: du (`PLAYER`), Henrik, Natalie, Markus, Gustav, kollegor, föremål och dekor |
| `src/ui.js` | HUD, dialogruta, titelkort och pratbubblor (HTML) |
| `src/player.js` | Spelarens fysik och rörelse |
| `src/levels/` | Världarna: kontoret, bussen och Haga slott |
| `src/world.js` | Gemensamma konstanter och hjälpfunktioner |

## Lägga till ett minispel
1. Kopiera `src/minispel/_mall.js` till t.ex. `src/minispel/bastu.js` och ändra `id`, text och logik.
2. Importera den i `src/minispel/index.js`.
3. Ge den en `station` (x-position och skylt) så att den syns i Haga.
4. Vill du att den ska ingå i berättelsen: lägg till ett steg med `play: 'bastu'` i `src/story.js`.
