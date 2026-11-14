// PACING, CALM DETECTION & LAYER GATING (Step C6)
import { getRange, getSnapshot, getMarkers } from "../data/api.js";
import { getLoadedCity } from "../data/loader.js";
import { LAYER_IDS } from "../contracts/audio.js";

export const CALM_THRESHOLD = 0.25;
export const EVENTFUL_THRESHOLD = 0.5;
export const GHOST_CALM_MONTHS = 2;
export const SKIP_CALM_MONTHS = 3;

const LAYER_LABELS = {
  temperature: "Temperature",
  rainfall: "Rainfall",
  drought: "Drought",
  quakes: "Earthquakes",
  air: "Air quality",
};

const DEFAULT_START_YEARS = {
  temperature: 1981,
  rainfall: 1981,
  drought: 1981,
  quakes: 1900,
  air: 2000,
};

/**
 * Counts how many consecutive calm months (interest < 0.25) end at (year, month) inclusive,
 * and how many consecutive calm months exist around/ahead for Story Mode skipping.
 */
export function getCalmStreak(cityOrId, year, month, scenario) {
  const city = typeof cityOrId === "string" ? getLoadedCity(cityOrId) : cityOrId;
  if (!city) return { streakEndingHere: 0, totalStretch: 0, isCalm: false, isEventful: false };

  const snap = getSnapshot(city, year, month, scenario);
  const interest = snap?.interest ?? 0;
  const isEventful = interest > EVENTFUL_THRESHOLD;
  const isCalm = interest < CALM_THRESHOLD && !isEventful;
  if (!isCalm) {
    return { streakEndingHere: 0, totalStretch: 0, isCalm: false, isEventful };
  }

  const { startYear, endYear } = getRange(city, scenario);
  const minTotal = startYear * 12;
  const maxTotal = endYear * 12 + 11;
  const currentTotal = year * 12 + month;

  let back = 0;
  for (let t = currentTotal; t >= minTotal && back < 12; t--) {
    const y = Math.floor(t / 12);
    const m = ((t % 12) + 12) % 12;
    const s = getSnapshot(city, y, m, scenario);
    if ((s?.interest ?? 0) < CALM_THRESHOLD) back++;
    else break;
  }

  let forward = 0;
  for (let t = currentTotal + 1; t <= maxTotal && forward < 12; t++) {
    const y = Math.floor(t / 12);
    const m = ((t % 12) + 12) % 12;
    const s = getSnapshot(city, y, m, scenario);
    if ((s?.interest ?? 0) < CALM_THRESHOLD) forward++;
    else break;
  }

  return {
    streakEndingHere: back,
    totalStretch: back + forward,
    isCalm: true,
    isEventful: false,
  };
}

/**
 * Checks whether Ghost Weather should be eligible based on calm streak:
 * requires 2+ calm months in a row, hidden in eventful months, and not before 1991 (1981-1990 is baseline).
 */
export function isGhostCalmEligible(cityOrId, year, month, scenario) {
  if (year < 1991) return false;
  const { streakEndingHere, isEventful } = getCalmStreak(cityOrId, year, month, scenario);
  if (isEventful) return false;
  return streakEndingHere >= GHOST_CALM_MONTHS;
}

/**
 * Determines the pacing ("normal" | "skipping") for a given mode, city, year, and month.
 * Only Story Mode compresses calm stretches of 3+ months. If a story marker is at this month, never skip.
 */
export function computePacing(mode, cityOrId, year, month, scenario, dontSkip = false) {
  if (mode !== "story" || dontSkip) return "normal";
  const city = typeof cityOrId === "string" ? getLoadedCity(cityOrId) : cityOrId;
  if (!city) return "normal";

  try {
    const markers = getMarkers(city);
    const hasStory = (markers.stories ?? []).some(
      (s) => s.year === year && (s.month == null || s.month - 1 === month || s.month === month)
    );
    if (hasStory) return "normal";
  } catch {
    // ignore marker error
  }

  const { totalStretch, isCalm } = getCalmStreak(city, year, month, scenario);
  return isCalm && totalStretch >= SKIP_CALM_MONTHS ? "skipping" : "normal";
}

/**
 * Returns gating information for each layer at the given year:
 * [{ id, label, available, startYear, reason, enabled }]
 */
export function getLayerGating(cityOrId, year, enabledLayers = LAYER_IDS, scenario) {
  const city = typeof cityOrId === "string" ? getLoadedCity(cityOrId) : cityOrId;
  let layerStartYears = {};
  let snapLayers = null;

  if (city) {
    try {
      layerStartYears = getRange(city, scenario).layerStartYears ?? {};
      snapLayers = getSnapshot(city, year, 0, scenario)?.layers ?? null;
    } catch {
      layerStartYears = {};
    }
  }

  return LAYER_IDS.map((id) => {
    const startYear = layerStartYears[id] ?? null;
    const label = LAYER_LABELS[id] ?? id;
    const enabled = enabledLayers.includes(id);

    if (startYear == null && id !== "quakes") {
      const fallbackStart = DEFAULT_START_YEARS[id];
      return {
        id,
        label,
        startYear: fallbackStart,
        available: false,
        reason: `NASA ${label.toLowerCase()} data is not available for this city`,
        enabled,
      };
    }

    if (startYear != null && year < startYear) {
      const prefix = id === "quakes" ? "USGS earthquake" : `NASA ${label.toLowerCase()}`;
      return {
        id,
        label,
        startYear,
        available: false,
        reason: `${prefix} data starts in ${startYear}`,
        enabled,
      };
    }

    // In projection years, only temperature is available
    if (snapLayers && id !== "quakes" && snapLayers[id] && !snapLayers[id].available && year > 2024) {
      return {
        id,
        label,
        startYear,
        available: false,
        reason: `Future projections only cover temperature`,
        enabled,
      };
    }

    return {
      id,
      label,
      startYear,
      available: true,
      reason: null,
      enabled,
    };
  });
}
