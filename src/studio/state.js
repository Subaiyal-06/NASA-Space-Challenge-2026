// Studio flow state: which screen the visitor is on, which city is chosen, and the motion preference.
// The city choice is also sent to the shared clock, so music, charts and weather follow it.
import { useEffect, useState } from "react";
import { create } from "zustand";
import { useClock } from "../state/clock.js";

const MOTION_KEY = "earth-jukebox-studio-motion";
const readMotion = () => { try { const v = localStorage.getItem(MOTION_KEY); return v === "on" || v === "reduced" ? v : "auto"; } catch { return "auto"; } };

export const useStudio = create((set, get) => ({
  phase: "intro", // "intro" (spinning globe) -> "zooming" (flying into Pakistan) -> "explore" (pins are up)
  selectedId: null,
  // "auto" = follow the computer's setting (but say so on screen), "on" = animations on, "reduced" = calm mode
  motion: readMotion(),
  // Visual-only categories (greenery now, AQI and night lights later). true = shown. Core layers live in the clock.
  extras: { vegetation: true, aqi: true, nightlights: true },
  toggleExtra: (id) => set((s) => ({ extras: { ...s.extras, [id]: !s.extras[id] } })),

  start: () => { if (get().phase === "intro") set({ phase: "zooming" }); },
  arrived: () => set({ phase: "explore" }),
  select: (id) => {
    set({ selectedId: id });
    Promise.resolve(useClock.getState().selectCity(id, "A")).catch(() => {});
  },
  clear: () => set({ selectedId: null }),
  setMotion: (motion) => { try { localStorage.setItem(MOTION_KEY, motion); } catch { /* storage may be unavailable */ } set({ motion }); },
}));

const osQuery = () => (typeof window !== "undefined" && window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null);

/** { reduce, osAsksForLess, motion, setMotion }: reduce is what the UI should do right now. */
export function useMotion() {
  const motion = useStudio((s) => s.motion);
  const setMotion = useStudio((s) => s.setMotion);
  const [osAsksForLess, setOs] = useState(() => !!osQuery()?.matches);
  useEffect(() => {
    const q = osQuery();
    if (!q) return undefined;
    const on = () => setOs(q.matches);
    q.addEventListener?.("change", on);
    return () => q.removeEventListener?.("change", on);
  }, []);
  const reduce = motion === "reduced" || (motion === "auto" && osAsksForLess);
  return { reduce, osAsksForLess, motion, setMotion };
}

// ---- accessibility preferences (kept on this computer) ----
const A11Y_KEY = "earth-jukebox-studio-a11y";
const readA11y = () => { try { return { describe: true, highContrast: false, ...(JSON.parse(localStorage.getItem(A11Y_KEY)) ?? {}) }; } catch { return { describe: true, highContrast: false }; } };
const saveA11y = (s) => { try { localStorage.setItem(A11Y_KEY, JSON.stringify({ describe: s.describe, highContrast: s.highContrast })); } catch { /* storage may be unavailable */ } };

/** describe: keep a text description of the month up to date for screen readers. highContrast: stronger colours, no blur. */
export const useA11y = create((set, get) => ({
  ...readA11y(),
  setDescribe: (describe) => { set({ describe }); saveA11y(get()); },
  setHighContrast: (highContrast) => { set({ highContrast }); saveA11y(get()); },
}));
