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

**TRYCK INTE:** den röda knappen överst i bilden får man inte klicka på. Gör man det förlorar man: en slumpad komisk text visas (texterna finns i `FORBIDDEN` i `src/story.js`) och sedan börjar spelet om från början.

**Dev-meny:** tryck **Ö** (eller **§**, eller klicka **DEV** under spelet) när som helst för att hoppa till valfritt kapitel eller minispel. Enter går direkt in i minispelet, → spelar kapitlet från början (dialog och Haga). Spelet pausas medan menyn är öppen.

## Struktur
Vanlig JavaScript utan byggsteg. Allt ritas på en 320×180-canvas som skalas upp; text och dialog är HTML ovanpå.

| Fil | Innehåll |
|---|---|
| `src/story.js` | **Berättelsen:** klockslag, Henriks repliker och ordningen på minispelen. Ändra dialog här. |
| `src/minispel/` | **Ett minispel per fil** (t.ex. `trad.js`: plantera träd i parken, `talt.js`: bossen vid Koppartälten där Henrik skyfflar tält och du väljer ett). `_mall.js` är en mall att kopiera. Registreras i `index.js`. |
| `src/game.js` | Motorn: navvärlden, in och ut ur minispel, dialog, kollegor som vill ha "fem minuter" |
| `src/sprites.js` | Pixelgrafik: du (`PLAYER`), Henrik, Natalie, Markus, Gustav, kollegor, föremål och dekor |
| `src/devmeny.js` | Dev-menyn (Ö) |
| `src/knappen.js` | Den röda knappen man inte får trycka på |
| `src/ui.js` | HUD, dialogruta, titelkort och pratbubblor (HTML) |
| `src/player.js` | Spelarens fysik och rörelse |
| `src/levels/` | Världarna: kontoret, bussen och Haga slott |
| `src/world.js` | Gemensamma konstanter och hjälpfunktioner |

## Lägga till ett minispel
1. Kopiera `src/minispel/_mall.js` till t.ex. `src/minispel/bastu.js` och ändra `id`, text och logik.
2. Importera den i `src/minispel/index.js`.
3. Ge den en `station` (x-position och skylt) så att den syns i Haga.
4. Vill du att den ska ingå i berättelsen: lägg till ett steg med `play: 'bastu'` i `src/story.js`.
