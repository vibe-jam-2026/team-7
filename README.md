# team-7 · Lunch till lunch
Vibe Jam 2026 – lag 7

Live: https://vibe-jam-2026.github.io/team-7/ · Instruktioner: [instructions.html](instructions.html)

Du sitter och kodar på 13.2-leveransen medan projektledarna Natalie, Markus och Gustav får panik.
Då kliver chefen Henrik Kauhanen in: alla ska på "lunch till lunch" på Haga slott, högsta prio.
Efter bussresan går man runt på Haga (navvärlden) och går in i minispel vid stationerna, i den ordning
agendan säger, från lunch dag 1 till lunch dag 2. Som belöning slutar allt i spat på Haga slott
(`src/minispel/spa.js`): en kort film där du äntligen får slappna av i badtunnan medan mobilen surrar om 13.2.

## Kör lokalt
Spelet använder ES-moduler och måste därför köras via en webbserver:

```bash
python3 -m http.server 8000
```

Öppna sedan http://localhost:8000. Med `?kapitel=3` i adressen hoppar man direkt till ett kapitel (0 = kontoret, 1 = bussen, 2 = ankomst Haga).

## Kontroller
← → gå · ↑ hoppa · mellanslag: prata vidare / gå in vid en station

**UX-designerna:** ibland, när du går runt på Haga, kommer Katarina, Jocke eller Nikki (eller alla tre: UX-RUSH!) springande bakifrån med en surfplatta full av Figma-koncept. De är snabbare än du, så hoppa över dem! Fångar de dig står du fast och får höra om användarflöden, designsystem och knappar som inte ligger i 8-punktsgriden. Repliker och tempo finns i `DESIGNERS` i `src/story.js`, logiken i `src/designers.js`.

**TRYCK INTE:** den röda knappen överst i bilden får man inte klicka på. Gör man det förlorar man: en slumpad komisk text visas (texterna finns i `FORBIDDEN` i `src/story.js`) och sedan börjar spelet om från början.

**Dev-meny:** tryck **Ö** (eller **§**, eller klicka **DEV** under spelet) när som helst för att hoppa till valfritt kapitel eller minispel. Enter går direkt in i minispelet, → spelar kapitlet från början (dialog och Haga). Spelet pausas medan menyn är öppen.

**SiloEscape** (`src/minispel/siloescape.js`): ett Doodle Jump-liknande minispel där du studsar 800 m rakt upp ur en silo medan kvartalsfyrverkeriet exploderar under dig och bilden kryper uppåt. ← → styr, kaffemuggar ger extra skjuts, OMORG-lådor rasar och mötesdrönare hoppar man på ovanifrån. Ingår inte i berättelsen än: spela det via dev-menyn ("utanför storyn").

## Struktur
Vanlig JavaScript utan byggsteg. Allt ritas på en 320×180-canvas som skalas upp; text och dialog är HTML ovanpå.

| Fil | Innehåll |
|---|---|
| `src/story.js` | **Berättelsen:** klockslag, Henriks repliker och ordningen på minispelen. Ändra dialog här. |
| `src/minispel/` | **Ett minispel per fil** (t.ex. `trad.js`: plantera träd i parken, `talt.js`: bossen vid Koppartälten där Henrik gömmer samarbetet under ett tält, skyfflar och du lyfter på ett). `_mall.js` är en mall att kopiera. Registreras i `index.js`. |
| `src/game.js` | Motorn: navvärlden, in och ut ur minispel, dialog, kollegor som vill ha "fem minuter" |
| `src/minispel/aiboss.js` | **AI-Göran:** AI-evangelist (grått skägg, hästsvans) som täcker skärmens överdel och skjuter AI-slogans. Stå i de gröna rutorna tills nedräkningen når noll (den räknas bara ned medan du står i rutan) och dra ur sladden till tre GPU-kluster. När tre kluster är nere genererar han "med AI:s kraft" en tredje dimension: fas 2 ses i perspektiv (↑ ↓ går på djupet, mellanslag hoppar över ordväggar) och du drar ur tre kluster till. Når man fas 2 börjar omtag där. Repliker och slogans högst upp i filen. |
| `src/pixeltext.js` | Litet 3×5-pixeltypsnitt för text på canvasen (används av FinalFinalBoss och AI-Göran) |
| `src/sprites.js` | Pixelgrafik: du (`PLAYER`), Henrik, Natalie, Markus, Gustav, Katarina, Jocke, Nikki, kollegor, föremål och dekor |
| `src/designers.js` | UX-designerna Katarina, Jocke och Nikki som jagar dig i Haga med sina Figma-koncept |
| `src/devmeny.js` | Dev-menyn (Ö) |
| `src/ljud.js` | Ljudeffekter, skapade med Web Audio (inga ljudfiler). `g.sfx.namn()` i minispel. M stänger av. |
| `src/powerups.js` | Power-ups med röststyrning på svenska: säg "Effektivisera" (snabbare), "Högt i tak" (superhopp) eller "Vi tar det offline" (sköld). Tangenterna 1, 2, 3 fungerar också. |
| `src/musik.js` | Bakgrundsmusik, genererad i koden: lugn vid slottet, stressig i minispel, sirener på kontoret, resemusik i bussen. Minispel kan välja med `music: '...'`. |
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
