// WEATHER RULES (pure, unit-tested): turn one month of real data into what the picture should show.
// Everything is compared to normal (percentiles, anomalies), never raw values, so the animation means
// "wetter or hotter than usual for this month". Cloud and storm are NOT measured: they are derived from rainfall,
// and the labels on screen say so ("Rainy month", "Storm"), never "cloud cover".
//
// Result: { clouds, rain, storm, quake, dry, heat, green, labels, glow }
//   clouds, rain, dry: 0..1      heat, green: -1..1      storm: true/false      quake: { magnitude } | null
//   labels: short text for the screen   glow: [{ type, strength }] for the edge glow

export const T = {
  cloudPct: 55, rainPct: 75, heavyPct: 90, stormPct: 96, // rainfall percentile for that calendar month
  cloudMm: 3, rainMm: 8, heavyMm: 20, stormMm: 40, // guards: a "very wet" month in a desert can still be a few mm
  dryBelowSpi: -1, // SPI-3 at or below this is a dry spell
  hotAnomaly: 1, // degrees C above normal
  greenRatio: 0.12, // vegetation 12% above/below that month's normal counts
};

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const lerp = (a, b, t) => a + (b - a) * t;

/** Average vegetation (NDVI) of the same calendar month over all years: the "normal" greenness. */
export function vegetationNormal(city, month) {
  const rows = Object.values(city?.layers?.vegetation?.monthly ?? {});
  return rows.length ? rows.reduce((s, r) => s + r[month], 0) / rows.length : null;
}

/**
 * @param snapshot  from getSnapshot(city, year, month)
 * @param opts      { city, enabled: ["rainfall", ...], showGreenery: bool }
 */
export function weatherFor(snapshot, { city = null, enabled = [], showGreenery = true } = {}) {
  const out = { clouds: 0, rain: 0, storm: false, quake: null, dry: 0, heat: 0, green: 0, labels: [], glow: [] };
  const L = snapshot?.layers;
  if (!L) return out;
  const on = (id) => enabled.includes(id);

  // ---- rain, clouds, storm (from the rainfall percentile) ----
  const rf = L.rainfall;
  if (on("rainfall") && rf?.available && rf.value != null && rf.percentile != null) {
    const p = rf.percentile; const mm = rf.value;
    if (p >= T.cloudPct && mm >= T.cloudMm) out.clouds = p < T.rainPct ? lerp(0.35, 0.6, (p - T.cloudPct) / (T.rainPct - T.cloudPct)) : p < T.heavyPct ? lerp(0.6, 0.85, (p - T.rainPct) / (T.heavyPct - T.rainPct)) : 1;
    if (p >= T.rainPct && mm >= T.rainMm) out.rain = p < T.heavyPct ? lerp(0.3, 0.6, (p - T.rainPct) / (T.heavyPct - T.rainPct)) : p < T.stormPct ? lerp(0.65, 0.85, (p - T.heavyPct) / (T.stormPct - T.heavyPct)) : 1;
    if (p >= T.heavyPct && mm < T.heavyMm) out.rain = Math.min(out.rain, 0.6); // not really heavy rain: keep it moderate
    out.storm = p >= T.stormPct && mm >= T.stormMm;
    if (out.storm) out.labels.push({ kind: "storm", text: "Storm" });
    else if (out.rain >= 0.65) out.labels.push({ kind: "rain", text: "Heavy rain" });
    else if (out.rain > 0) out.labels.push({ kind: "rain", text: "Rainy month" });
    else if (out.clouds > 0) out.labels.push({ kind: "clouds", text: "Cloudy month" });
    if (out.clouds > 0) out.glow.push({ type: out.rain >= 0.65 ? "rainHeavy" : "rainLight", strength: out.rain >= 0.65 ? Math.max(0.6, out.rain) : Math.max(0.35, out.clouds * 0.8) });
  }

  // ---- earthquake (the data API only reports the notable ones, magnitude 5.5 and up) ----
  if (on("quakes") && Array.isArray(L.quakes) && L.quakes.length) {
    const q = L.quakes.reduce((a, b) => (b.magnitude > a.magnitude ? b : a));
    out.quake = { magnitude: q.magnitude, depth: q.depth };
    out.labels.push({ kind: "quake", text: `Earthquake M${q.magnitude.toFixed(1)}` });
    out.glow.push({ type: "quake", strength: clamp(0.45 + (q.magnitude - 5) * 0.1, 0.45, 0.7) });
  }

  // ---- drought ----
  const dr = L.drought;
  if (on("drought") && dr?.available && dr.spi != null && dr.spi <= T.dryBelowSpi) {
    out.dry = 0.3 + 0.7 * clamp((-dr.spi + T.dryBelowSpi) / 1.5, 0, 1);
    out.labels.push({ kind: "dry", text: dr.spi <= -2 ? "Very dry" : "Dry spell" });
    out.glow.push({ type: "drought", strength: 0.35 + 0.45 * out.dry });
  }

  // ---- heat and cold ----
  const tp = L.temperature;
  if (on("temperature") && tp?.available && tp.anomaly != null && Math.abs(tp.anomaly) >= T.hotAnomaly) {
    out.heat = clamp(Math.sign(tp.anomaly) * (0.3 + 0.7 * clamp((Math.abs(tp.anomaly) - T.hotAnomaly) / 2, 0, 1)), -1, 1);
    out.labels.push({ kind: out.heat > 0 ? "hot" : "cool", text: out.heat > 0.6 ? "Much hotter than usual" : out.heat > 0 ? "Hotter than usual" : "Cooler than usual" });
    out.glow.push({ type: out.heat > 0 ? "hot" : "cool", strength: 0.3 + 0.5 * Math.abs(out.heat) });
  }

  // ---- greenery (a visual-only layer, not part of the core snapshot) ----
  const veg = city?.layers?.vegetation;
  if (showGreenery && veg && snapshot.year >= veg.startYear && veg.monthly?.[snapshot.year]) {
    const normal = vegetationNormal(city, snapshot.month);
    const value = veg.monthly[snapshot.year][snapshot.month];
    if (normal && Math.abs(value / normal - 1) >= T.greenRatio) {
      out.green = clamp((value / normal - 1) / 0.35, -1, 1);
      out.labels.push({ kind: "green", text: out.green > 0 ? "Greener than usual" : "Browner than usual" });
    }
  }
  return out;
}

/** Edge glow colours (README 6A), one per condition type. */
export const GLOW_COLORS = {
  rainHeavy: "#4A5B80", rainLight: "#A9BCD6", hot: "#FFB020", cool: "#A8D8FF", drought: "#B58B5C", haze: "#9A8D80", quake: "#FFB84D",
};
