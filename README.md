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
← → gå · ↑ hoppa

## Struktur
Vanlig JavaScript utan byggsteg. Allt ritas på en 320×180-canvas som skalas upp i pixelstil.

| Fil | Innehåll |
|---|---|
| `index.html` | Sidan och canvasen |
| `src/main.js` | Spelloopen (fast tidssteg) och kameran |
| `src/input.js` | Tangentbordsstatus (`keys.left`, `keys.right`, …) |
| `src/world.js` | Himmel, stjärnor, jorden och marken (`GROUND_Y`) |
| `src/player.js` | Astronautens fysik, animation och ritning |
