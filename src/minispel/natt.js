// 23:47 Night: find your room key in the dark park while the singalong hunts you.
import { GROUND_Y, rand } from '../world.js';

const SINGERS = [
  'HELAN GÅÅÅR!', 'EN GÅNG TILL FRÅN BÖRJAN!', 'Har du hört den om Henrik och projektorn?',
  'Bastun är 95 grader, kom!', 'Vi behöver en tenor!', 'Sjung hopp faderallan lallan lej!',
];
const SINGER = { jacket: '#f2f2f2', pants: '#2a2a33', shirt: '#fff', hair: '#5a3a20', skin: '#f0b090', shoes: '#222', prop: 'glass' };

export default {
  id: 'natt',
  title: 'Var är rumsnyckeln?',
  tagline: 'Leta i mörkret. Undvik allsången.',
  station: { x: 985, label: 'Parken' },
  start: 520,
  time: 30,
  dark: true,
  tint: 'rgba(10,20,70,0.35)',
  intro: [
    ['D', 'Nyckeln ligger någonstans i parken. Den blänker ibland.'],
    ['D', 'Mobilens ficklampa, 4 % batteri. Hitta nyckeln. Undvik allsången.'],
  ],
  goal: () => 'Hitta rumsnyckeln',
  setup(g) {
    const side = Math.random() < 0.5 ? -1 : 1;
    const x = Math.max(60, Math.min(g.level.width - 260, 520 + side * rand(220, 420)));
    g.flags.key = g.item('key', x, GROUND_Y - 4);
    g.flags.spawn = 1.5;
  },
  update(g, dt) {
    g.flags.spawn -= dt;
    if (g.flags.spawn <= 0) {
      g.flags.spawn = 2.2;
      g.walker(SINGERS, { look: { ...SINGER, jacket: ['#f2f2f2', '#e7d3a6', '#cfd8e8'][Math.floor(Math.random() * 3)] } });
    }
    if (g.flags.found) return 'win';
  },
  onCollect(g) { g.flags.found = true; },
  // The key glints in the dark now and then
  draw(g, ctx) {
    const k = g.flags.key;
    if (!k || g.flags.found) return;
    const s = Math.sin(g.time * 2.5);
    if (s > 0.75) {
      const x = Math.round(k.x - g.camX), y = Math.round(k.y);
      ctx.fillStyle = '#fff7b0';
      ctx.fillRect(x - 3, y, 7, 1); ctx.fillRect(x, y - 3, 1, 7);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y, 1, 1);
    }
  },
  win: [
    ['D', 'Nyckeln! Rum 214. Sängen. Äntligen.'],
    ['H', '(genom dörren) Väckning 06:45! Energizern börjar 07:00 PRICK!'],
    ['D', 'Varför låter det som ett hot?'],
  ],
  fail: [['D', 'Allsången hittade mig först. Jag kan nu alla tolv verser av "Helan går". Igen.']],
};
