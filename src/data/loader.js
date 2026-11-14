// Loads city files listed in data/index.json. Vite bundles the JSON into the app, so it works offline.
// To switch a city from sample to real data: put the real file in data/cities/ and change its
// "file" line in data/index.json. No code change needed.
import index from "../../data/index.json";
import { checkCity } from "./validate.js";
import { applyAdapters } from "./adapters/index.js";

const files = import.meta.glob("../../data/cities/*.json"); // lazy: loaded only when asked
const cache = new Map();
const notes = new Map(); // what adapters and the validator said about each city

export const getCityList = () => index.map(({ id, name, lat, lon }) => ({ id, name, lat, lon }));

export async function loadCity(id) {
  if (cache.has(id)) return cache.get(id);
  const entry = index.find((c) => c.id === id);
  if (!entry) throw new Error(`Unknown city "${id}". Known cities: ${index.map((c) => c.id).join(", ")}`);
  const loader = files[`../../data/${entry.file}`];
  if (!loader) throw new Error(`data/index.json says city "${id}" is in "${entry.file}", but that file does not exist.`);
  const raw = (await loader()).default;
  const { city, notes: adapterNotes } = applyAdapters(raw);
  const { errors, warnings } = checkCity(city);
  const all = [...errors.map((e) => `ERROR ${e}`), ...warnings.map((w) => `WARN ${w}`), ...adapterNotes.map((n) => `NOTE ${n}`)];
  if (all.length) console.warn(`[data] ${id}:`, all);
  notes.set(id, all);
  cache.set(id, city);
  return city;
}

// Used by the API when it is given a city id instead of a city object.
export const getLoadedCity = (id) => cache.get(id);
// For the dev panel: everything the data layer had to say about a city.
export const getDataNotes = (id) => notes.get(id) ?? [];
