// Checks that a city object follows the data contract (README Section 7).
// Returns a list of problem strings. Empty list = file is OK.
const isNum = (x) => typeof x === "number" && Number.isFinite(x);
const is12 = (a) => Array.isArray(a) && a.length === 12 && a.every(isNum);

export function validateCity(c) {
  const errs = [];
  const need = (cond, msg) => { if (!cond) errs.push(msg); };

  need(c && typeof c.city === "string", "city: missing name");
  need(isNum(c?.lat) && isNum(c?.lon), "lat/lon: must be numbers");
  need(c?.layers && typeof c.layers === "object", "layers: missing");
  if (!c?.layers) return errs;

  for (const name of ["temperature", "rainfall", "drought", "air"]) {
    const L = c.layers[name];
    if (!L) continue; // a layer may be missing (never invent data)
    need(typeof L.source === "string" && L.source, `${name}: source is required`);
    need(isNum(L.startYear), `${name}: startYear must be a number`);
    for (const [y, arr] of Object.entries(L.monthly ?? {})) {
      need(is12(arr), `${name}.monthly[${y}]: must be 12 numbers`);
      need(+y >= L.startYear, `${name}.monthly[${y}]: before startYear ${L.startYear}`);
    }
    if (name === "rainfall") need(is12(L.normals), "rainfall: normals must be 12 numbers");
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
  return errs;
}
