// VOICE ANNOUNCER (Step C9: Accessibility Speech Synthesis)
import { MONTH_NAMES } from "./propBuilders.js";
import { getLoadedCity } from "../data/loader.js";

let lastSpokenText = "";

export function getLastSpokenText() {
  return lastSpokenText;
}

/**
 * Builds a plain-language spoken announcement for a month snapshot.
 */
export function buildAnnouncementText(cityId, year, month, snapshot) {
  const monthName = MONTH_NAMES[month] ?? "Month";
  const cityObj = getLoadedCity(cityId);
  const cityName = cityObj?.city ?? cityId ?? "City";

  if (!snapshot || !snapshot.layers) {
    return `${cityName}, ${monthName} ${year}.`;
  }

  const phrases = [`${cityName}, ${monthName} ${year}.`];
  const L = snapshot.layers;

  if (snapshot.isProjection) {
    const anom = L.temperature?.anomaly;
    phrases.push(
      `Projection, not measurement. Temperature projected at ${anom != null ? `${anom} degrees above baseline` : "elevated levels"}.`
    );
    return phrases.join(" ");
  }

  if (L.temperature?.available && L.temperature.anomaly != null) {
    const a = L.temperature.anomaly;
    if (Math.abs(a) < 0.1) {
      phrases.push("Temperature is near normal.");
    } else if (a > 0) {
      phrases.push(`Temperature is ${a} degrees above normal.`);
    } else {
      phrases.push(`Temperature is ${Math.abs(a)} degrees below normal.`);
    }
  }

  if (L.rainfall?.available && L.rainfall.percentile != null) {
    const p = L.rainfall.percentile;
    if (p >= 85) phrases.push("Heavy rainfall is rising.");
    else if (p <= 15) phrases.push("Conditions are very dry.");
  }

  if (L.drought?.available && L.drought.spi != null && L.drought.spi <= -1.2) {
    phrases.push("Drought stress is severe.");
  }

  if ((L.quakes?.length ?? 0) > 0) {
    const maxMag = Math.max(...L.quakes.map((q) => q.magnitude));
    phrases.push(`Earthquake recorded, magnitude ${maxMag}, USGS data.`);
  }

  return phrases.join(" ");
}

/**
 * Speaks the text via browser SpeechSynthesis if enabled and available.
 */
export function announceMonth(cityId, year, month, snapshot, enabled = false) {
  const text = buildAnnouncementText(cityId, year, month, snapshot);
  lastSpokenText = text;
  if (!enabled) return text;

  try {
    if (typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined") {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
    }
  } catch {
    // Ignore speech synthesis errors in headless/test environments
  }
  return text;
}
