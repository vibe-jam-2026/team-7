// Background music, generated live with Web Audio (no music files). A small step sequencer
// plays one of a few tracks; the game picks the track from what is happening (see game.js):
//   slott  – calm and a little stately: Haga, the title screen, between minigames
//   stress – fast and nervous: minigames
//   panik  – even faster, with sirens: the office at the start
//   resa   – a cheerful oom-pah: the bus ride
// A minigame can choose its own track with `music: 'slott'` etc.
import { audioTime, musicTone, musicNoise } from './ljud.js';

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

// Chords: bass note and three chord tones (MIDI numbers)
const CH = {
  C: { b: 48, t: [60, 64, 67] }, Am: { b: 45, t: [57, 60, 64] }, F: { b: 41, t: [57, 60, 65] },
  G: { b: 43, t: [55, 59, 62] }, Em: { b: 40, t: [55, 59, 64] }, Dm: { b: 38, t: [57, 62, 65] },
  E: { b: 40, t: [56, 59, 64] }, D: { b: 38, t: [54, 57, 62] },
};

// ---- slott: 8th notes, 8 per bar ----------------------------------------------------
const SLOTT_CHORDS = ['C', 'Am', 'F', 'G', 'C', 'Em', 'Dm', 'G'];
const SLOTT_MELODY = [ // per bar: [step, note, length in steps]
  [[0, 76, 3], [4, 74, 2], [6, 72, 2]],
  [[0, 72, 4], [4, 69, 4]],
  [[0, 69, 3], [4, 72, 2], [6, 77, 2]],
  [[0, 74, 7]],
  [[0, 76, 2], [2, 79, 2], [4, 76, 2], [6, 72, 2]],
  [[0, 71, 4], [4, 67, 4]],
  [[0, 69, 2], [2, 72, 2], [4, 74, 4]],
  [[0, 71, 4], [4, 74, 4]],
];

function slott(step, t, sd) {
  const bar = Math.floor(step / 8) % SLOTT_CHORDS.length, s = step % 8;
  const ch = CH[SLOTT_CHORDS[bar]];
  if (s === 0) musicTone({ type: 'sine', f0: hz(ch.b), dur: sd * 7, vol: 0.2, when: t, attack: 0.02 });
  if (s === 4) musicTone({ type: 'sine', f0: hz(ch.b + 7), dur: sd * 3.5, vol: 0.12, when: t, attack: 0.02 });
  // Plucked, harpsichord-like broken chord
  const arp = [0, 1, 2, 1, 0, 1, 2, 1][s];
  musicTone({ type: 'square', f0: hz(ch.t[arp] + 12), dur: sd * 0.9, vol: 0.035, when: t, lp: 1500 });
  // Melody, gentle with a little vibrato. Every other round it rests, so it doesn't get tiring.
  if (Math.floor(step / 64) % 2 === 0) {
    for (const [ms, n, len] of SLOTT_MELODY[bar]) {
      if (ms === s) musicTone({ type: 'triangle', f0: hz(n), dur: sd * len, vol: 0.12, when: t, vib: 5, vibDepth: 3, attack: 0.02 });
    }
  }
}

// ---- stress / panik: 16th notes, 16 per bar ---------------------------------------
const STRESS_CHORDS = ['Am', 'F', 'G', 'E'];
const LEAD_MASK = [1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 1];
const LEAD_ORDER = [0, 1, 2, 1, 0, 2, 1, 2, 0, 1, 2, 1, 2, 1, 0, 2];

function stress(step, t, sd, sirens = false) {
  const bar = Math.floor(step / 16) % STRESS_CHORDS.length, s = step % 16;
  const ch = CH[STRESS_CHORDS[bar]];
  if (s % 4 === 0) musicTone({ type: 'sine', f0: 150, f1: 45, dur: 0.13, vol: 0.45, when: t });               // kick
  if (s === 4 || s === 12) musicNoise({ dur: 0.1, vol: 0.18, when: t, type: 'bandpass', f0: 1800, q: 0.8 }); // snare
  musicNoise({ dur: 0.03, vol: s % 4 === 2 ? 0.07 : 0.035, when: t, type: 'highpass', f0: 7000 });          // hi-hat
  if (s % 2 === 0) {                                                                                          // nervous bass
    musicTone({ type: 'square', f0: hz(ch.b + (s % 4 === 2 ? 12 : 0)), dur: sd * 1.6, vol: 0.12, when: t, lp: 520 });
  }
  if (LEAD_MASK[s]) musicTone({ type: 'square', f0: hz(ch.t[LEAD_ORDER[s]] + 12), dur: sd * 0.8, vol: 0.04, when: t, lp: 2600 });
  if (sirens && s === 0 && bar % 2 === 0) { // a wailing siren every other bar
    const half = sd * 16;
    musicTone({ type: 'sawtooth', f0: 620, f1: 1250, dur: half, vol: 0.07, when: t, lp: 2200 });
    musicTone({ type: 'sawtooth', f0: 1250, f1: 620, dur: half, vol: 0.07, when: t + half, lp: 2200 });
  }
}

// ---- resa: 8th notes, oom-pah with a whistled tune --------------------------------
const RESA_CHORDS = ['G', 'C', 'D', 'G'];
const RESA_MELODY = [
  [[0, 79, 2], [2, 83, 2], [4, 86, 4]],
  [[0, 84, 2], [2, 83, 2], [4, 81, 4]],
  [[0, 81, 2], [2, 83, 2], [4, 84, 2], [6, 81, 2]],
  [[0, 79, 6]],
];

function resa(step, t, sd) {
  const bar = Math.floor(step / 8) % RESA_CHORDS.length, s = step % 8;
  const ch = CH[RESA_CHORDS[bar]];
  if (s === 0 || s === 4) musicTone({ type: 'triangle', f0: hz(ch.b + (s === 4 ? 7 : 0)), dur: sd * 1.5, vol: 0.2, when: t }); // oom
  if (s === 2 || s === 6) for (const n of ch.t) musicTone({ type: 'square', f0: hz(n), dur: sd * 0.7, vol: 0.025, when: t, lp: 1400 }); // pah
  for (const [ms, n, len] of RESA_MELODY[bar]) {
    if (ms === s) musicTone({ type: 'sine', f0: hz(n), dur: sd * len, vol: 0.1, when: t, vib: 6, vibDepth: 8, attack: 0.02 });
  }
}

const TRACKS = {
  slott: { bpm: 76, perBeat: 2, play: slott },
  stress: { bpm: 150, perBeat: 4, play: (s, t, sd) => stress(s, t, sd, false) },
  panik: { bpm: 168, perBeat: 4, play: (s, t, sd) => stress(s, t, sd, true) },
  resa: { bpm: 132, perBeat: 2, play: resa },
};

// ---- Sequencer --------------------------------------------------------------------
let wanted = null, current = null, step = 0, nextTime = 0, boost = 1;

// Choose the track (null = silence). Switching restarts at the top of the new track.
export function setMusic(name) { wanted = TRACKS[name] ? name : null; }
// Speed up a little when time is running out
export function setMusicBoost(on) { boost = on ? 1.15 : 1; }

function tick() {
  const now = audioTime();
  if (now == null) return;
  if (wanted !== current) { current = wanted; step = 0; nextTime = now + 0.06; }
  const tr = TRACKS[current];
  if (!tr) return;
  if (nextTime < now - 0.2) nextTime = now + 0.05; // the tab was asleep; don't play a backlog
  const sd = 60 / (tr.bpm * boost) / tr.perBeat;   // seconds per step
  while (nextTime < now + 0.15) {
    tr.play(step, nextTime, sd);
    nextTime += sd;
    step++;
  }
}
setInterval(tick, 25);
