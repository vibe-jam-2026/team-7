# team-7
Vibe Jam 2026 – lag 7

Live: https://vibe-jam-2026.github.io/team-7/ · Instruktioner: [instructions.html](instructions.html)

## Kör lokalt
Spelet använder ES-moduler och måste därför köras via en webbserver, inte genom att öppna filen direkt:

```bash
python3 -m http.server 8000
```

Öppna sedan http://localhost:8000

## Kontroller
← → gå · ↑ hoppa · 1 2 byter nivå (eller `?level=2` i adressen)

## Struktur
Vanlig JavaScript utan byggsteg. Allt ritas på en 320×180-canvas som skalas upp i pixelstil.

| Fil | Innehåll |
|---|---|
| `index.html` | Sidan och canvasen |
| `src/main.js` | Spelloopen (fast tidssteg) och kameran |
| `src/input.js` | Tangentbordsstatus (`keys.left`, `keys.right`, …) |
| `src/world.js` | Gemensamma konstanter (`WIDTH`, `HEIGHT`, `GROUND_Y`) och `hash()` |
| `src/player.js` | Astronautens fysik, animation och ritning |
| `src/levels/index.js` | Listan över nivåer i spelordning |
| `src/levels/moon.js` | Nivå 1: Månen, med en raket som tar dig vidare |
| `src/levels/haga.js` | Nivå 2: Haga slott vid Mälaren |

### Lägga till en nivå
Skapa `src/levels/<namn>.js` som exporterar ett nivåobjekt med `name`, `width`, `startX`, `gravity`, `jumpSpeed`, `dustColor`, `exitX` (eller `null`) och `draw(ctx, camX, time)`. Lägg sedan till det i `src/levels/index.js`.
