// Sound effects, synthesised with Web Audio: no sound files needed.
// Everything is meant to sound a bit silly: boings, kazoos, sad trombones and slurps.
// Use from anywhere: import { sfx } from './ljud.js'; sfx.jump();  (minigames also get g.sfx)
// M mutes / unmutes. Browsers only allow sound after the first key press or click.

const VOLUME = 1.6; // overall loudness; the compressor keeps it from distorting
const MUSIC_VOLUME = 0.42; // background music relative to the effects
let ac = null;
let master = null;
let musicBus = null;
let muted = false;
try { muted = localStorage.getItem('ljud-av') === '1'; } catch { /* no storage */ }

export function unlock() {
  if (!ac) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    // Loud master volume through a compressor, so quiet effects are heard on laptop speakers
    // and loud ones don't distort.
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -18; comp.knee.value = 12; comp.ratio.value = 4;
    comp.attack.value = 0.003; comp.release.value = 0.15;
    master = ac.createGain();
    master.gain.value = muted ? 0 : VOLUME;
    master.connect(comp);
    comp.connect(ac.destination);
    musicBus = ac.createGain();
    musicBus.gain.value = MUSIC_VOLUME;
    musicBus.connect(master);
  }
  if (ac.state === 'suspended') ac.resume();
}
// Any of these count as "the user did something", which browsers require before playing sound
for (const ev of ['keydown', 'pointerdown', 'mousedown', 'click', 'touchend']) addEventListener(ev, unlock, true);

// 'waiting' = no key pressed yet, 'on', 'off' = muted with M, 'blocked' = the browser refuses to play
export function audioStatus() {
  if (muted) return 'off';
  if (!ac) return 'waiting';
  return ac.state === 'running' ? 'on' : 'blocked';
}

// The sound button: start sound, unmute if needed, and play a test pling
export function soundButton() {
  unlock();
  if (muted) toggleMute();
  else setTimeout(() => sfx.pickup(), 30);
}

export function toggleMute() {
  muted = !muted;
  try { localStorage.setItem('ljud-av', muted ? '1' : '0'); } catch { /* no storage */ }
  if (master) master.gain.value = muted ? 0 : VOLUME;
  if (!muted) setTimeout(() => sfx.pickup(), 30); // a little "pling" so you hear that sound is on
  return muted;
}
export function isMuted() { return muted; }

// For the background music (src/musik.js): the audio clock, and notes routed to the music volume.
export function audioTime() { return ac && ac.state === 'running' ? ac.currentTime : null; }
export function musicTone(opts) { if (musicBus) tone({ ...opts, out: musicBus }); }
export function musicNoise(opts) { if (musicBus) noise({ ...opts, out: musicBus }); }
export function musicFade(to, seconds = 0.4) {
  if (!musicBus) return;
  const t = ac.currentTime;
  musicBus.gain.cancelScheduledValues(t);
  musicBus.gain.setValueAtTime(musicBus.gain.value, t);
  musicBus.gain.linearRampToValueAtTime(to * MUSIC_VOLUME, t + seconds);
}

// ---- Building blocks -------------------------------------------------------------
// A tone that glides from f0 to f1. Optional vibrato (Hz, depth in Hz) and a low-pass filter.
// `when` = exact audio-clock time (used by the music), otherwise `at` seconds from now.
function tone({ type = 'square', f0, f1 = f0, dur = 0.15, vol = 0.25, at = 0, when = null, vib = 0, vibDepth = 0, lp = 0, attack = 0.005, out = null }) {
  if (!ac || muted) return;
  const t = when ?? ac.currentTime + at;
  const o = ac.createOscillator();
  const gn = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  if (vib) {
    const l = ac.createOscillator(), lg = ac.createGain();
    l.frequency.value = vib; lg.gain.value = vibDepth;
    l.connect(lg); lg.connect(o.frequency);
    l.start(t); l.stop(t + dur + 0.05);
  }
  gn.gain.setValueAtTime(0.0001, t);
  gn.gain.exponentialRampToValueAtTime(vol, t + attack);
  gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let node = o;
  if (lp) { const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; o.connect(f); node = f; }
  node.connect(gn); gn.connect(out || master);
  o.start(t); o.stop(t + dur + 0.05);
}

let noiseBuf = null;
// A burst of noise through a filter that can sweep (for whooshes, slurps, thuds and paper).
function noise({ dur = 0.2, vol = 0.2, at = 0, when = null, type = 'bandpass', f0 = 1000, f1 = f0, q = 1, out = null }) {
  if (!ac || muted) return;
  if (!noiseBuf) {
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t = when ?? ac.currentTime + at;
  const src = ac.createBufferSource();
  src.buffer = noiseBuf;
  const f = ac.createBiquadFilter();
  f.type = type; f.Q.value = q;
  f.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const gn = ac.createGain();
  gn.gain.setValueAtTime(0.0001, t);
  gn.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f); f.connect(gn); gn.connect(out || master);
  src.start(t); src.stop(t + dur + 0.05);
}

const notes = (list, opts) => list.forEach(([f, at, dur]) => tone({ ...opts, f0: f, at, dur }));

// Voices for dialogue babble: base pitch per speaker
const VOICES = { H: 240, D: 420, N: 640, M: 280, G: 500, K: 380, henrik: 240, me: 420 };

// ---- The effects ----------------------------------------------------------------
export const sfx = {
  // Movement
  jump: () => tone({ type: 'sine', f0: 160, f1: 560, dur: 0.22, vol: 0.28, vib: 28, vibDepth: 40 }),          // boing
  land: () => noise({ dur: 0.07, vol: 0.18, type: 'lowpass', f0: 400 }),

  // Picking things up
  pickup: () => notes([[880, 0, 0.07], [1320, 0.06, 0.12]], { type: 'square', vol: 0.12 }),                    // pling
  gadget: () => notes([[523, 0, 0.06], [659, 0.05, 0.06], [784, 0.1, 0.06], [1047, 0.15, 0.14]], { type: 'square', vol: 0.1 }),
  coffee: () => { // sluuurp + gulp
    noise({ dur: 0.38, vol: 0.22, f0: 500, f1: 2600, q: 4 });
    tone({ type: 'sine', f0: 320, f1: 110, dur: 0.14, vol: 0.3, at: 0.38 });
  },
  mums: () => [0, 0.16, 0.32].forEach((at) => tone({ type: 'sine', f0: 190, f1: 120, dur: 0.12, vol: 0.32, at, vib: 30, vibDepth: 25 })),
  paper: () => { noise({ dur: 0.09, vol: 0.12, type: 'highpass', f0: 3000 }); tone({ type: 'triangle', f0: 1200, f1: 1500, dur: 0.06, vol: 0.1 }); },
  plop: () => tone({ type: 'sine', f0: 700, f1: 180, dur: 0.16, vol: 0.2 }),
  jingle: () => notes([[1568, 0, 0.1], [2093, 0.08, 0.1], [2637, 0.16, 0.25]], { type: 'triangle', vol: 0.16 }),
  dig: () => noise({ dur: 0.12, vol: 0.22, type: 'lowpass', f0: 900, f1: 300 }),
  plant: () => notes([[392, 0, 0.08], [523, 0.07, 0.08], [784, 0.14, 0.2]], { type: 'triangle', vol: 0.16 }),

  // Getting caught
  bonk: () => { // stuck in a meeting: bonk + wah-wah
    tone({ type: 'sine', f0: 320, f1: 70, dur: 0.18, vol: 0.35 });
    noise({ dur: 0.06, vol: 0.2, type: 'lowpass', f0: 800 });
    tone({ type: 'sawtooth', f0: 233, f1: 220, dur: 0.18, vol: 0.08, at: 0.2, lp: 900 });
    tone({ type: 'sawtooth', f0: 208, f1: 196, dur: 0.3, vol: 0.08, at: 0.4, lp: 900, vib: 6, vibDepth: 6 });
  },
  kazoo: () => tone({ type: 'sawtooth', f0: 260, f1: 200, dur: 0.32, vol: 0.12, vib: 9, vibDepth: 18, lp: 1800 }), // "SYNERGI!"
  error: () => notes([[440, 0, 0.11], [330, 0.12, 0.18]], { type: 'square', vol: 0.12 }),                      // dun-dun
  whoosh: () => noise({ dur: 0.18, vol: 0.12, f0: 600, f1: 3000, q: 2 }),                                       // jumped over someone
  nope: () => notes([[220, 0, 0.09], [165, 0.11, 0.16]], { type: 'square', vol: 0.12 }),                         // locked

  // Talking: a few babble blips in the speaker's voice
  blip: (who = 'D') => {
    const base = VOICES[who] ?? 240;
    tone({ type: 'square', f0: base * (0.85 + Math.random() * 0.4), dur: 0.045, vol: 0.17, lp: 2200 });
  },
  chatter: (who = 'K', n = 4) => {
    const base = VOICES[who] ?? 230;
    for (let i = 0; i < n; i++) tone({ type: 'square', f0: base * (0.8 + Math.random() * 0.5), dur: 0.045, vol: 0.09, at: i * 0.06, lp: 2000 });
  },
  click: () => tone({ type: 'square', f0: 1800, dur: 0.025, vol: 0.09 }),

  // Story moments
  slide: () => tone({ type: 'sine', f0: 380, f1: 1500, dur: 0.38, vol: 0.18, vib: 7, vibDepth: 20 }),        // slide whistle (title cards)
  door: () => { tone({ type: 'sine', f0: 900, f1: 300, dur: 0.12, vol: 0.2 }); tone({ type: 'sine', f0: 400, f1: 1600, dur: 0.3, vol: 0.14, at: 0.1 }); },
  tada: () => {
    notes([[523, 0, 0.1], [659, 0.1, 0.1], [784, 0.2, 0.1]], { type: 'square', vol: 0.11 });
    [523, 659, 784, 1047].forEach((f) => tone({ type: 'square', f0: f, dur: 0.6, vol: 0.06, at: 0.32, vib: 6, vibDepth: 4 }));
  },
  sadTrombone: () => {
    const o = { type: 'sawtooth', vol: 0.13, lp: 1100 };
    tone({ ...o, f0: 392, dur: 0.32, at: 0 });
    tone({ ...o, f0: 370, dur: 0.32, at: 0.34 });
    tone({ ...o, f0: 349, dur: 0.32, at: 0.68 });
    tone({ ...o, f0: 330, f1: 320, dur: 1.0, at: 1.02, vib: 5, vibDepth: 9 });
  },
  fanfare: () => {
    notes([[392, 0, 0.12], [523, 0.13, 0.12], [659, 0.26, 0.12], [784, 0.39, 0.3], [659, 0.7, 0.12], [784, 0.83, 0.7]], { type: 'square', vol: 0.1 });
    [392, 523, 659].forEach((f) => tone({ type: 'triangle', f0: f, dur: 0.8, vol: 0.06, at: 0.83 }));
  },
  tick: () => tone({ type: 'square', f0: 1400, dur: 0.03, vol: 0.08 }),

  // Minigame specials
  type: () => noise({ dur: 0.025, vol: 0.12, type: 'highpass', f0: 2500 + Math.random() * 2000 }),            // keyboard clack
  siren: () => [0, 0.25, 0.5, 0.75].forEach((at, i) => tone({ type: 'square', f0: i % 2 ? 660 : 880, dur: 0.24, vol: 0.12, at, lp: 2500 })),
  wail: () => { // police-style siren sweeping up and down
    tone({ type: 'sawtooth', f0: 600, f1: 1250, dur: 0.75, vol: 0.09, lp: 2200 });
    tone({ type: 'sawtooth', f0: 1250, f1: 600, dur: 0.75, vol: 0.09, at: 0.75, lp: 2200 });
  },
  honk: () => [0, 0.32].forEach((at) => { tone({ type: 'square', f0: 330, dur: 0.22, vol: 0.1, at, lp: 1200 }); tone({ type: 'square', f0: 415, dur: 0.22, vol: 0.08, at, lp: 1200 }); }),
  whistle: () => tone({ type: 'sine', f0: 2400, dur: 0.22, vol: 0.12, vib: 40, vibDepth: 150 }),               // referee whistle
  ding: () => tone({ type: 'sine', f0: 1046, dur: 0.3, vol: 0.2 }),
  buzzer: () => tone({ type: 'sawtooth', f0: 110, dur: 0.35, vol: 0.14, lp: 700 }),
  snore: () => { noise({ dur: 0.7, vol: 0.12, type: 'lowpass', f0: 250, f1: 500 }); tone({ type: 'sawtooth', f0: 70, f1: 90, dur: 0.7, vol: 0.05, lp: 300 }); },
  powerUp: () => tone({ type: 'square', f0: 200, f1: 1600, dur: 0.5, vol: 0.1, vib: 18, vibDepth: 30 }),
};
