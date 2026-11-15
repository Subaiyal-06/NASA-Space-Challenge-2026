// DERIVED VALUES: fallbacks computed from the raw layers when the data file lacks them.
// The data team's own values (tension, interest, baseline, records) ALWAYS win when present.
// Formulas follow README Section 7 (tension) and Feature 6B (interest). Both are OUR OWN indexes.
// Months are 0-11. A layer that is missing counts as 0.

import { DATA_CONFIG } from "./config.js";

const clamp = (x, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x));
const r2 = (x) => Math.round(x * 100) / 100;
const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const val = (layer, y, m) => layer?.monthly?.[y]?.[m];

export function dataYears(city) {
  const ys = new Set();
  for (const k of ["temperature", "rainfall", "drought", "air"])
    for (const y of Object.keys(city.layers[k]?.monthly ?? {})) ys.add(+y);
  return [...ys].sort((a, b) => a - b);
}

// ---------- baseline (1981-1990 average per calendar month) ----------
const baseCache = new WeakMap();
export function getBaseline(city) {
  if (baseCache.has(city)) return baseCache.get(city);
  const L = city.layers;
  const fromWindow = (layer, y0, y1) => {
    if (!layer) return null;
    const ys = Object.keys(layer.monthly ?? {}).map(Number).filter((y) => y >= y0 && y <= y1);
    if (!ys.length) return null;
    return Array.from({ length: 12 }, (_, m) => r2(mean(ys.map((y) => layer.monthly[y][m]))));
  };
  const airStart = L.air?.startYear;
  const out = {
    temperature: city.baseline?.temperature ?? fromWindow(L.temperature, 1981, 1990),
    rainfall: city.baseline?.rainfall ?? fromWindow(L.rainfall, 1981, 1990),
    drought: city.baseline?.drought ?? fromWindow(L.drought, 1981, 1990),
    // air: the first 10 years of that layer (README Feature 6B)
    air: city.baseline?.air ?? (airStart != null ? fromWindow(L.air, airStart, airStart + 9) : null),
  };
  baseCache.set(city, out);
  return out;
}

// Normal rainfall (mm) per calendar month: from the file, else the 1981-2010 average.
export function getRainNormals(city) {
  const given = city.layers.rainfall?.normals;
  if (given) return given;
  const rain = city.layers.rainfall;
  if (!rain) return null;
  const ys = Object.keys(rain.monthly ?? {}).map(Number).filter((y) => y >= 1981 && y <= 2010);
  return ys.length ? Array.from({ length: 12 }, (_, m) => mean(ys.map((y) => rain.monthly[y][m]))) : null;
}

// ---------- tension and interest ----------
const tableCache = new WeakMap();

function quakeLevel(events, y, m) {
  let best = 0;
  for (const e of events) {
    const age = (y - e.year) * 12 + (m + 1 - e.month); // months since the quake
    if (age >= 0 && age < 6) best = Math.max(best, (1 - age / 6) * clamp((e.mag - 5) / 3)); // fades over 6 months
  }
  return best;
}

const floorCache = new WeakMap();
/** The smallest earthquake magnitude reported for this city (see DATA_CONFIG): notable for where it is. */
export function quakeFloor(city) {
  if (floorCache.has(city)) return floorCache.get(city);
  const events = city.layers?.earthquakes?.events ?? [];
  const years = dataYears(city);
  const months = Math.max(1, years.length * 12);
  let floor = DATA_CONFIG.minQuakeMagnitude;
  for (const f of DATA_CONFIG.quakeFloors) {
    const shaken = new Set(events.filter((e) => e.mag >= f && years.includes(e.year)).map((e) => e.year * 12 + e.month)).size;
    if (shaken / months <= DATA_CONFIG.maxQuakeMonthShare) { floor = f; break; }
  }
  floorCache.set(city, floor);
  return floor;
}

function buildTables(city) {
  const L = city.layers;
  const normals = getRainNormals(city);
  const events = (L.earthquakes?.events ?? []).filter((e) => e.mag >= quakeFloor(city)); // same floor as the API
  const tension = {};
  const interest = {};
  for (const y of dataYears(city)) {
    tension[y] = [];
    interest[y] = [];
    for (let m = 0; m < 12; m++) {
      const a = val(L.temperature, y, m);
      const mm = val(L.rainfall, y, m);
      const spi = val(L.drought, y, m);
      const aod = val(L.air, y, m);
      const hot = a != null ? clamp(a / 1.5) : 0;
      const dry = spi != null ? clamp(-spi / 2.5) : 0;
      const haze = aod != null ? clamp(aod) : 0;
      const heavy = mm != null && normals ? clamp((mm - Math.max(2 * normals[m], 40)) / 200) : 0;
      const quake = quakeLevel(events, y, m);
      tension[y].push(r2(0.35 * hot + 0.25 * dry + 0.2 * haze + 0.1 * heavy + 0.1 * quake));
      const tempDev = a != null ? clamp(Math.abs(a) / 2) : 0;
      const rainDev = mm != null && normals ? clamp(Math.abs(mm - normals[m]) / (3 * normals[m] + 30)) : 0;
      interest[y].push(r2(Math.max(tempDev, rainDev, dry, quake, 0.6 * haze)));
    }
  }
  return { tension, interest };
}

function tables(city) {
  if (!tableCache.has(city)) tableCache.set(city, buildTables(city));
  return tableCache.get(city);
}

export const getTension = (city, y, m) => city.tension?.[y]?.[m] ?? tables(city).tension[y]?.[m] ?? 0;
export const getInterest = (city, y, m) => city.interest?.[y]?.[m] ?? tables(city).interest[y]?.[m] ?? 0;

// ---------- records (badges). Always worded "in our data". ----------
export function getRecords(city) {
  if (Array.isArray(city.records) && city.records.length) return city.records;
  const L = city.layers;
  const out = [];
  const full = (layer) => Object.keys(layer?.monthly ?? {}).filter((y) => layer.monthly[y].length === 12);
  if (L.temperature) {
    const flat = Object.entries(L.temperature.monthly).flatMap(([y, row]) => row.map((v, m) => ({ v, y: +y, m })));
    flat.sort((a, b) => b.v - a.v).slice(0, 3).forEach((r) => out.push({ year: r.y, month: r.m + 1, layer: "temperature", text: `One of the hottest months vs normal in our data (${MONTHS[r.m]})` }));
  }
  if (L.rainfall) {
    const flat = Object.entries(L.rainfall.monthly).flatMap(([y, row]) => row.map((v, m) => ({ v, y: +y, m })));
    flat.sort((a, b) => b.v - a.v).slice(0, 3).forEach((r) => out.push({ year: r.y, month: r.m + 1, layer: "rainfall", text: `One of the wettest months in our data (${MONTHS[r.m]})` }));
    const totals = full(L.rainfall).map((y) => [y, L.rainfall.monthly[y].reduce((s, x) => s + x, 0)]);
    if (totals.length > 1) {
      const wet = totals.reduce((a, b) => (b[1] > a[1] ? b : a));
      const dry = totals.reduce((a, b) => (b[1] < a[1] ? b : a));
      out.push({ year: +wet[0], month: 1, layer: "rainfall", text: "Wettest year in our data" });
      out.push({ year: +dry[0], month: 1, layer: "rainfall", text: "Driest year in our data" });
    }
  }
  return out.sort((a, b) => a.year - b.year || a.month - b.month);
}
