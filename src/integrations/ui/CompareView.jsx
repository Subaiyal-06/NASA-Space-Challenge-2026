/**
 * COMPARE VIEW SLOT
 * Pastel Mint & White 3D side-by-side stereo comparison with Framer Motion + Lucide icons.
 * Contract props:
 *   { cityA, cityB, summary, changeSince, startYear, onStartYearChange, reduceMotion }
 */
import React from "react";
import { motion } from "framer-motion";
import { CloudRain, Droplets, Headphones, Thermometer, Wind } from "lucide-react";

const START_YEARS = [1981, 1990, 2000, 2010];
const CITY_NAMES = {
  karachi: "Karachi",
  lahore: "Lahore",
  islamabad: "Islamabad",
  peshawar: "Peshawar",
  quetta: "Quetta",
};

export default function CompareView({
  cityA = "karachi",
  cityB = "lahore",
  summary = "",
  changeSince = {},
  startYear = 1981,
  onStartYearChange,
  reduceMotion = false,
}) {
  const nameA = CITY_NAMES[cityA] ?? cityA ?? "City A";
  const nameB = CITY_NAMES[cityB] ?? cityB ?? "City B";
  const deltaA = changeSince?.[cityA] ?? {};
  const deltaB = changeSince?.[cityB] ?? {};

  return (
    <motion.div
      aria-label="Stereo city comparison"
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.3 }}
      className="ej-card-3d"
      style={{ padding: "16px 18px" }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          marginBottom: "12px",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: "15.5px",
              fontWeight: 700,
              color: "#064E3B",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Headphones size={17} color="#059669" />
            <span>
              Stereo Compare: {nameA} (Left Ear) vs {nameB} (Right Ear)
            </span>
          </h2>
          <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#475569" }}>
            {summary || `Comparing ${nameA} and ${nameB} since ${startYear} (in our data).`}
          </p>
        </div>

        {/* Change Since year buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "11.5px", fontWeight: 600, color: "#475569" }}>Change since:</span>
          {START_YEARS.map((y) => {
            const active = startYear === y;
            return (
              <motion.button
                key={y}
                type="button"
                whileTap={reduceMotion ? undefined : { scale: 0.95 }}
                onClick={() => onStartYearChange?.(y)}
                aria-pressed={active}
                style={{
                  padding: "4px 10px",
                  borderRadius: "8px",
                  fontSize: "11.5px",
                  fontWeight: active ? 700 : 600,
                  color: active ? "#FFFFFF" : "#065F46",
                  background: active ? "linear-gradient(135deg, #10B981, #059669)" : "#F0FDF4",
                  border: `1px solid ${active ? "#059669" : "#BCEAD5"}`,
                  cursor: "pointer",
                }}
              >
                {y}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Side-by-side Deltas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px" }}>
        <CityDeltaCard title={`${nameA} (Left)`} accent="#059669" delta={deltaA} startYear={startYear} />
        <CityDeltaCard title={`${nameB} (Right)`} accent="#0D9488" delta={deltaB} startYear={startYear} />
      </div>
    </motion.div>
  );
}

function CityDeltaCard({ title, accent, delta = {}, startYear }) {
  const fmt = (val, unit, isPct = false) => {
    if (val == null || Number.isNaN(val)) return "—";
    const sign = val > 0 ? "+" : "";
    return `${sign}${isPct ? Math.round(val) : Number(val).toFixed(1)}${unit}`;
  };

  return (
    <div
      style={{
        background: "#F8FFFB",
        border: "1px solid #D1FAE5",
        borderRadius: "12px",
        padding: "12px 14px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "8px" }}>
        <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: accent }} />
        <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#064E3B" }}>
          {title} · Change since {startYear}
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", fontSize: "11px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#475569", fontWeight: 600 }}>
            <Thermometer size={12} color="#EA580C" />
            <span>Temp</span>
          </div>
          <div style={{ fontWeight: 700, fontSize: "13px", color: (delta.tempDelta ?? 0) >= 0 ? "#C2410C" : "#0369A1" }}>
            {fmt(delta.tempDelta, "°C")}
          </div>
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#475569", fontWeight: 600 }}>
            <CloudRain size={12} color="#0284C7" />
            <span>Rain</span>
          </div>
          <div style={{ fontWeight: 700, fontSize: "13px", color: "#0369A1" }}>
            {fmt(delta.rainPctDelta, "%", true)}
          </div>
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#475569", fontWeight: 600 }}>
            <Droplets size={12} color="#D97706" />
            <span>SPI</span>
          </div>
          <div style={{ fontWeight: 700, fontSize: "13px", color: "#B45309" }}>
            {fmt(delta.spiDelta, "")}
          </div>
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#475569", fontWeight: 600 }}>
            <Wind size={12} color="#475569" />
            <span>AOD</span>
          </div>
          <div style={{ fontWeight: 700, fontSize: "13px", color: "#334155" }}>
            {fmt(delta.aodPctDelta, "%", true)}
          </div>
        </div>
      </div>
    </div>
  );
}
