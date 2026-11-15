// One-off effects shared between the weather on the disc and the screen edges: lightning flashes and earthquakes.
import { create } from "zustand";

/** Lightning is never rapid: at most one flash every 4 seconds (README safety rule). Exported for tests. */
export const MIN_FLASH_GAP_MS = 4000;

export function createFlashGovernor(minGapMs = MIN_FLASH_GAP_MS) {
  let last = -Infinity;
  return {
    /** true (and remembers the time) only if enough time has passed since the last flash */
    tryFlash(now = Date.now()) { if (now - last < minGapMs) return false; last = now; return true; },
    reset() { last = -Infinity; },
  };
}

/** A random wait before the next flash: always at least the minimum gap, usually a little more. */
export const nextFlashDelay = (rand = Math.random, minGapMs = MIN_FLASH_GAP_MS) => minGapMs + 300 + rand() * 3500;

export const useFx = create((set) => ({
  flash: 0, // counts up on each lightning flash (watchers restart their animation)
  quake: 0, quakeMagnitude: 0,
  flashNow: () => set((s) => ({ flash: s.flash + 1 })),
  quakeNow: (magnitude) => set((s) => ({ quake: s.quake + 1, quakeMagnitude: magnitude })),
}));
