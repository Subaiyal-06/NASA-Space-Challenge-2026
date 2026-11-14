// A small list of warnings (crashed slots, bad modules, bad props) shown later in the dev panel.
import { create } from "zustand";

export const useWarnings = create((set) => ({
  warnings: [],
  clear: () => set({ warnings: [] }),
}));

export function reportWarning(source, message) {
  console.warn(`[${source}] ${message}`);
  useWarnings.setState((s) => {
    const last = s.warnings[s.warnings.length - 1];
    if (last && last.source === source && last.message === message) return s; // skip exact repeats
    return { warnings: [...s.warnings.slice(-99), { time: Date.now(), source, message }] };
  });
}
