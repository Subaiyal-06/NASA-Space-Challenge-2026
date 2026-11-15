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
