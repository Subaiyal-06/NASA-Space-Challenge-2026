// CLOCK CONTRACT (Member 2 builds the store in src/state/clock.js). This file only describes it,
// so the dev panel and tests can check that the real clock has everything agreed.

export const CLOCK_STATE = ["year", "month", "mode", "playing", "speed", "pacing", "tension", "interest",
  "cityA", "cityB", "scenario", "futureEnabled", "layers"];
export const CLOCK_ACTIONS = ["play", "pause", "toggle", "stepMonth", "setYear", "setMonth", "seek", "leap",
  "setMode", "setSpeed", "selectCity", "setLayers"];
export const CLOCK_EVENTS = ["tick", "story", "badge", "quake", "pacing", "calm", "cityChange"];
export const MONTH_SECONDS = 2.5; // Month Mode speed

/** Pass the clock state object (for a Zustand store: store.getState()). Returns a list of problems. */
export function validateClock(state) {
  const problems = [];
  for (const k of CLOCK_STATE) if (!(k in state)) problems.push(`clock: missing state "${k}"`);
  for (const a of CLOCK_ACTIONS) if (typeof state[a] !== "function") problems.push(`clock: missing action "${a}"`);
  if ("month" in state && !(state.month >= 0 && state.month <= 11)) problems.push("clock: month must be 0-11");
  if ("mode" in state && !["month", "year", "story"].includes(state.mode)) problems.push('clock: mode must be "month", "year" or "story"');
  return problems;
}
