// Shared constants and helpers used by every level.
export const WIDTH = 320;    // logical screen size in pixels
export const HEIGHT = 180;
export const GROUND_Y = 150; // y of the walkable surface, the same in every level

// Deterministic pseudo-random number in [0, 1) from an integer,
// so scenery looks random but stays the same every frame.
export function hash(n) {
  let h = Math.imul(n | 0, 0x27d4eb2d) ^ 0x9e3779b9;
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
