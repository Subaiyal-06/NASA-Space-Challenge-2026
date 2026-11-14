// Loads and checks city JSON files from data/cities/.
// Vite bundles these files into the app, so it works offline (no server, no NASA calls).
import { validateCity } from "./validate.js";

const files = import.meta.glob("../../data/cities/*.json"); // lazy: loaded only when asked

// Names of available cities, e.g. "karachi.sample", "karachi", "lahore"
export function listCities() {
  return Object.keys(files).map((p) => p.split("/").pop().replace(".json", ""));
}

// loadCity("karachi") prefers the real file; falls back to "karachi.sample".
export async function loadCity(id) {
  const key = [`../../data/cities/${id}.json`, `../../data/cities/${id}.sample.json`].find((k) => files[k]);
  if (!key) throw new Error(`No data file for city "${id}". Available: ${listCities().join(", ")}`);
  const data = (await files[key]()).default;
  const problems = validateCity(data);
  if (problems.length) console.warn(`[data] ${id} has problems:`, problems);
  return data;
}

// Helpers shared by audio and UI: value for a given layer/year/month, or null if the layer has not started.
export function getValue(city, layer, year, month) {
  const arr = city?.layers?.[layer]?.monthly?.[year];
  return arr ? arr[month] : null;
}
export const getTension = (city, year, month) => city?.tension?.[year]?.[month] ?? 0;
export const getInterest = (city, year, month) => city?.interest?.[year]?.[month] ?? 0;
