// Data -> sound rules (pure functions, no audio, so they can be tested).
// Everything is based on values compared to normal (anomalies), scaled to 0..1.
export const ALL_LAYERS = ["temperature", "rainfall", "drought", "quakes", "air"];

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

// Rain level 0..1 from this month's rain versus that calendar month's normal.
// ratio 1 (normal) -> 0.3, 4x normal -> 1.0, very dry -> 0. Under 1 mm = silence.
export function rainLevel(mm, normal) {
  if (mm == null || mm < 1) return 0;
  const ratio = (mm + 5) / (normal + 5);
  return clamp(0.3 + 0.35 * Math.log2(ratio), 0, 1);
}

// Returns what the instruments should do for one month. month is 0-11.
// A layer is silent if: switched off, missing from the city file, or before its startYear
// ("the orchestra grows" rule).
export function computeMonthValues(city, year, month, enabled = ALL_LAYERS) {
  const L = city?.layers ?? {};
  const active = (layer, key = layer) => enabled.includes(layer) && L[key] && year >= (L[key].startYear ?? -Infinity);
  const out = { rainLevel: 0, rainNotes: 0, drought: 0, haze: 0, brightness: 0, quake: null };

  if (active("rainfall")) {
    const mm = L.rainfall.monthly?.[year]?.[month];
    out.rainLevel = rainLevel(mm, L.rainfall.normals?.[month] ?? 0);
    out.rainNotes = Math.round(out.rainLevel * 12); // more rain = more notes
  }
  if (active("temperature")) {
    const a = L.temperature.monthly?.[year]?.[month];
    if (a != null) out.brightness = clamp(a / 2, -1, 1); // +2 C vs normal = brightest
  }
  if (active("drought")) {
    const spi = L.drought.monthly?.[year]?.[month];
    if (spi != null) out.drought = clamp(-spi / 2.5, 0, 1); // SPI -2.5 = worst drought
  }
  if (active("air")) {
    const aod = L.air.monthly?.[year]?.[month];
    if (aod != null) out.haze = clamp(aod, 0, 1);
  }
  if (active("quakes", "earthquakes")) {
    const hits = (L.earthquakes.events ?? []).filter((e) => e.year === year && e.month - 1 === month);
    if (hits.length) out.quake = hits.reduce((a, b) => (b.mag > a.mag ? b : a));
  }
  return out;
}
