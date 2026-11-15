// Plain-language telemetry (pure, unit-tested): one sentence for the month, one gauge per category, and a short
// "what you're hearing" line. Everything is compared with that month's normal, in words a child can read.
import { getRainNormals } from "../../data/derived.js";
import { MONTHS } from "./timeline.js";

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const sign = (x, digits = 1) => `${x < 0 ? "−" : "+"}${Math.abs(x).toFixed(digits)}`; // real minus sign

/** One short sentence (two at most) saying what is going on this month. `wx` comes from weatherFor(). */
export function headlineFor(wx, snapshot) {
  const mm = snapshot?.layers?.rainfall?.value;
  const parts = [];
  if (wx.quake) parts.push(`An earthquake of magnitude ${wx.quake.magnitude.toFixed(1)}.`);
  if (wx.storm) parts.push(`A storm month: ${Math.round(mm)} mm of rain.`);
  else if (wx.rain >= 0.65) parts.push(`Heavy rain: ${Math.round(mm)} mm.`);
  else if (wx.rain > 0) parts.push(`Some rain: ${Math.round(mm)} mm.`);
  else if (wx.clouds > 0) parts.push("A cloudy month.");
  if (wx.dry > 0) parts.push(wx.dry > 0.7 ? "Very dry for this time of year." : "A dry spell.");
  if (wx.heat > 0.6) parts.push("Much hotter than usual.");
  else if (wx.heat > 0) parts.push("Hotter than usual.");
  else if (wx.heat < 0) parts.push("Cooler than usual.");
  if (!parts.length && wx.green !== 0) parts.push(wx.green > 0 ? "Greener than usual." : "Browner than usual.");
  return parts.length ? parts.slice(0, 2).join(" ") : "A quiet month: nothing unusual.";
}

/** Two short sentences about what the music is doing, so the sound is explained. */
export function hearingFor(wx, tension = 0) {
  const t = clamp(tension, 0, 1);
  const music = t < 0.2 ? "The music is calm." : t < 0.45 ? "The music is building." : t < 0.7 ? "The music is getting tense." : "The music is tense and big: the climate stress is high.";
  const extras = [];
  if (wx.rain >= 0.65) extras.push("lots of rain notes and a gentle hiss");
  else if (wx.rain > 0) extras.push("a few soft rain notes");
  if (wx.quake) extras.push("a deep boom for the earthquake");
  const tone = [];
  if (wx.dry > 0) tone.push("dull and dry because of the dry spell");
  if (wx.heat > 0) tone.push("brighter because it is hotter than usual");
  else if (wx.heat < 0) tone.push("darker and softer because it is cooler than usual");
  const second = [];
  if (extras.length) second.push(`You hear ${extras.join(" and ")}.`);
  if (tone.length) second.push(`The sound is ${tone[0]}.`);
  return [music, second.join(" ")].filter(Boolean).join(" ");
}

const rainCaption = (mm, normal, month) => {
  if (mm < 1) return "no rain this month";
  if (!normal || normal < 3) return mm >= 10 ? "rain in a dry season" : "a little rain";
  const r = mm / normal;
  if (r >= 3) return `${Math.round(r)}× a normal ${MONTHS[month]}`;
  if (r >= 1.5) return "wetter than normal";
  if (r >= 0.67) return "about normal";
  return "drier than normal";
};
const spiCaption = (spi) => (spi <= -2 ? "very dry" : spi <= -1 ? "dry" : spi >= 2 ? "very wet" : spi >= 1 ? "wet" : "normal");

/**
 * One gauge per category the city has and the chips have on.
 * { id, label, value, caption, bar: { mode: "center"|"fill", amount }, waiting }
 *   center: amount -1..1 from the middle (normal)   fill: amount 0..1 from the left
 */
export function gaugesFor(snapshot, city, { enabled = [], showGreenery = true } = {}) {
  if (!snapshot || !city) return [];
  const L = snapshot.layers;
  const out = [];
  const waiting = (id, label, startYear) => out.push({ id, label, value: "–", caption: `starts in ${startYear}`, bar: { mode: "fill", amount: 0 }, waiting: true });

  if (city.layers.temperature && enabled.includes("temperature")) {
    const t = L.temperature;
    if (t.available) out.push({ id: "temperature", label: "Heat", value: `${sign(t.anomaly)} °C`, caption: Math.abs(t.anomaly) < 0.5 ? "about normal" : t.anomaly > 0 ? "hotter than normal" : "cooler than normal", bar: { mode: "center", amount: clamp(t.anomaly / 3, -1, 1) } });
    else waiting("temperature", "Heat", city.layers.temperature.startYear);
  }
  if (city.layers.rainfall && enabled.includes("rainfall")) {
    const r = L.rainfall;
    if (r.available) out.push({ id: "rainfall", label: "Rain", value: `${Math.round(r.value)} mm`, caption: rainCaption(r.value, getRainNormals(city)?.[snapshot.month], snapshot.month), bar: { mode: "fill", amount: clamp((r.percentile ?? 0) / 100, 0, 1) } });
    else waiting("rainfall", "Rain", city.layers.rainfall.startYear);
  }
  if (city.layers.drought && enabled.includes("drought")) {
    const d = L.drought;
    if (d.available) out.push({ id: "drought", label: "Dry spells", value: sign(d.spi), caption: spiCaption(d.spi), bar: { mode: "center", amount: clamp(d.spi / 3, -1, 1) } });
    else waiting("drought", "Dry spells", city.layers.drought.startYear);
  }
  if (city.layers.earthquakes && enabled.includes("quakes")) {
    const q = L.quakes?.length ? L.quakes.reduce((a, b) => (b.magnitude > a.magnitude ? b : a)) : null;
    out.push({ id: "quakes", label: "Earthquakes", value: q ? `M${q.magnitude.toFixed(1)}` : "None", caption: q ? `${Math.round(q.depth)} km deep` : "none this month", bar: { mode: "fill", amount: q ? clamp((q.magnitude - 5) / 3, 0.1, 1) : 0 } });
  }
  const veg = city.layers.vegetation;
  if (veg && showGreenery) {
    const row = veg.monthly?.[snapshot.year];
    if (!row) waiting("vegetation", "Greenery", veg.startYear);
    else {
      const all = Object.values(veg.monthly);
      const normal = all.reduce((s, r) => s + r[snapshot.month], 0) / all.length;
      const ratio = row[snapshot.month] / normal;
      out.push({ id: "vegetation", label: "Greenery", value: row[snapshot.month].toFixed(2), caption: Math.abs(ratio - 1) < 0.08 ? "about normal" : `${Math.round(Math.abs(ratio - 1) * 100)}% ${ratio > 1 ? "greener" : "browner"} than normal`, bar: { mode: "center", amount: clamp((ratio - 1) / 0.35, -1, 1) } });
    }
  }
  return out;
}

/** Climate stress for the month as a whole percentage (our own index, 0-1 in the data). */
export const stressPercent = (snapshot) => Math.round(clamp(snapshot?.tension ?? 0, 0, 1) * 100);
export const stressWord = (pct) => (pct < 20 ? "calm" : pct < 45 ? "building" : pct < 70 ? "tense" : "very high");
