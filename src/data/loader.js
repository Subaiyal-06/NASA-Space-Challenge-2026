// Loads city files listed in data/index.json. Vite bundles the JSON into the app, so it works offline.
// To switch a city from sample to real data: put the real file in data/cities/ and change its
// "file" line in data/index.json. No code change needed.
import index from "../../data/index.json";
import { validateCity } from "./validate.js";

const files = import.meta.glob("../../data/cities/*.json"); // lazy: loaded only when asked
const cache = new Map();

export const getCityList = () => index.map(({ id, name, lat, lon }) => ({ id, name, lat, lon }));

export async function loadCity(id) {
  if (cache.has(id)) return cache.get(id);
  const entry = index.find((c) => c.id === id);
  if (!entry) throw new Error(`Unknown city "${id}". Known cities: ${index.map((c) => c.id).join(", ")}`);
  const loader = files[`../../data/${entry.file}`];
  if (!loader) throw new Error(`data/index.json says city "${id}" is in "${entry.file}", but that file does not exist.`);
  const data = (await loader()).default;
  const problems = validateCity(data);
  if (problems.length) console.warn(`[data] ${id} has problems:`, problems);
  cache.set(id, data);
  return data;
}

// Used by getSnapshot when it is given a city id instead of a city object.
export const getLoadedCity = (id) => cache.get(id);
