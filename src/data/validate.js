// Checks that a city object follows the data contract (README Section 7).
// checkCity returns { errors, warnings }. Errors = the file is broken. Warnings = usable, but look at it.
const isNum = (x) => typeof x === "number" && Number.isFinite(x);
const is12 = (a) => Array.isArray(a) && a.length === 12 && a.every(isNum);

export function checkCity(c) {
  const errors = [];
  const warnings = [];
  const need = (cond, msg) => { if (!cond) errors.push(msg); };

  need(c && typeof c.city === "string", "city: missing name");
  need(isNum(c?.lat) && isNum(c?.lon), "lat/lon: must be numbers");
  need(c?.layers && typeof c.layers === "object", "layers: missing");
  if (!c?.layers) return { errors, warnings };

  for (const name of ["temperature", "rainfall", "drought", "air"]) {
    const L = c.layers[name];
    if (!L) continue; // a layer may be missing (never invent data)
    need(typeof L.source === "string" && L.source, `${name}: source is required`);
    need(isNum(L.startYear), `${name}: startYear must be a number`);
    if (!L.unit) warnings.push(`${name}: no "unit" given`);
    for (const [y, arr] of Object.entries(L.monthly ?? {})) {
      need(is12(arr), `${name}.monthly[${y}]: must be 12 numbers`);
      need(+y >= L.startYear, `${name}.monthly[${y}]: before startYear ${L.startYear}`);
    }
    if (name === "rainfall") {
      need(is12(L.normals), "rainfall: normals must be 12 numbers");
      for (const [y, arr] of Object.entries(L.monthly ?? {})) if (is12(arr) && arr.some((v) => v < 0)) errors.push(`rainfall.monthly[${y}]: negative rainfall`);
    }
  }

  const q = c.layers.earthquakes;
  if (q) {
    need(typeof q.source === "string", "earthquakes: source is required");
    for (const e of q.events ?? [])
      need([e.year, e.month, e.mag, e.depth, e.lat, e.lon].every(isNum) && e.month >= 1 && e.month <= 12,
        `earthquakes: bad event ${JSON.stringify(e)}`);
  }

  for (const key of ["tension", "interest"]) {
    for (const [y, arr] of Object.entries(c[key] ?? {})) {
      need(is12(arr) && arr.every((v) => v >= 0 && v <= 1), `${key}[${y}]: 12 numbers between 0 and 1`);
    }
  }
  if (c.baseline) for (const [k, arr] of Object.entries(c.baseline)) need(is12(arr), `baseline.${k}: must be 12 numbers`);
  if (c.records) {
    need(Array.isArray(c.records), "records: must be a list");
    for (const r of Array.isArray(c.records) ? c.records : [])
      need(isNum(r.year) && isNum(r.month) && typeof r.text === "string", `records: bad entry ${JSON.stringify(r)}`);
  }
  // Every number needs a named source. A projection without one is ignored (see adapters).
  if (c.projection && !(typeof c.projection.source === "string" && c.projection.source))
    warnings.push('projection: no "source" given, so the app ignores it (every number needs a named source)');

  return { errors, warnings };
}

// Errors only (kept for older callers).
export const validateCity = (c) => checkCity(c).errors;
