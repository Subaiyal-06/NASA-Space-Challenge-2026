// EVENTS DETECTION FOR PLAYHEAD (Step C7: story, badge, quake)
import { getMarkers, getSnapshot } from "../data/api.js";
import { getLoadedCity } from "../data/loader.js";

/**
 * Checks if the playhead (year, month) hits any stories, record badges, or earthquakes for `cityOrId`.
 * Note: month is 0-11 in the clock; badges/stories in JSON may use 1-12 or 0-11.
 */
export function findEventsAt(cityOrId, year, month, scenario) {
  const city = typeof cityOrId === "string" ? getLoadedCity(cityOrId) : cityOrId;
  if (!city) return { stories: [], badges: [], quakes: [] };

  let markers = { stories: [], badges: [] };
  try {
    markers = getMarkers(city);
  } catch {
    // ignore
  }

  const matchMonth = (itemMonth) => {
    if (itemMonth == null) return month === 0;
    // If 1..12 convention is used, itemMonth - 1 === month
    return itemMonth - 1 === month;
  };

  const stories = (markers.stories ?? []).filter((s) => s.year === year && matchMonth(s.month));
  const badges = (markers.badges ?? [])
    .filter((b) => b.year === year && matchMonth(b.month))
    .map((b) => ({
      ...b,
      text: b.text?.includes("in our data") ? b.text : `${b.text} (in our data)`,
    }));

  let quakes = [];
  try {
    const snap = getSnapshot(city, year, month, scenario);
    quakes = (snap?.layers?.quakes ?? []).map((q) => ({
      ...q,
      year,
      month,
      source: "USGS (non-NASA)",
    }));
  } catch {
    quakes = [];
  }

  return { stories, badges, quakes };
}
