// App settings (Zustand), saved in the browser's local storage so they survive restarts.
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { LAYER_IDS } from "../contracts/audio.js";

const memory = new Map(); // fallback when localStorage is not available (for example in tests)
const storage = createJSONStorage(() =>
  typeof localStorage !== "undefined"
    ? localStorage
    : { getItem: (k) => memory.get(k) ?? null, setItem: (k, v) => memory.set(k, v), removeItem: (k) => memory.delete(k) });

const systemReducesMotion = () =>
  typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export const DEFAULT_SETTINGS = {
  reduceMotion: systemReducesMotion(), // starts from the system setting; the toggle can change it
  layers: [...LAYER_IDS], // enabled layers
  showGhostAlways: false, // "Show the 1980s" toggle
  voiceAnnouncer: false,
  muted: false,
};

export const useSettings = create(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      setReduceMotion: (v) => set({ reduceMotion: !!v }),
      setLayers: (layers) => set({ layers: layers.filter((l) => LAYER_IDS.includes(l)) }),
      toggleLayer: (id) => set((s) => ({ layers: s.layers.includes(id) ? s.layers.filter((l) => l !== id) : [...s.layers, id] })),
      setShowGhostAlways: (v) => set({ showGhostAlways: !!v }),
      setVoiceAnnouncer: (v) => set({ voiceAnnouncer: !!v }),
      setMuted: (v) => set({ muted: !!v }),
      reset: () => set({ ...DEFAULT_SETTINGS }),
    }),
    { name: "earth-jukebox-settings", storage, version: 1 },
  ),
);
