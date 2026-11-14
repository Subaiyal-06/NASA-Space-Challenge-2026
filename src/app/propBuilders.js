// PROP BUILDERS FOR UI SLOTS (Step C7)
// Pure functions that turn Data API snapshots + clock/settings into exact UI slot props.
import { getSnapshot, getBaselineSnapshot } from "../data/api.js";
import { getLoadedCity } from "../data/loader.js";
import { isGhostCalmEligible, getLayerGating } from "../state/pacing.js";

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const r2 = (x) => Math.round(x * 100) / 100;

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * Turns a month snapshot into `conditions` for WeatherLayer:
 * { heatAnomaly, rainPercentile, spi, aod, quake }
 */
export function buildConditions(snapshot) {
  if (!snapshot || !snapshot.layers) {
    return { heatAnomaly: null, rainPercentile: null, spi: null, aod: null, quake: null };
  }
  const L = snapshot.layers;
  const quakes = L.quakes ?? [];
  const strongestQuake = quakes.length
    ? quakes.reduce((best, q) => (q.magnitude > best.magnitude ? q : best), quakes[0])
    : null;

  return {
    heatAnomaly: L.temperature?.available ? L.temperature.anomaly : null,
    rainPercentile: L.rainfall?.available ? L.rainfall.percentile : null,
    spi: L.drought?.available ? L.drought.spi : null,
    aod: L.air?.available ? L.air.aod : null,
    quake: strongestQuake ? { ...strongestQuake, source: "USGS (non-NASA)" } : null,
  };
}

/**
 * Checks if there is a visible difference between current conditions and 1981-1990 baseline.
 */
export function hasVisibleBaselineDiff(conditions, baselineConditions) {
  if (!conditions || !baselineConditions) return false;
  if (
    conditions.heatAnomaly != null &&
    baselineConditions.heatAnomaly != null &&
    Math.abs(conditions.heatAnomaly - baselineConditions.heatAnomaly) >= 0.35
  ) {
    return true;
  }
  if (
    conditions.rainPercentile != null &&
    baselineConditions.rainPercentile != null &&
    Math.abs(conditions.rainPercentile - baselineConditions.rainPercentile) >= 15
  ) {
    return true;
  }
  if (
    conditions.spi != null &&
    baselineConditions.spi != null &&
    Math.abs(conditions.spi - baselineConditions.spi) >= 0.5
  ) {
    return true;
  }
  if (
    conditions.aod != null &&
    baselineConditions.aod != null &&
    Math.abs(conditions.aod - baselineConditions.aod) >= 0.1
  ) {
    return true;
  }
  return false;
}

/**
 * Builds the `ghost` prop for WeatherLayer:
 * null OR { heatAnomaly, rainPercentile, spi, aod } (1981-1990 baseline).
 * Shown when:
 *  - showGhostAlways is true, OR
 *  - month is in a 2+ calm stretch (year >= 1991, not eventful) AND has a visible difference from baseline.
 */
export function buildGhostProp(cityOrId, year, month, conditions, showGhostAlways = false, scenario) {
  const city = typeof cityOrId === "string" ? getLoadedCity(cityOrId) : cityOrId;
  if (!city) return null;

  let baseSnap = null;
  try {
    baseSnap = getBaselineSnapshot(city, month);
  } catch {
    return null;
  }
  const baseCond = buildConditions(baseSnap);
  const ghostObj = {
    heatAnomaly: baseCond.heatAnomaly,
    rainPercentile: baseCond.rainPercentile,
    spi: baseCond.spi,
    aod: baseCond.aod,
  };

  if (showGhostAlways) return ghostObj;

  if (!isGhostCalmEligible(city, year, month, scenario)) return null;
  if (!hasVisibleBaselineDiff(conditions, ghostObj)) return null;

  return ghostObj;
}

/**
 * Builds complete props for WeatherLayer slot.
 */
export function buildWeatherLayerProps({
  cityId,
  selected = true,
  year,
  month,
  scenario,
  showGhostAlways = false,
  reduceMotion = false,
}) {
  const city = getLoadedCity(cityId);
  const snap = city ? getSnapshot(city, year, month, scenario) : null;
  const conditions = buildConditions(snap);
  const ghost = buildGhostProp(city, year, month, conditions, showGhostAlways, scenario);

  return {
    cityId,
    selected,
    year,
    month,
    isProjection: !!snap?.isProjection,
    conditions,
    ghost,
    reduceMotion: !!reduceMotion,
  };
}

/**
 * Builds blended states for AmbientGlow from a snapshot:
 * states = [{ type, strength }] sorted by strength descending.
 * Types: "heavy-rain", "light-rain", "hot", "cool", "drought", "haze", "quake", "calm"
 */
export function buildAmbientGlowStates(snapshot) {
  if (!snapshot || !snapshot.layers) return [{ type: "calm", strength: 0.2 }];
  const cond = buildConditions(snapshot);
  const states = [];

  if (cond.heatAnomaly != null) {
    if (cond.heatAnomaly >= 0.4) {
      states.push({ type: "hot", strength: r2(clamp(cond.heatAnomaly / 2.2, 0.15, 1)) });
    } else if (cond.heatAnomaly <= -0.4) {
      states.push({ type: "cool", strength: r2(clamp(-cond.heatAnomaly / 2.0, 0.15, 1)) });
    }
  }

  if (cond.rainPercentile != null) {
    if (cond.rainPercentile >= 80) {
      states.push({
        type: "heavy-rain",
        strength: r2(clamp((cond.rainPercentile - 70) / 30, 0.3, 1)),
        lightning: cond.rainPercentile >= 95,
      });
    } else if (cond.rainPercentile >= 55) {
      states.push({
        type: "light-rain",
        strength: r2(clamp((cond.rainPercentile - 50) / 35, 0.15, 0.7)),
      });
    }
  }

  if (cond.spi != null && cond.spi <= -0.8) {
    states.push({ type: "drought", strength: r2(clamp(-cond.spi / 2.5, 0.2, 1)) });
  }

  if (cond.aod != null && cond.aod >= 0.35) {
    states.push({ type: "haze", strength: r2(clamp(cond.aod, 0.2, 1)) });
  }

  if (cond.quake != null) {
    states.push({
      type: "quake",
      strength: r2(clamp((cond.quake.magnitude - 5.0) / 3.0, 0.4, 1)),
    });
  }

  if (!states.length) {
    states.push({ type: "calm", strength: 0.2 });
  }

  return states.sort((a, b) => b.strength - a.strength);
}

/**
 * Builds complete props for AmbientGlow slot.
 */
export function buildAmbientGlowProps({
  snapshot,
  side = "both",
  beatPhase = 0,
  reduceMotion = false,
}) {
  return {
    states: buildAmbientGlowStates(snapshot),
    side,
    beatPhase,
    reduceMotion: !!reduceMotion,
  };
}

/**
 * Builds props for TensionMeter slot (always labeled as "our own index").
 */
export function buildTensionMeterProps({ tension = 0, interest = 0, reduceMotion = false }) {
  return {
    tension: r2(clamp(tension, 0, 1)),
    interest: r2(clamp(interest, 0, 1)),
    label: "Climate Tension (our own index)",
    reduceMotion: !!reduceMotion,
  };
}

/**
 * Generates the plain-language "What am I hearing?" sentence for a snapshot and active layers.
 */
export function buildWhatAmIHearing({ cityId, year, month, snapshot, enabledLayers = [] }) {
  const monthName = MONTH_NAMES[month] ?? "Month";
  const cityObj = getLoadedCity(cityId);
  const cityName = cityObj?.city ?? cityId ?? "City";

  if (!snapshot) {
    return `${cityName}, ${monthName} ${year}: listening to baseline drone.`;
  }

  const parts = [];
  const L = snapshot.layers ?? {};
  const isOn = (id) => enabledLayers.includes(id);

  if (snapshot.isProjection) {
    const anom = L.temperature?.anomaly;
    return `${cityName}, ${year} (Projection, not measurement): projected warming of ${anom != null ? (anom >= 0 ? `+${anom}` : anom) : "0"}°C drives a tense musical build-up.`;
  }

  if (isOn("temperature") && L.temperature?.available && L.temperature.anomaly != null) {
    const a = L.temperature.anomaly;
    if (a >= 0.5) parts.push(`brighter, higher notes for +${a}°C warmer than normal`);
    else if (a <= -0.5) parts.push(`cooler, softer notes (${a}°C vs normal)`);
    else parts.push(`near-normal temperature (${a >= 0 ? `+${a}` : a}°C)`);
  }

  if (isOn("rainfall") && L.rainfall?.available && L.rainfall.percentile != null) {
    const p = L.rainfall.percentile;
    if (p >= 85) parts.push(`dense rain notes for heavy rainfall (${L.rainfall.value} mm)`);
    else if (p >= 55) parts.push(`gentle rain plucks (${L.rainfall.value} mm)`);
  }

  if (isOn("drought") && L.drought?.available && L.drought.spi != null && L.drought.spi <= -1.0) {
    parts.push(`a dry, muffled filter from drought (SPI ${L.drought.spi})`);
  }

  if (isOn("air") && L.air?.available && L.air.aod != null && L.air.aod >= 0.4) {
    parts.push(`hazy breath noise from aerosols (AOD ${L.air.aod})`);
  }

  if (isOn("quakes") && (L.quakes?.length ?? 0) > 0) {
    const maxMag = Math.max(...L.quakes.map((q) => q.magnitude));
    parts.push(`a deep boom for a magnitude ${maxMag} earthquake (USGS, non-NASA)`);
  }

  const tensionPct = Math.round((snapshot.tension ?? 0) * 100);
  const body = parts.length ? parts.join(", ") : "a calm base drone and soft pad";
  return `${cityName}, ${monthName} ${year}: you are hearing ${body} (tension ${tensionPct}%, our own index).`;
}

/**
 * Builds props for Legend slot.
 */
export function buildLegendProps({ cityId, year, month, snapshot, enabledLayers, scenario, reduceMotion = false }) {
  const layers = getLayerGating(cityId, year, enabledLayers, scenario);
  const explanation = buildWhatAmIHearing({ cityId, year, month, snapshot, enabledLayers });
  return {
    layers,
    explanation,
    reduceMotion: !!reduceMotion,
  };
}
