/**
 * CHARTS SLOT
 * Pastel Mint & White minimal charts with Framer Motion + Lucide icons.
 * Contract props:
 *   { series, year, month, layers, mode, reduceMotion }
 */
import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { CloudRain, Thermometer } from "lucide-react";

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
    };
  }, [tempSeries, year, month]);

  const rainPlot = useMemo(() => {
    if (!rainSeries.length) return null;
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
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.32 }}
        className="ej-card-3d"
        style={{ padding: "14px 16px" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", gap: "8px" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12.5px", fontWeight: 700, color: "#064E3B" }}>
            <Thermometer size={15} color="#EA580C" />
            Temperature Anomaly (°C vs baseline)
          </span>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "#047857",
              background: "#ECFDF5",
              padding: "2px 8px",
              borderRadius: "9999px",
              border: "1px solid #BCEAD5",
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            }}
          >
            {tempPlot?.currentVal != null
              ? `${tempPlot.currentVal >= 0 ? "+" : ""}${tempPlot.currentVal.toFixed(2)}°C`
              : "NASA GISTEMP / POWER"}
          </span>
        </div>

        {tempPlot ? (
          <svg
            viewBox={`0 0 ${tempPlot.W} ${tempPlot.H}`}
            style={{ width: "100%", height: "94px", display: "block" }}
            role="img"
            aria-label="Temperature anomaly line chart"
          >
            <line
              x1="0"
              y1={tempPlot.zeroY}
              x2={tempPlot.W}
              y2={tempPlot.zeroY}
              stroke="#94A3B8"
              strokeDasharray="3 3"
              strokeWidth="1"
            />
            {tempPlot.areaPath && <path d={tempPlot.areaPath} fill="rgba(234, 88, 12, 0.14)" />}
            <polyline fill="none" stroke="#EA580C" strokeWidth="1.8" points={tempPlot.polyline} />
            <line
              x1={tempPlot.cursorX}
              y1="0"
              x2={tempPlot.cursorX}
              y2={tempPlot.H}
              stroke="#059669"
              strokeWidth="1.8"
            />
            <circle cx={tempPlot.cursorX} cy={tempPlot.cursorY} r="4.5" fill="#059669" stroke="#FFFFFF" strokeWidth="1.5" />
          </svg>
        ) : (
          <div style={{ height: "94px", display: "flex", alignItems: "center", color: "#475569", fontSize: "12px" }}>
            Temperature layer muted or unavailable
          </div>
        )}

        <div style={{ fontSize: "10.5px", color: "#475569", marginTop: "5px" }}>
          NASA GISTEMP v4 / NASA POWER · Warmer anomaly raises pitch & brightness
        </div>
      </motion.div>

      {/* Rainfall Bar Chart */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.36 }}
        className="ej-card-3d"
        style={{ padding: "14px 16px" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", gap: "8px" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12.5px", fontWeight: 700, color: "#064E3B" }}>
            <CloudRain size={15} color="#0284C7" />
            Monthly Rainfall ({year})
          </span>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "#0369A1",
              background: "#E0F2FE",
              padding: "2px 8px",
              borderRadius: "9999px",
              border: "1px solid #BAE6FD",
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            }}
          >
            {rainPlot ? `${Math.round(rainPlot.values[month] ?? 0)} mm` : "NASA POWER"}
          </span>
        </div>

        {rainPlot ? (
          <div
            role="img"
            aria-label="Monthly rainfall bar chart"
            style={{
              height: "94px",
              display: "grid",
              gridTemplateColumns: "repeat(12, 1fr)",
              gap: "4px",
              alignItems: "end",
              paddingTop: "8px",
            }}
          >
            {rainPlot.values.map((v, i) => {
              const pct = Math.min(100, Math.max(5, (v / rainPlot.maxVal) * 100));
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
                      borderRadius: "4px 4px 0 0",
                      background: isCurrent
                        ? "#059669"
                        : aboveNormal
                        ? "#0EA5E9"
                        : "#A7F3D0",
                      border: isCurrent ? "1.5px solid #064E3B" : "none",
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
                      background: "#064E3B",
                      opacity: 0.4,
                      pointerEvents: "none",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "9.5px",
                      fontWeight: isCurrent ? 700 : 600,
                      color: isCurrent ? "#064E3B" : "#475569",
                      marginTop: "2px",
                    }}
                  >
                    {MONTHS[i]}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ height: "94px", display: "flex", alignItems: "center", color: "#475569", fontSize: "12px" }}>
            Rainfall layer muted or starts in 1981
          </div>
        )}

        <div style={{ fontSize: "10.5px", color: "#475569", marginTop: "5px" }}>
          NASA POWER (mm/month) · Dark tick = 1981–2010 normal
        </div>
      </motion.div>
    </div>
  );
}
