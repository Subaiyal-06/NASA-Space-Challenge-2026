// The history chart: the whole record for one category, a cursor that follows the clock, click anywhere to jump there.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useClock } from "../../state/clock.js";
import { getSeries } from "../../data/api.js";
import { toIndex, formatDate } from "./timeline.js";
import { movingAverage, niceDomain, makeAxes, linePath, stemPath, nearestPoint, yearTicks } from "./chart.js";

const H = 150; // the drawing height; narrow windows scale it with CSS
const MINUS = "−";

// How each tab is drawn. `bars` = one stem per month; otherwise a line plus a smooth 12-month average.
const TABS = {
  temperature: { label: "Heat", layer: "temperature", color: "var(--heat)", unit: "°C", zero: true, signed: true, note: "How much hotter or cooler than the 1981–2010 normal." },
  rainfall: { label: "Rain", layer: "rainfall", color: "var(--rain)", unit: " mm", zero: true, bars: true, note: "Rain that fell each month." },
  drought: { label: "Dry spells", layer: "drought", color: "var(--dry)", unit: "", zero: true, signed: true, note: "Below zero is dry, above zero is wet." },
  quakes: { label: "Earthquakes", layer: "quakes", color: "var(--quake)", unit: "", zero: false, bars: true, prefix: "M", note: "Each line is one earthquake of magnitude 5.5 or more." },
  vegetation: { label: "Greenery", layer: "vegetation", color: "var(--green)", unit: "", zero: false, note: "How green the land looks from space." },
  stress: { label: "Climate stress", layer: "tension", color: "var(--needle)", unit: "", zero: true, note: "Our own index, from 0 (calm) to 1 (very high)." },
};

const fmt = (v, t) => `${t.signed ? (v < 0 ? MINUS : "+") : ""}${t.prefix ?? ""}${(t.signed ? Math.abs(v) : v).toFixed(t.layer === "rainfall" ? 0 : t.layer === "quakes" ? 1 : 2)}${t.unit}`;

export default function HistoryChart({ city, enabled = [], range, onClose }) {
  const year = useClock((s) => s.year);
  const month = useClock((s) => s.month);
  const seek = useClock((s) => s.seek);
  const ids = useMemo(() => Object.keys(TABS).filter((id) => {
    if (id === "stress") return true;
    if (id === "quakes") return !!city.layers.earthquakes && enabled.includes("quakes");
    if (id === "vegetation") return !!city.layers.vegetation;
    return !!city.layers[id] && enabled.includes(id);
  }), [city, enabled]);
  const [tab, setTab] = useState(ids[0]);
  const [hover, setHover] = useState(null);
  const svg = useRef(null);
  const [W, setW] = useState(860);
  useEffect(() => {
    const el = svg.current; if (!el || typeof ResizeObserver === "undefined") return undefined;
    const fit = () => { if (el.clientWidth > 50) setW(Math.round(el.clientWidth)); };
    fit(); const ro = new ResizeObserver(fit); ro.observe(el); return () => ro.disconnect();
  }, []);
  const active = ids.includes(tab) ? tab : ids[0];
  const t = TABS[active];
  const from = range?.startYear ?? 1981; const to = range?.endYear ?? 2025;

  const model = useMemo(() => {
    const points = getSeries(city, t.layer, from, to);
    if (!points.length) return null;
    const values = points.map((p) => p.value);
    const domain = niceDomain(values, { include: t.zero ? [0] : t.layer === "quakes" ? [5] : [] });
    const axes = makeAxes({ width: W, height: H, startIndex: toIndex(from, 0), endIndex: toIndex(to, 11), domain });
    const smooth = t.bars ? null : movingAverage(values, 12).map((value, i) => ({ ...points[i], value }));
    const base = t.zero ? 0 : domain[0];
    return { points, axes, domain, smooth, base, first: points[0] };
  }, [city, t, from, to, W]);

  const cursor = toIndex(year, month);
  const at = (ev) => {
    const r = svg.current.getBoundingClientRect();
    const idx = model.axes.inverseX(((ev.clientX - r.left) / r.width) * W);
    return Math.min(toIndex(to, 11), Math.max(toIndex(from, 0), idx));
  };
  const onMove = (ev) => { const i = nearestPoint(model.points, at(ev)); setHover(i < 0 ? null : model.points[i]); };
  const onClick = (ev) => { const idx = at(ev); seek(Math.floor(idx / 12), ((idx % 12) + 12) % 12); };
  const summary = model ? `${t.label} from ${from} to ${to}. ${t.note}` : `${t.label}: no data.`;
  const cx = model ? model.axes.x(cursor) : 0;
  const shown = hover ?? null;
  // when not hovering, the readout follows the playhead, so keyboard and screen-reader users get the value too
  const here = model ? model.points.find((p) => p.year === year && p.month === month) ?? null : null;

  return (
    <section className="hist" aria-label="History chart">
      <header>
        <div className="hist__tabs" role="tablist" aria-label="Category to chart">
          {ids.map((id) => (
            <button key={id} type="button" role="tab" aria-selected={id === active} className={id === active ? "is-on" : ""} style={{ "--c": TABS[id].color }} onClick={() => { setTab(id); setHover(null); }}>{TABS[id].label}</button>
          ))}
        </div>
        <button type="button" className="hist__close" onClick={onClose} aria-label="Close history chart">Close</button>
      </header>
      {model ? (
        <div className="hist__plot">
          <svg ref={svg} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={summary} onPointerMove={onMove} onPointerLeave={() => setHover(null)} onClick={onClick} style={{ "--c": t.color }}>
            {yearTicks(from, to, 5).map((k) => (
              <g key={k.year}>
                <line x1={model.axes.x(k.index)} x2={model.axes.x(k.index)} y1={model.axes.plot.top} y2={model.axes.plot.bottom} className="hist__grid" />
                <text x={model.axes.x(k.index)} y={H - 8} textAnchor="middle" className="hist__tick">{k.year}</text>
              </g>
            ))}
            {t.zero && <line x1={model.axes.plot.left} x2={model.axes.plot.right} y1={model.axes.y(0)} y2={model.axes.y(0)} className="hist__zero" />}
            <text x={model.axes.plot.left - 8} y={model.axes.plot.top + 8} textAnchor="end" className="hist__tick">{fmt(model.domain[1], { ...t, unit: "" }).replace("+", "")}</text>
            <text x={model.axes.plot.left - 8} y={model.axes.plot.bottom} textAnchor="end" className="hist__tick">{fmt(model.domain[0], { ...t, unit: "" }).replace("+", "")}</text>
            {t.bars
              ? <path d={stemPath(model.points, model.axes, model.base)} className="hist__stems" />
              : <><path d={linePath(model.points, model.axes)} className="hist__line hist__line--faint" /><path d={linePath(model.smooth, model.axes)} className="hist__line" /></>}
            {cursor >= toIndex(from, 0) && cursor <= toIndex(to, 11) && <line x1={cx} x2={cx} y1={model.axes.plot.top} y2={model.axes.plot.bottom} className="hist__cursor" />}
            {shown && <circle cx={model.axes.x(toIndex(shown.year, shown.month))} cy={model.axes.y(shown.value)} r="4.5" className="hist__dot" />}
          </svg>
          <p className="hist__read" aria-live={shown ? "off" : "polite"}>
            {shown ? <><strong>{formatDate(shown.year, shown.month)}</strong> {fmt(shown.value, t)}</>
              : <><strong>{formatDate(year, month)}</strong> {here ? `${t.label}: ${fmt(here.value, t)}` : `no ${t.label.toLowerCase()} reading this month`}. <span>{t.note} Click to jump, or use the arrow keys.</span></>}
          </p>
        </div>
      ) : <p className="hist__read">No {t.label.toLowerCase()} data for this city.</p>}
      <p className="hist__source">Data: NASA and USGS records. Climate stress is our own index.</p>
    </section>
  );
}
