// COMPARE LOGIC (Step C9: "Change Since" summary and side-by-side comparison)
import { getSeries, getSnapshot } from "../data/api.js";
import { getLoadedCity } from "../data/loader.js";

const r1 = (x) => Math.round(x * 10) / 10;

function meanOfYear(cityId, layer, year) {
  const city = getLoadedCity(cityId);
  if (!city) return null;
  try {
    const pts = getSeries(city, layer, year, year);
    if (!pts.length) return null;
    return pts.reduce((s, p) => s + p.value, 0) / pts.length;
  } catch {
    return null;
  }
}

function sumOfYear(cityId, layer, year) {
  const city = getLoadedCity(cityId);
  if (!city) return null;
  try {
    const pts = getSeries(city, layer, year, year);
    if (!pts.length) return null;
    return pts.reduce((s, p) => s + p.value, 0);
  } catch {
    return null;
  }
}

/**
 * Computes "Change Since" metrics between `startYear` (default 1981) and `currentYear` for a city.
 * Returns { tempDelta, rainPctDelta, spiDelta, aodPctDelta }
 */
export function computeCityChangeSince(cityId, startYear = 1981, currentYear = 2024) {
  const city = getLoadedCity(cityId);
  if (!city) {
    return { tempDelta: null, rainPctDelta: null, spiDelta: null, aodPctDelta: null };
  }

  const fromY = Math.max(1981, startYear);
  const toY = Math.max(fromY, Math.min(2024, currentYear));

  const t0 = meanOfYear(cityId, "temperature", fromY);
  const t1 = meanOfYear(cityId, "temperature", toY);
  const tempDelta = t0 != null && t1 != null ? r1(t1 - t0) : null;

  const r0 = sumOfYear(cityId, "rainfall", fromY);
  const r1Val = sumOfYear(cityId, "rainfall", toY);
  const rainPctDelta =
    r0 != null && r1Val != null && r0 > 1 ? Math.round(((r1Val - r0) / r0) * 100) : null;

  const s0 = meanOfYear(cityId, "drought", fromY);
  const s1 = meanOfYear(cityId, "drought", toY);
  const spiDelta = s0 != null && s1 != null ? r1(s1 - s0) : null;

  const a0 = meanOfYear(cityId, "air", Math.max(2000, fromY));
  const a1 = meanOfYear(cityId, "air", toY);
  const aodPctDelta =
    a0 != null && a1 != null && a0 > 0.01 ? Math.round(((a1 - a0) / a0) * 100) : null;

  return { tempDelta, rainPctDelta, spiDelta, aodPctDelta };
}

/**
 * Builds the plain-language comparison summary sentence and changeSince object for CompareView.
 */
export function buildCompareProps({
  cityA,
  cityB,
  startYear = 1981,
  currentYear = 2024,
  month = 0,
  scenario,
  onStartYearChange = () => {},
  reduceMotion = false,
}) {
  const safeStartYear = Math.max(1981, Number(startYear) || 1981);
  const objA = getLoadedCity(cityA);
  const objB = cityB ? getLoadedCity(cityB) : null;
  const nameA = objA?.city ?? cityA ?? "City A";
  const nameB = objB?.city ?? cityB ?? "City B";

  const changeA = computeCityChangeSince(cityA, safeStartYear, currentYear);
  const changeB = cityB ? computeCityChangeSince(cityB, safeStartYear, currentYear) : null;

  const snapA = objA ? getSnapshot(objA, currentYear, month, scenario) : null;
  const snapB = objB ? getSnapshot(objB, currentYear, month, scenario) : null;

  let summary = `Select a second city to compare with ${nameA} since ${safeStartYear}.`;
  if (cityB && changeA.tempDelta != null && changeB?.tempDelta != null) {
    const diff = r1(changeA.tempDelta - changeB.tempDelta);
    if (Math.abs(diff) < 0.1) {
      summary = `Since ${safeStartYear}, ${nameA} and ${nameB} warmed at a similar pace (${changeA.tempDelta >= 0 ? `+${changeA.tempDelta}` : changeA.tempDelta}°C).`;
    } else if (diff > 0) {
      summary = `Since ${safeStartYear}, ${nameA} warmed faster than ${nameB} (${changeA.tempDelta >= 0 ? `+${changeA.tempDelta}` : changeA.tempDelta}°C vs ${changeB.tempDelta >= 0 ? `+${changeB.tempDelta}` : changeB.tempDelta}°C).`;
    } else {
      summary = `Since ${safeStartYear}, ${nameB} warmed faster than ${nameA} (${changeB.tempDelta >= 0 ? `+${changeB.tempDelta}` : changeB.tempDelta}°C vs ${changeA.tempDelta >= 0 ? `+${changeA.tempDelta}` : changeA.tempDelta}°C).`;
    }
  } else if (cityB) {
    summary = `Comparing ${nameA} (left ear) and ${nameB} (right ear) since ${safeStartYear}.`;
  }

  return {
    cityA,
    cityB,
    stereo: { left: cityA, right: cityB },
    summary,
    changeSince: {
      [cityA]: changeA,
      ...(cityB ? { [cityB]: changeB } : {}),
    },
    snapshots: {
      cityA: snapA,
      cityB: snapB,
    },
    startYear: safeStartYear,
    onStartYearChange,
    reduceMotion: !!reduceMotion,
  };
}
