// Prologue on the Moon: walk to the rocket. No station; the story starts it directly.
export default {
  id: 'raketen',
  title: 'Prolog: Månen',
  level: 'moon',
  start: 900,
  intro: [],
  goal: () => 'Gå till raketen →',
  update(g) {
    if (g.p.x >= 1104) return 'win';
  },
  win: [['A', 'Destination: Haga slott. 3... 2... 1... *WHOOSH*']],
  fail: [],
};
