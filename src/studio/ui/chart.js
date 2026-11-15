// Maths for the history chart (pure, unit-tested): scales, a moving average and path strings. No chart library.
import { toIndex } from "./timeline.js";

/** Moving average over `window` neighbouring points (centred), e.g. 12 months to smooth the seasons. */
export function movingAverage(values, window = 12) {
  const half = Math.floor(window / 2);
  return values.map((_, i) => {
    const lo = Math.max(0, i - half); const hi = Math.min(values.length - 1, i + half);
    let sum = 0; for (let j = lo; j <= hi; j++) sum += values[j];
    return sum / (hi - lo + 1);
  });
}

/** A "nice" value range that includes `include` (for example 0), padded a little. */
export function niceDomain(values, { include = [], pad = 0.08 } = {}) {
  let min = Math.min(...values, ...include); let max = Math.max(...values, ...include);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0, 1];
  if (min === max) { min -= 1; max += 1; }
  const p = (max - min) * pad;
  return [min - (include.includes(min) ? 0 : p), max + (include.includes(max) ? 0 : p)];
}

export const makeScale = ([d0, d1], [r0, r1]) => (v) => r0 + ((v - d0) / (d1 - d0 || 1)) * (r1 - r0);

/** x position of a point in time, y position of a value, in a chart of the given size and margins. */
export function makeAxes({ width, height, margin = { l: 46, r: 14, t: 12, b: 28 }, startIndex, endIndex, domain }) {
  const x = makeScale([startIndex, endIndex], [margin.l, width - margin.r]);
  const y = makeScale(domain, [height - margin.b, margin.t]);
  const inverseX = (px) => Math.round(startIndex + ((px - margin.l) / (width - margin.l - margin.r)) * (endIndex - startIndex));
  return { x, y, inverseX, margin, plot: { left: margin.l, right: width - margin.r, top: margin.t, bottom: height - margin.b } };
}

/** SVG path for a line through [{ year, month, value }] points. */
export function linePath(points, axes) {
  return points.map((p, i) => `${i ? "L" : "M"}${axes.x(toIndex(p.year, p.month)).toFixed(1)} ${axes.y(p.value).toFixed(1)}`).join("");
}

/** SVG path for vertical stems (bars) from `baseline` up/down to each value. */
export function stemPath(points, axes, baseline) {
  const y0 = axes.y(baseline).toFixed(1);
  return points.map((p) => `M${axes.x(toIndex(p.year, p.month)).toFixed(1)} ${y0}V${axes.y(p.value).toFixed(1)}`).join("");
}

/** Index (0..n-1) of the point nearest to a given time index. Points are in time order. */
export function nearestPoint(points, timeIndex) {
  if (!points.length) return -1;
  let lo = 0; let hi = points.length - 1;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (toIndex(points[mid].year, points[mid].month) < timeIndex) lo = mid + 1; else hi = mid; }
  const a = lo; const b = Math.max(0, lo - 1);
  return Math.abs(toIndex(points[a].year, points[a].month) - timeIndex) < Math.abs(toIndex(points[b].year, points[b].month) - timeIndex) ? a : b;
}

/** Year tick marks every `step` years: [{ year, index }]. */
export function yearTicks(startYear, endYear, step = 5) {
  const out = [];
  for (let y = Math.ceil(startYear / step) * step; y <= endYear; y += step) out.push({ year: y, index: toIndex(y, 0) });
  return out;
}
