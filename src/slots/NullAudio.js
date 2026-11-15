// NullAudio: the placeholder audio engine. Makes no sound; records every call so the dev panel
// (and the music teammate) can see exactly what the app sends.
import { create } from "zustand";
import { AUDIO_REQUIRED, AUDIO_OPTIONAL } from "../contracts/audio.js";

export const useAudioLog = create((set) => ({
  calls: [], // [{ time, method, args }] (newest last, max 200)
  clear: () => set({ calls: [] }),
}));

export function createNullAudio() {
  const engine = {};
  for (const method of [...AUDIO_REQUIRED, ...AUDIO_OPTIONAL]) {
    engine[method] = async (...args) => {
      useAudioLog.setState((s) => ({ calls: [...s.calls.slice(-199), { time: Date.now(), method, args }] }));
    };
  }
  engine.getLevels = () => null; // no sound, so nothing for the visualizer to show
  engine.isNull = true;
  return engine;
}
