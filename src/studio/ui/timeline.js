// Pure helpers for the playback bar, the category chips and the time jump (all unit-tested).
export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3));

/** One number per month: year * 12 + month (month 0-11). Lets the scrubber treat time as a single line. */
export const toIndex = (year, month) => year * 12 + month;
export const fromIndex = (index) => ({ year: Math.floor(index / 12), month: ((index % 12) + 12) % 12 });
export const percentAlong = (index, minIndex, maxIndex) => (maxIndex <= minIndex ? 0 : Math.min(100, Math.max(0, ((index - minIndex) / (maxIndex - minIndex)) * 100)));
export const formatDate = (year, month) => `${MONTHS[month]} ${year}`;

/** Seconds one step of the playhead takes (matches the clock): Month 2.5 s, Year 2 s, skipping 1 s. */
export function stepSeconds({ mode, speed = 1, pacing = "normal" }) {
  if (mode === "year") return 2 / speed;
  if (mode === "story" && pacing === "skipping") return 1 / speed;
  return 2.5 / speed;
}

export const nextSpeed = (speed) => ({ 1: 2, 2: 4, 4: 1 }[speed] ?? 1);

/**
 * The categories (layers) shown as chips. Only layers the city really has are listed.
 * `core` layers are switched through the clock (they change the music); extras (greenery, and later AQI and night
 * lights) only change what is shown.
 */
export const CATEGORY_DEFS = [
  { id: "temperature", label: "Heat", color: "var(--heat)", icon: "sun", core: true },
  { id: "rainfall", label: "Rain", color: "var(--rain)", icon: "rain", core: true },
  { id: "drought", label: "Dry spells", color: "var(--dry)", icon: "dry", core: true },
  { id: "quakes", label: "Earthquakes", color: "var(--quake)", icon: "quake", core: true, dataKey: "earthquakes" },
  { id: "vegetation", label: "Greenery", color: "var(--green)", icon: "leaf", core: false },
  { id: "air", label: "Haze", color: "var(--haze)", icon: "haze", core: true },
  { id: "aqi", label: "Air quality", color: "var(--haze)", icon: "haze", core: false },
  { id: "nightlights", label: "Night lights", color: "var(--lights)", icon: "lights", core: false },
];

/** [{ ...def, startYear, available }] for this city and this year. `available` is false before the layer's data begins. */
export function categoriesFor(city, year) {
  if (!city) return [];
  return CATEGORY_DEFS.flatMap((def) => {
    const layer = city.layers?.[def.dataKey ?? def.id];
    if (!layer) return [];
    const startYear = def.id === "quakes" ? Math.min(...(layer.events ?? []).map((e) => e.year), Infinity) : layer.startYear;
    return [{ ...def, startYear: Number.isFinite(startYear) ? startYear : null, available: !Number.isFinite(startYear) || year >= startYear }];
  });
}

/** Shortens record texts for the jump list: the date is shown next to them, so "(September)" and "vs normal" go. */
export function tidyMoment(text = "") {
  return text.replace(/\s*\((January|February|March|April|May|June|July|August|September|October|November|December)\)\s*$/, "").replace(" vs normal", "");
}

/** "Big moments" for the jump panel: stories first, then record badges, one per date, at most `limit`. */
export function bigMoments({ stories = [], badges = [] }, limit = 5) {
  const seen = new Set();
  const out = [];
  for (const m of [...stories, ...badges]) {
    const month = m.month == null ? 0 : m.month - 1; // data months are 1-12, the clock uses 0-11
    const key = `${m.year}-${month}-${m.text ?? m.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ year: m.year, month, text: tidyMoment(m.title ?? m.text) });
    if (out.length >= limit) break;
  }
  return out;
}
