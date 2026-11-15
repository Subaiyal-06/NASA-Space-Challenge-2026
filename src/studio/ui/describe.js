// Plain-text description of a month for screen readers and the voice: everything the screen shows and the music
// plays, in words (pure, unit-tested). Numbers are spelled so a speech engine reads them well.
import { headlineFor, hearingFor, gaugesFor, stressPercent, stressWord } from "./gauges.js";
import { formatDate } from "./timeline.js";

/** "−0.3 °C" -> "minus 0.3 degrees Celsius", "401 mm" -> "401 millimetres", "M7.6" -> "magnitude 7.6". */
export function spoken(value = "") {
  return String(value)
    .replace(/^−/, "minus ").replace(/^\+/, "plus ")
    .replace(/ °C$/, " degrees Celsius").replace(/ mm$/, " millimetres")
    .replace(/^M(\d)/, "magnitude $1").replace(/×/g, " times");
}

/** The whole month in a few short sentences. */
export function describeMonth({ cityName, snapshot, wx, city, enabled = [], showGreenery = true }) {
  if (!snapshot || !wx) return "";
  const parts = [`${cityName}, ${formatDate(snapshot.year, snapshot.month)}.`, headlineFor(wx, snapshot)];
  for (const g of gaugesFor(snapshot, city, { enabled, showGreenery })) {
    if (g.waiting) { parts.push(`${g.label}: data ${g.caption}.`); continue; }
    const v = spoken(g.value).replace(/(\d)%/, "$1 percent"); const c = spoken(g.caption).replace(/(\d)%/, "$1 percent");
    parts.push(c.toLowerCase().startsWith(v.toLowerCase()) || v.toLowerCase() === "none" ? `${g.label}: ${c}.` : `${g.label}: ${v}, ${c}.`);
  }
  const pct = stressPercent(snapshot);
  parts.push(`Climate stress: ${pct} percent, ${stressWord(pct)}. This is our own index.`);
  parts.push(`What you hear: ${hearingFor(wx, snapshot.tension)}`);
  if (snapshot.isProjection) parts.unshift("Projection, not a measurement.");
  return parts.join(" ");
}

/** While music plays a month goes by every 2.5 seconds, too fast to read out every one: only the notable ones and each January. */
export function worthAnnouncingWhilePlaying(wx, month) {
  return !!(wx?.quake || wx?.storm || (wx?.dry ?? 0) > 0.7 || (wx?.rain ?? 0) >= 0.65 || month === 0);
}
