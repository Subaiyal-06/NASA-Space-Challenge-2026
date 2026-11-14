// AUDIO API (contract): the only file other code may import from src/audio/.
// Do NOT rename these functions. Member 2 calls them; the clock drives setMonth/setTension.
import { startEngine, stopEngine, isRunning, onBar, getBar, setEngineTension, applyMonthValues, BAR_SECONDS } from "./engine.js";
import { computeMonthValues, ALL_LAYERS } from "./mapping.js";

const state = { city: null, compare: null, year: null, month: null, layers: [...ALL_LAYERS], tension: 0, mode: "month" };
const log = (...a) => console.log("[audio]", ...a);

// Recompute what the instruments should do from the current city, date and layer switches.
function refresh(fire) {
  if (state.year == null || state.month == null) return;
  applyMonthValues(computeMonthValues(state.city, state.year, state.month, state.layers), fire);
}

export async function start() { await startEngine(); log("started"); }
export function stop() { stopEngine(); log("stopped"); }

export function setCity(cityData) { state.city = cityData; log("setCity", cityData?.city); refresh(false); }
export function setCompare(cityDataOrNull) { state.compare = cityDataOrNull; log("setCompare (S11, not yet)", cityDataOrNull?.city ?? null); }
// month is 0-11. Call this when the clock moves to a new month.
export function setMonth(year, month) { state.year = year; state.month = month; refresh(true); }
// Which categories are switched on: ["temperature","rainfall","drought","quakes","air"]
export function setLayers(layers) { state.layers = [...layers]; refresh(false); }
export function setTension(x) { state.tension = Math.min(1, Math.max(0, x)); setEngineTension(state.tension); }
export function setMode(mode) { state.mode = mode; log("setMode (S13, not yet)", mode); }

// Extras for the test page and for Member 2 (read-only, safe to use)
export const isPlaying = isRunning;
export const onNewBar = onBar;
export const currentBar = getBar;
export const BAR_LENGTH_SECONDS = BAR_SECONDS;
export const LAYER_NAMES = ALL_LAYERS;
export const _state = state;
