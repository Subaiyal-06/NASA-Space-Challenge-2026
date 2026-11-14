// DATA API (contract): the ONLY way the rest of the app reads city data. Never read the JSON directly.
// month is always 0-11 (0 = January).
import { getCityList, loadCity, getLoadedCity } from "./loader.js";

export { getCityList, loadCity };

const pctCache = new WeakMap(); // city -> per-calendar-month sorted rainfall values

// Where this month's rainfall sits among the same calendar month in all years of the data (0-100).
function rainPercentile(city, year, month, value) {
  let byMonth = pctCache.get(city);
  if (!byMonth) {
    byMonth = Array.from({ length: 12 }, () => []);
    for (const row of Object.values(city.layers.rainfall?.monthly ?? {})) row.forEach((v, m) => byMonth[m].push(v));
    byMonth.forEach((a) => a.sort((x, y) => x - y));
    pctCache.set(city, byMonth);
  }
  const arr = byMonth[month];
  if (!arr.length) return null;
  const below = arr.filter((v) => v < value).length;
  return Math.round((below / arr.length) * 100);
}

const layerValue = (layer, year, month) => layer?.monthly?.[year]?.[month];
const started = (layer, year) => !!layer && year >= (layer.startYear ?? -Infinity);

// Last year that has any measured data (years after this are projections).
function lastDataYear(city) {
  let last = -Infinity;
  for (const key of ["temperature", "rainfall", "drought", "air"])
    for (const y of Object.keys(city.layers[key]?.monthly ?? {})) last = Math.max(last, +y);
  return last;
}

// getSnapshot(city, year, month): everything the app needs to know about one month.
// `city` is the object from loadCity(). A city id is also accepted if loadCity(id) was called before.
export function getSnapshot(cityOrId, year, month) {
  const city = typeof cityOrId === "string" ? getLoadedCity(cityOrId) : cityOrId;
  if (!city) throw new Error(`getSnapshot: city "${cityOrId}" is not loaded. Call loadCity("${cityOrId}") first.`);
  const L = city.layers;

  const temp = layerValue(L.temperature, year, month);
  const rain = layerValue(L.rainfall, year, month);
  const spi = layerValue(L.drought, year, month);
  const aod = layerValue(L.air, year, month);

  return {
    year,
    month,
    isProjection: year > lastDataYear(city),
    layers: {
      temperature: { available: started(L.temperature, year) && temp != null, anomaly: temp ?? null, value: temp ?? null },
      rainfall: {
        available: started(L.rainfall, year) && rain != null,
        percentile: rain != null ? rainPercentile(city, year, month, rain) : null,
        value: rain ?? null,
      },
      drought: { available: started(L.drought, year) && spi != null, spi: spi ?? null },
      air: { available: started(L.air, year) && aod != null, aod: aod ?? null },
      quakes: (L.earthquakes?.events ?? [])
        .filter((e) => e.year === year && e.month - 1 === month)
        .map((e) => ({ magnitude: e.mag, depth: e.depth, lat: e.lat, lon: e.lon })),
    },
    // Optional in the data files. Fallback calculation comes in step C5.
    tension: city.tension?.[year]?.[month] ?? 0,
    interest: city.interest?.[year]?.[month] ?? 0,
  };
}
