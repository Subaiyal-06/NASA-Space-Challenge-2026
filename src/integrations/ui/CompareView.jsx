/**
 * COMPARE VIEW SLOT
 * Contract props:
 *   { cityA, cityB, summary, changeSince, startYear, onStartYearChange, reduceMotion }
 */
import React from "react";

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
    <div
      aria-label="Stereo city comparison"
      style={{
        background: "var(--ej-card-bg, rgba(13, 27, 42, 0.85))",
        border: "1px solid var(--ej-border, rgba(255,255,255,0.12))",
        borderRadius: "12px",
        padding: "14px 18px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          marginBottom: "10px",
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#ffffff" }}>
            🎧 Stereo Compare: 🔵 {nameA} (Left Ear) vs 🟣 {nameB} (Right Ear)
          </h2>
          <p style={{ margin: "3px 0 0 0", fontSize: "12px", color: "#bae6fd" }}>
            {summary || `Comparing ${nameA} and ${nameB} since ${startYear} (in our data).`}
          </p>
        </div>

        {/* Change Since year buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "11.5px", color: "#93c5fd" }}>Change since:</span>
          {START_YEARS.map((y) => {
            const active = startYear === y;
            return (
              <button
                key={y}
                type="button"
                onClick={() => onStartYearChange?.(y)}
                aria-pressed={active}
                style={{
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontSize: "11.5px",
                  fontWeight: active ? 700 : 500,
                  color: active ? "#ffffff" : "#93c5fd",
                  background: active ? "rgba(14, 165, 233, 0.42)" : "rgba(255,255,255,0.06)",
                  border: `1px solid ${active ? "rgba(14,165,233,0.75)" : "rgba(255,255,255,0.12)"}`,
                  cursor: "pointer",
                }}
              >
                {y}
              </button>
            );
          })}
        </div>
      </div>

      {/* Side-by-side Deltas */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <CityDeltaCard title={`🔵 ${nameA} (Left)`} delta={deltaA} startYear={startYear} />
        <CityDeltaCard title={`🟣 ${nameB} (Right)`} delta={deltaB} startYear={startYear} />
      </div>
    </div>
  );
}

function CityDeltaCard({ title, delta = {}, startYear }) {
  const fmt = (val, unit, isPct = false) => {
    if (val == null || Number.isNaN(val)) return "—";
    const sign = val > 0 ? "+" : "";
    return `${sign}${isPct ? Math.round(val) : Number(val).toFixed(1)}${unit}`;
  };

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "8px",
        padding: "10px 12px",
      }}
    >
      <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#e0f2fe", marginBottom: "6px" }}>
        {title} · Change since {startYear}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px", fontSize: "11px" }}>
        <div>
          <div style={{ color: "#94a3b8" }}>🌡 Temp</div>
          <div style={{ fontWeight: 700, color: (delta.tempDelta ?? 0) >= 0 ? "#fdba74" : "#93c5fd" }}>
            {fmt(delta.tempDelta, "°C")}
          </div>
        </div>
        <div>
          <div style={{ color: "#94a3b8" }}>🌧 Rain</div>
          <div style={{ fontWeight: 700, color: "#7dd3fc" }}>
            {fmt(delta.rainPctDelta, "%", true)}
          </div>
        </div>
        <div>
          <div style={{ color: "#94a3b8" }}>🏜 SPI</div>
          <div style={{ fontWeight: 700, color: "#fcd34d" }}>
            {fmt(delta.spiDelta, "")}
          </div>
        </div>
        <div>
          <div style={{ color: "#94a3b8" }}>🌫 AOD</div>
          <div style={{ fontWeight: 700, color: "#cbd5e1" }}>
            {fmt(delta.aodPctDelta, "%", true)}
          </div>
        </div>
      </div>
    </div>
  );
}
