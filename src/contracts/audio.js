// AUDIO CONTRACT (the music teammate delivers a module that follows this).
// The module default-exports a factory: createAudioEngine() -> engine.
// The engine never reads our store or the JSON files. It only uses what it is given.

/**
 * @typedef {Object} AudioPayload   what setMonth() receives (plain data only)
 * @property {number} year
 * @property {number} month            0-11
 * @property {"month"|"year"|"story"} mode
 * @property {number} tension          0-1
 * @property {number} interest         0-1
 * @property {Object} snapshotA        output of getSnapshot() for the first city
 * @property {Object|null} snapshotB   second city when comparing, else null
 */

export const AUDIO_REQUIRED = ["start", "stop", "setMonth", "setLayers", "setMode", "setPacing", "setMuted"];
export const AUDIO_OPTIONAL = ["setCity", "setCompare", "setTension", "dispose", "getLevels"];
export const LAYER_IDS = ["temperature", "rainfall", "drought", "quakes", "air"];

/** Sample arguments used by the contract test and the placeholders. */
export const SAMPLE_AUDIO_PAYLOAD = {
  year: 1981, month: 5, mode: "month", tension: 0.3, interest: 0.2,
  snapshotA: { year: 1981, month: 5, isProjection: false, layers: {}, tension: 0.3, interest: 0.2 },
  snapshotB: null,
};
const SAMPLE_ARGS = {
  start: [], stop: [], setMonth: [SAMPLE_AUDIO_PAYLOAD], setLayers: [LAYER_IDS], setMode: ["month"],
  setPacing: ["normal"], setMuted: [false], setCity: [{ city: "Sample" }], setCompare: [null], setTension: [0.5], dispose: [], getLevels: [],
};

/** Checks that an engine has every required method. Returns a list of problems (empty = OK). */
export function validateAudioEngine(engine) {
  const problems = [];
  if (!engine || typeof engine !== "object") return ["audio: createAudioEngine() must return an object"];
  for (const m of AUDIO_REQUIRED) if (typeof engine[m] !== "function") problems.push(`audio: required method "${m}" is missing or not a function`);
  for (const m of AUDIO_OPTIONAL) if (m in engine && typeof engine[m] !== "function") problems.push(`audio: optional "${m}" must be a function if present`);
  return problems;
}

/** Calls every method once with sample data. Returns [{ method, required, ok, error }]. Used by the dev panel. */
export async function testAudioEngine(engine) {
  const results = [];
  for (const m of [...AUDIO_REQUIRED, ...AUDIO_OPTIONAL]) {
    const required = AUDIO_REQUIRED.includes(m);
    if (typeof engine?.[m] !== "function") { results.push({ method: m, required, ok: !required, error: required ? "missing" : "not implemented (optional)" }); continue; }
    try { await engine[m](...SAMPLE_ARGS[m]); results.push({ method: m, required, ok: true }); }
    catch (e) { results.push({ method: m, required, ok: false, error: e?.message ?? String(e) }); }
  }
  return results;
}
