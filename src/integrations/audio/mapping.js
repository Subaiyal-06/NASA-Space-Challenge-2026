// Data -> sound rules (pure functions, no audio, so they can be tested).
// Input is a SNAPSHOT from the data API (one month of one city). Everything is based on values compared to normal
// (anomalies and percentiles), never raw values, so Karachi's summers are not "always hot".
export const ALL_LAYERS = ["temperature", "rainfall", "drought", "quakes", "air"];

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

/**
 * Rain level 0..1 from where this month's rainfall sits among the same calendar month in all years
 * (percentile 0-100). A normal month (50) is a gentle 0.3, a very wet month (90+) is close to 1,
 * and a month with under 1 mm of rain is silent.
 */
export function rainLevel(percentile, mm) {
  if (percentile == null || mm == null || mm < 1) return 0;
  return clamp(0.3 + ((percentile - 50) / 50) * 0.75, 0, 1);
}

/**
 * What the instruments should do for one month. A layer is silent if it is switched off or its data has not
 * begun yet (`available` is false): "the orchestra grows" as real measurements start.
 */
export function computeMonthValues(snapshot, enabled = ALL_LAYERS) {
  const out = { rainLevel: 0, rainNotes: 0, drought: 0, haze: 0, brightness: 0, heat: 0, heatOn: false, quake: null };
  const L = snapshot?.layers;
  if (!L) return out;
  const on = (id) => enabled.includes(id);

  if (on("rainfall") && L.rainfall?.available) {
    out.rainLevel = rainLevel(L.rainfall.percentile, L.rainfall.value);
    out.rainNotes = Math.round(out.rainLevel * 12); // more rain = more notes
  }
  if (on("temperature") && L.temperature?.available && L.temperature.anomaly != null) {
    out.brightness = clamp(L.temperature.anomaly / 2, -1, 1); // +2 C vs normal = brightest, -2 C = darkest
    out.heat = out.brightness; // the same number also plays the heat chimes (higher, more and brighter when hotter)
    out.heatOn = true;
  }
  if (on("drought") && L.drought?.available && L.drought.spi != null) {
    out.drought = clamp(-L.drought.spi / 2.5, 0, 1); // SPI -2.5 = worst drought
  }
  if (on("air") && L.air?.available && L.air.aod != null) {
    out.haze = clamp(L.air.aod, 0, 1);
  }
  if (on("quakes") && Array.isArray(L.quakes) && L.quakes.length) {
    out.quake = L.quakes.reduce((a, b) => (b.magnitude > a.magnitude ? b : a)); // { magnitude, depth, lat, lon }
  }
  return out;
}
