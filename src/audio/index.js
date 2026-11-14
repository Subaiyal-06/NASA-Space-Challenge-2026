// AUDIO API (contract): the only file other code may import from src/audio/.
// start/stop are real. The rest store their value and log it; later steps (S6, S7, S11, S13)
// fill in the sound. DO NOT rename these functions.
import { startEngine, stopEngine, isRunning, onBar, getBar, setEngineTension, BAR_SECONDS } from "./engine.js";

const state = { city: null, compare: null, year: null, month: null, layers: [], tension: 0, mode: "month" };
const log = (...a) => console.log("[audio]", ...a);

export async function start() { await startEngine(); log("started"); }
export function stop() { stopEngine(); log("stopped"); }

export function setCity(cityData) { state.city = cityData; log("setCity", cityData?.city); }
export function setCompare(cityDataOrNull) { state.compare = cityDataOrNull; log("setCompare", cityDataOrNull?.city ?? null); }
export function setMonth(year, month) { state.year = year; state.month = month; log("setMonth", year, month); }
export function setLayers(layers) { state.layers = [...layers]; log("setLayers", layers); }
export function setTension(x) { state.tension = Math.min(1, Math.max(0, x)); setEngineTension(state.tension); }
export function setMode(mode) { state.mode = mode; log("setMode", mode); }

// Extras for the test page and for Member 2 (read-only, safe to use)
export const isPlaying = isRunning;
export const onNewBar = onBar;
export const currentBar = getBar;
export const BAR_LENGTH_SECONDS = BAR_SECONDS;
export const _state = state;
