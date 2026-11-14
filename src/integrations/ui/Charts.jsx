/**
 * CHARTS SLOT
 * Contract props:
 *   { series, year, month, layers, mode, reduceMotion }
 *   where series = { temperature: [{ year, month, value }], rainfall: [...], ... }
 *
 * Fixes applied:
 *  - Pure SVG responsive charts (no external Chart.js dependency needed, works in JSDOM + Electron)
 *  - Continuous time positioning so the playhead marker aligns accurately with `year` and `month`
 *  - Shows both Temperature Anomaly (line/area chart) and Monthly Rainfall (12-month bar chart for current year)
 */
import React, { useMemo } from "react";

const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

export default function Charts({
  series = {},
  year = 1981,
  month = 0,
  layers = ["temperature", "rainfall"],
  mode = "month",
  reduceMotion = false,
}) {
  const tempSeries = series?.temperature ?? [];
  const rainSeries = series?.rainfall ?? [];

  // Temperature line geometry
  const tempPlot = useMemo(() => {
    if (!tempSeries.length) return null;
    const minY = -1.5;
    const maxY = 3.5;
    const firstYear = tempSeries[0].year;
    const lastYear = tempSeries[tempSeries.length - 1].year;
    const totalMonths = Math.max(1, (lastYear - firstYear + 1) * 12);

    const W = 560;
    const H = 96;
    const toX = (y, m) => Math.max(0, Math.min(W, (((y - firstYear) * 12 + m) / totalMonths) * W));
    const toY = (v) => {
      const clamped = Math.max(minY, Math.min(maxY, Number(v) || 0));
      return H - ((clamped - minY) / (maxY - minY)) * (H - 16) - 8;
    };

    const points = tempSeries.map((pt) => ({
      x: toX(pt.year, pt.month),
      y: toY(pt.value),
      val: pt.value,
      year: pt.year,
      month: pt.month,
    }));

    const polyline = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    const zeroY = toY(0);
    const areaPath =
      points.length > 1
        ? `M ${points[0].x.toFixed(1)},${zeroY.toFixed(1)} L ${points
            .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
            .join(" L ")} L ${points[points.length - 1].x.toFixed(1)},${zeroY.toFixed(1)} Z`
        : "";

    const cursorX = toX(year, month);
    const currentPt =
      tempSeries.find((p) => p.year === year && p.month === month) ??
      tempSeries.find((p) => p.year === year) ??
      null;
    const cursorY = currentPt ? toY(currentPt.value) : zeroY;

    return {
      W,
      H,
      polyline,
      areaPath,
      zeroY,
      cursorX,
      cursorY,
      currentVal: currentPt?.value ?? null,
      firstYear,
      lastYear,
    };
  }, [tempSeries, year, month]);

  // Rainfall 12-month bars for the current (or nearest available) year
  const rainPlot = useMemo(() => {
    if (!rainSeries.length) return null;
    // Group by year
    const byYear = new Map();
    const monthSums = Array(12).fill(0);
    const monthCounts = Array(12).fill(0);

    for (const pt of rainSeries) {
      if (!byYear.has(pt.year)) byYear.set(pt.year, Array(12).fill(0));
      byYear.get(pt.year)[pt.month] = pt.value;
      if (pt.year >= 1981 && pt.year <= 2010) {
        monthSums[pt.month] += pt.value;
        monthCounts[pt.month] += 1;
      }
    }

    const normals = monthSums.map((s, i) => (monthCounts[i] ? s / monthCounts[i] : 20));
    const availableYears = Array.from(byYear.keys()).sort((a, b) => a - b);
    let activeYear = availableYears[0];
    for (const y of availableYears) {
      if (y <= year) activeYear = y;
    }
    const values = byYear.get(activeYear) ?? Array(12).fill(0);
    const maxVal = Math.max(120, ...values, ...normals);

    return { values, normals, maxVal, activeYear };
  }, [rainSeries, year]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px" }}>
      {/* Temperature Anomaly Chart */}
      <div
        style={{
          background: "var(--ej-card-bg, rgba(13, 27, 42, 0.8))",
          border: "1px solid var(--ej-border, rgba(255,255,255,0.09))",
          borderRadius: "12px",
          padding: "12px 14px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "#fdba74" }}>
            🌡 Temperature Anomaly (°C vs baseline)
          </span>
          <span style={{ fontSize: "11px", color: "#93c5fd", fontFamily: "monospace" }}>
            {tempPlot?.currentVal != null
              ? `${tempPlot.currentVal >= 0 ? "+" : ""}${tempPlot.currentVal.toFixed(2)}°C`
              : "NASA GISTEMP / POWER"}
          </span>
        </div>

        {tempPlot ? (
          <svg
            viewBox={`0 0 ${tempPlot.W} ${tempPlot.H}`}
            style={{ width: "100%", height: "92px", display: "block" }}
            role="img"
            aria-label="Temperature anomaly line chart"
          >
            {/* Zero baseline */}
            <line
              x1="0"
              y1={tempPlot.zeroY}
              x2={tempPlot.W}
              y2={tempPlot.zeroY}
              stroke="rgba(255,255,255,0.2)"
              strokeDasharray="3 3"
              strokeWidth="1"
            />
            {/* Area under curve */}
            {tempPlot.areaPath && <path d={tempPlot.areaPath} fill="rgba(251, 146, 60, 0.2)" />}
            {/* Line */}
            <polyline
              fill="none"
              stroke="#fb923c"
              strokeWidth="1.6"
              points={tempPlot.polyline}
            />
            {/* Playhead vertical cursor */}
            <line
              x1={tempPlot.cursorX}
              y1="0"
              x2={tempPlot.cursorX}
              y2={tempPlot.H}
              stroke="#facc15"
              strokeWidth="1.5"
            />
            <circle cx={tempPlot.cursorX} cy={tempPlot.cursorY} r="4.5" fill="#facc15" stroke="#000" strokeWidth="1" />
          </svg>
        ) : (
          <div style={{ height: "92px", display: "flex", alignItems: "center", color: "#64748b", fontSize: "12px" }}>
            Temperature layer muted or unavailable
          </div>
        )}

        <div style={{ fontSize: "10.5px", color: "#60a5fa", opacity: 0.75, marginTop: "4px" }}>
          NASA GISTEMP v4 / NASA POWER · Warmer anomaly raises musical pitch & filter brightness
        </div>
      </div>

      {/* Rainfall Bar Chart */}
      <div
        style={{
          background: "var(--ej-card-bg, rgba(13, 27, 42, 0.8))",
          border: "1px solid var(--ej-border, rgba(255,255,255,0.09))",
          borderRadius: "12px",
          padding: "12px 14px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "#7dd3fc" }}>
            🌧 Monthly Rainfall ({year})
          </span>
          <span style={{ fontSize: "11px", color: "#93c5fd", fontFamily: "monospace" }}>
            {rainPlot ? `${Math.round(rainPlot.values[month] ?? 0)} mm` : "NASA POWER"}
          </span>
        </div>

        {rainPlot ? (
          <div
            role="img"
            aria-label="Monthly rainfall bar chart"
            style={{
              height: "92px",
              display: "grid",
              gridTemplateColumns: "repeat(12, 1fr)",
              gap: "4px",
              alignItems: "end",
              paddingTop: "8px",
            }}
          >
            {rainPlot.values.map((v, i) => {
              const pct = Math.min(100, Math.max(4, (v / rainPlot.maxVal) * 100));
              const normPct = Math.min(100, Math.max(2, (rainPlot.normals[i] / rainPlot.maxVal) * 100));
              const isCurrent = i === month;
              const aboveNormal = v > rainPlot.normals[i] * 1.15;
              return (
                <div
                  key={i}
                  style={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    position: "relative",
                  }}
                  title={`${MONTHS[i]}: ${Math.round(v)} mm (normal: ${Math.round(rainPlot.normals[i])} mm)`}
                >
                  <div
                    style={{
                      width: "100%",
                      height: `${pct}%`,
                      borderRadius: "3px 3px 0 0",
                      background: isCurrent
                        ? "#facc15"
                        : aboveNormal
                        ? "#38bdf8"
                        : "rgba(96, 165, 250, 0.45)",
                      border: isCurrent ? "1px solid #ffffff" : "none",
                      transition: reduceMotion ? "none" : "height 0.2s ease",
                    }}
                  />
                  {/* Normal tick mark */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: `${normPct}%`,
                      left: 0,
                      right: 0,
                      height: "1.5px",
                      background: "rgba(255,255,255,0.35)",
                      pointerEvents: "none",
                    }}
                  />
                  <span style={{ fontSize: "9px", color: isCurrent ? "#facc15" : "#94a3b8", marginTop: "2px" }}>
                    {MONTHS[i]}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ height: "92px", display: "flex", alignItems: "center", color: "#64748b", fontSize: "12px" }}>
            Rainfall layer muted or starts in 1981
          </div>
        )}

        <div style={{ fontSize: "10.5px", color: "#60a5fa", opacity: 0.75, marginTop: "4px" }}>
          NASA POWER (mm/month) · White tick = 1981–2010 normal
        </div>
      </div>
    </div>
  );
}
