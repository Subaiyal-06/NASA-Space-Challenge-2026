// DATA API (contract): the ONLY way the rest of the app reads city data. Never read the JSON directly.
// month is always 0-11 (0 = January). Functions accept a city object from loadCity() or, once
// loadCity(id) has been called, the city id.
import { getCityList, loadCity, getLoadedCity, getDataNotes } from "./loader.js";
import { getBaseline, getTension, getInterest, getRecords, dataYears, quakeFloor } from "./derived.js";
import { DATA_CONFIG } from "./config.js";

export { getCityList, loadCity, getDataNotes };

const stories = Object.values(import.meta.glob("../../data/stories.json", { eager: true, import: "default" }))[0] ?? [];

function resolve(cityOrId, fn) {
  const city = typeof cityOrId === "string" ? getLoadedCity(cityOrId) : cityOrId;
  if (!city) throw new Error(`${fn}: city "${cityOrId}" is not loaded. Call loadCity("${cityOrId}") first.`);
  return city;
}

const layerValue = (layer, year, month) => layer?.monthly?.[year]?.[month];
const started = (layer, year) => !!layer && year >= (layer.startYear ?? -Infinity);
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

// ---------- helpers ----------
const pctCache = new WeakMap(); // city -> per-calendar-month sorted rainfall values

// Where a rainfall value sits among the same calendar month in all years of the data (0-100).
function rainPercentile(city, month, value) {
  let byMonth = pctCache.get(city);
  if (!byMonth) {
    byMonth = Array.from({ length: 12 }, () => []);
    for (const row of Object.values(city.layers.rainfall?.monthly ?? {})) row.forEach((v, m) => byMonth[m].push(v));
    byMonth.forEach((a) => a.sort((x, y) => x - y));
    pctCache.set(city, byMonth);
  }
  const arr = byMonth[month];
  if (!arr.length) return null;
  return Math.round((arr.filter((v) => v < value).length / arr.length) * 100);
}

// Last year with any measured data (later years are projections).
function lastDataYear(city) {
  const ys = dataYears(city);
  return ys.length ? ys[ys.length - 1] : -Infinity;
}

// A projection only counts if it names its source (see adapters). Returns { year: anomaly } or null.
function projectionPoints(city, scenario) {
  const p = city.projection;
  if (!scenario || !p?.source) return null;
  const pts = p.temperature?.[scenario];
  return pts && Object.keys(pts).length ? pts : null;
}

// Straight-line path from the last measured year's mean anomaly to the projected points.
// ASSUMPTION: projected values use the same baseline as the temperature layer.
function projectedAnomaly(city, year, scenario) {
  const pts = projectionPoints(city, scenario);
  const last = lastDataYear(city);
  if (!pts || year <= last) return null;
  const row = city.layers.temperature?.monthly?.[last];
  if (!row) return null;
  const path = [[last, row.reduce((s, x) => s + x, 0) / 12], ...Object.entries(pts).map(([y, v]) => [+y, v]).sort((a, b) => a[0] - b[0])];
  if (year > path[path.length - 1][0]) return null;
  for (let i = 1; i < path.length; i++) {
    if (year <= path[i][0]) {
      const [y0, v0] = path[i - 1], [y1, v1] = path[i];
      return Math.round((v0 + ((v1 - v0) * (year - y0)) / (y1 - y0)) * 100) / 100;
    }
  }
  return null;
}

const emptyLayers = () => ({
  temperature: { available: false, anomaly: null, value: null },
  rainfall: { available: false, percentile: null, value: null },
  drought: { available: false, spi: null },
  air: { available: false, aod: null },
  quakes: [],
});

// ---------- getRange ----------
// { startYear, endYear, layerStartYears }. Give a scenario ("ssp245"...) to extend endYear into projected years.
export function getRange(cityOrId, scenario) {
  const city = resolve(cityOrId, "getRange");
  const L = city.layers;
  const first = (layer) => (layer ? layer.startYear ?? Math.min(...Object.keys(layer.monthly ?? {}).map(Number)) : null);
  const quakeYears = (L.earthquakes?.events ?? []).map((e) => e.year);
  const layerStartYears = {
    temperature: first(L.temperature), rainfall: first(L.rainfall), drought: first(L.drought), air: first(L.air),
    quakes: quakeYears.length ? Math.min(...quakeYears) : null,
  };
  for (const [name, layer] of Object.entries(L)) // extra layers (vegetation, aqi, nightlights, ...)
    if (!DATA_CONFIG.coreLayers.includes(name)) layerStartYears[name] = layer.startYear ?? null;
  const starts = ["temperature", "rainfall", "drought", "air"].map((k) => layerStartYears[k]).filter((v) => v != null);
  const pts = projectionPoints(city, scenario);
  return {
    startYear: Math.min(...starts),
    endYear: pts ? Math.max(...Object.keys(pts).map(Number)) : lastDataYear(city),
    layerStartYears,
  };
}

// ---------- getSnapshot ----------
// Everything the app needs to know about one month. `scenario` is optional and only matters for projected years.
export function getSnapshot(cityOrId, year, month, scenario) {
  const city = resolve(cityOrId, "getSnapshot");
  const L = city.layers;
  const isProjection = year > lastDataYear(city);
  const layers = emptyLayers();

  if (isProjection) {
    const a = projectedAnomaly(city, year, scenario);
    if (a != null) {
      layers.temperature = { available: true, anomaly: a, value: a };
      return { year, month, isProjection, layers, tension: Math.round(0.35 * clamp(a / 1.5, 0, 1) * 100) / 100, interest: 0 };
    }
    return { year, month, isProjection, layers, tension: 0, interest: 0 };
  }

  const temp = layerValue(L.temperature, year, month);
  const rain = layerValue(L.rainfall, year, month);
  const spi = layerValue(L.drought, year, month);
  const aod = layerValue(L.air, year, month);
  layers.temperature = { available: started(L.temperature, year) && temp != null, anomaly: temp ?? null, value: temp ?? null };
  layers.rainfall = {
    available: started(L.rainfall, year) && rain != null,
    percentile: rain != null ? rainPercentile(city, month, rain) : null,
    value: rain ?? null,
  };
  layers.drought = { available: started(L.drought, year) && spi != null, spi: spi ?? null };
  layers.air = { available: started(L.air, year) && aod != null, aod: aod ?? null };
  layers.quakes = (L.earthquakes?.events ?? [])
    .filter((e) => e.year === year && e.month - 1 === month && e.mag >= quakeFloor(city))
    .map((e) => ({ magnitude: e.mag, depth: e.depth, lat: e.lat, lon: e.lon }));

  return { year, month, isProjection, layers, tension: getTension(city, year, month), interest: getInterest(city, year, month) };
}

// ---------- getExtras ----------
// Layers beyond the core five (for example vegetation = greenery, aqi, nightlights), for one month.
// Returns { <layerName>: { available, value, unit, source } } for every extra layer the city file has.
// This is an ADDITION to the snapshot contract: nothing existing changes, and the UI/music teammates can
// adopt it when they are ready. Yearly layers (nightlights) give the same value for every month of a year.
export function getExtras(cityOrId, year, month) {
  const city = resolve(cityOrId, "getExtras");
  const out = {};
  for (const [name, layer] of Object.entries(city.layers)) {
    if (DATA_CONFIG.coreLayers.includes(name)) continue;
    const value = layer.monthly ? layer.monthly[year]?.[month] : layer.yearly?.[year];
    out[name] = { available: started(layer, year) && value != null, value: value ?? null, unit: layer.unit ?? null, source: layer.source };
  }
  return out;
}

// ---------- getBaselineSnapshot ----------
// Same shape as getSnapshot, but the 1981-1990 average for that calendar month (used for "ghost weather").
// year is null and isBaseline is true. Layers the city does not have are unavailable.
export function getBaselineSnapshot(cityOrId, month) {
  const city = resolve(cityOrId, "getBaselineSnapshot");
  const b = getBaseline(city);
  const layers = emptyLayers();
  if (b.temperature) layers.temperature = { available: true, anomaly: b.temperature[month], value: b.temperature[month] };
  if (b.rainfall) layers.rainfall = { available: true, percentile: rainPercentile(city, month, b.rainfall[month]), value: b.rainfall[month] };
  if (b.drought) layers.drought = { available: true, spi: b.drought[month] };
  if (b.air) layers.air = { available: true, aod: b.air[month] };
  const years = dataYears(city).filter((y) => y >= 1981 && y <= 1990);
  const avg = (fn) => (years.length ? Math.round((years.reduce((s, y) => s + fn(city, y, month), 0) / years.length) * 100) / 100 : 0);
  return { year: null, month, isBaseline: true, isProjection: false, layers, tension: avg(getTension), interest: avg(getInterest) };
}

// ---------- getSeries ----------
// Values over time for charts: [{ year, month, value }]. layer: temperature, rainfall, drought, air,
// tension, interest or quakes (quakes lists only months that had an earthquake; value = magnitude).
export function getSeries(cityOrId, layer, fromYear, toYear) {
  const city = resolve(cityOrId, "getSeries");
  const out = [];
  if (layer === "quakes") {
    for (const e of city.layers.earthquakes?.events ?? [])
      if (e.year >= fromYear && e.year <= toYear && e.mag >= quakeFloor(city)) out.push({ year: e.year, month: e.month - 1, value: e.mag });
    return out.sort((a, b) => a.year - b.year || a.month - b.month);
  }
  const extra = city.layers[layer];
  if (extra && !DATA_CONFIG.coreLayers.includes(layer)) { // vegetation, aqi, nightlights, ...
    for (const y of Object.keys(extra.monthly ?? extra.yearly ?? {}).map(Number).sort((a, b) => a - b)) {
      if (y < fromYear || y > toYear) continue;
      if (extra.monthly) extra.monthly[y].forEach((v, m) => out.push({ year: y, month: m, value: v }));
      else out.push({ year: y, month: 0, value: extra.yearly[y] }); // yearly layers: one point per year (January)
    }
    return out;
  }
  const pick = {
    temperature: (y, m) => layerValue(city.layers.temperature, y, m),
    rainfall: (y, m) => layerValue(city.layers.rainfall, y, m),
    drought: (y, m) => layerValue(city.layers.drought, y, m),
    air: (y, m) => layerValue(city.layers.air, y, m),
    tension: (y, m) => getTension(city, y, m),
    interest: (y, m) => getInterest(city, y, m),
  }[layer];
  if (!pick) throw new Error(`getSeries: unknown layer "${layer}". Use temperature, rainfall, drought, air, tension, interest or quakes.`);
  for (const y of dataYears(city)) {
    if (y < fromYear || y > toYear) continue;
    for (let m = 0; m < 12; m++) { const v = pick(y, m); if (v != null) out.push({ year: y, month: m, value: v }); }
  }
  return out;
}

// ---------- getMarkers ----------
// { stories, badges } for the timeline. Badges are the record texts ("in our data"). Stories come from
// data/stories.json if the data team delivered it (optional: entries may have a `cities` list).
export function getMarkers(cityOrId) {
  const city = resolve(cityOrId, "getMarkers");
  const id = typeof cityOrId === "string" ? cityOrId : city.city?.toLowerCase();
  return {
    stories: stories.filter((s) => !s.cities || s.cities.includes(id)).sort((a, b) => a.year - b.year || (a.month ?? 0) - (b.month ?? 0)),
    badges: getRecords(city),
  };
}
