// Studio flow state: which screen the visitor is on and which city is chosen.
// The city choice is also sent to the shared clock, so music, charts and weather follow it.
import { create } from "zustand";
import { useClock } from "../state/clock.js";

export const useStudio = create((set, get) => ({
  phase: "intro", // "intro" (spinning globe) -> "zooming" (flying into Pakistan) -> "explore" (pins are up)
  selectedId: null,

  start: () => { if (get().phase === "intro") set({ phase: "zooming" }); },
  arrived: () => set({ phase: "explore" }),
  select: (id) => {
    set({ selectedId: id });
    Promise.resolve(useClock.getState().selectCity(id, "A")).catch(() => {});
  },
  clear: () => set({ selectedId: null }),
}));
