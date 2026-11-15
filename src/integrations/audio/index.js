// MUSIC MODULE (follows the audio contract in src/contracts/audio.js). Default export: createAudioEngine().
// Our own original A-minor, Interstellar-style music: a drone, pad, arpeggio, strings and a pulse that build as
// the climate "tension" rises, plus data instruments (rain, earthquake, drought, haze, heat).
// It never reads the app's store or the JSON files: it only uses what it is given.
// Tone.js is loaded the first time start() is called (from the Start button), not before.
import { computeMonthValues, ALL_LAYERS } from "./mapping.js";

export default function createAudioEngine() {
  const state = { layers: [...ALL_LAYERS], snapshot: null, snapshotB: null, sigA: "", sigB: "", tension: 0, mode: "month", pacing: "normal", muted: false, core: null, building: null };

  // Build the sound once, on first start. Returns null (and warns) if this computer cannot play audio.
  async function ensureCore() {
    if (state.core) return state.core;
    if (!state.building) {
      state.building = (async () => {
        const { buildCore } = await import("./core.js");
        const Tone = await import("tone");
        // Steady beats a quick response here (it is ambient music, not an instrument): a bigger audio buffer and more
        // scheduling lead time, so a short stall of the window (stretching it, a busy computer) does not make it stutter.
        // Must happen before any sound node is created.
        try { Tone.setContext(new Tone.Context({ latencyHint: "playback", lookAhead: 0.4 })); } catch { /* keep the default context */ }
        await Tone.start(); // must come from a user click; the Electron app also allows autoplay
        const core = await buildCore();
        core.setMuted(state.muted);
        core.setTension(state.tension);
        core.setSkipping(state.pacing === "skipping");
        const [a, b] = valuesNow();
        core.applyMonth(a, false, b, false);
        state.core = core;
        return core;
      })().catch((e) => { console.warn("[audio] Could not start sound:", e?.message ?? e); state.building = null; return null; });
    }
    return state.building;
  }

  // While comparing, both cities play at once: fewer rain notes each so the two stay clear of each other
  const forCompare = (v, comparing) => (v && comparing ? { ...v, rainNotes: Math.ceil(v.rainNotes * 0.6) } : v);
  const valuesNow = () => {
    const comparing = !!state.snapshotB;
    const a = forCompare(computeMonthValues(state.snapshot, state.layers), comparing);
    const b = comparing ? forCompare(computeMonthValues(state.snapshotB, state.layers), true) : null;
    return [a, b];
  };
  const refresh = (fireA, fireB = fireA) => { const [a, b] = valuesNow(); state.core?.applyMonth(a, fireA, b, fireB); };

  return {
    async start() { const core = await ensureCore(); core?.start(); },
    stop() { state.core?.stop(); state.sigA = ""; state.sigB = ""; }, // the next start plays its month again

    // Called every time the clock moves to a new month
    setMonth(payload) {
      state.snapshot = payload.snapshotA ?? null;
      state.snapshotB = payload.snapshotB ?? null;
      // one-off sounds (rain notes, quake boom) play only when that city's month really changed, so adding or
      // removing the second city never replays the first city's sounds
      const key = `${payload.year}-${payload.month}`;
      const sigA = key + JSON.stringify(state.snapshot); const sigB = key + JSON.stringify(state.snapshotB);
      const fireA = sigA !== state.sigA; const fireB = !!state.snapshotB && sigB !== state.sigB;
      state.sigA = sigA; state.sigB = sigB;
      state.tension = payload.tension ?? 0;
      state.core?.setTension(state.tension);
      refresh(fireA, fireB);
    },
    setLayers(ids) { state.layers = [...ids]; refresh(false); },
    setMode(mode) { state.mode = mode; },
    setPacing(pacing) { state.pacing = pacing; state.core?.setSkipping(pacing === "skipping"); },
    setMuted(muted) { state.muted = !!muted; state.core?.setMuted(state.muted); },

    // Optional methods
    setCity() {}, // not needed: the data arrives with every setMonth
    setCompare() {}, // not needed: the second city arrives as snapshotB with every setMonth (city A left, city B right)
    setTension(x) { state.tension = x; state.core?.setTension(x); },
    dispose() { state.core?.dispose(); state.core = null; state.building = null; },

    /** Optional, for the visualizer: { frequency: [0..1], waveform: [-1..1] } or null before the sound has started. */
    getLevels() { return state.core?.getLevels() ?? null; },
  };
}
