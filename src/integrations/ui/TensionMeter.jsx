/**
 * TENSION METER SLOT
 * Contract props: { tension, interest, reduceMotion }
 * Always labeled clearly as "our own index".
 */
import React from "react";

const LEVELS = [
  { max: 0.2, label: "Calm", color: "#22d3ee", textColor: "#a5f3fc" },
  { max: 0.4, label: "Stirring", color: "#34d399", textColor: "#a7f3d0" },
  { max: 0.6, label: "Unsettled", color: "#fbbf24", textColor: "#fde68a" },
  { max: 0.8, label: "Stressed", color: "#f97316", textColor: "#fed7aa" },
  { max: 1.0, label: "Critical", color: "#ef4444", textColor: "#fca5a5" },
];

export default function TensionMeter({ tension = 0, interest = 0, reduceMotion = false }) {
  const t = Math.max(0, Math.min(1, Number(tension) || 0));
  const pct = Math.round(t * 100);
  const level = LEVELS.find((l) => t <= l.max) ?? LEVELS[LEVELS.length - 1];

  return (
    <div
      role="meter"
      aria-label="Climate Tension Meter (our own index)"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      style={{
        background: "var(--ej-card-bg, rgba(13, 27, 42, 0.82))",
        border: "1px solid var(--ej-border, rgba(255,255,255,0.1))",
        borderRadius: "12px",
        padding: "12px 16px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#93c5fd" }}>
            Climate Tension
          </span>
          <span style={{ fontSize: "11px", color: "#60a5fa", opacity: 0.7, fontStyle: "italic" }}>
            (our own index)
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "13px", fontWeight: 700, color: level.textColor }}>
            {level.label}
          </span>
          <span style={{ fontSize: "13.5px", fontFamily: "monospace", color: "#ffffff", fontWeight: 700 }}>
            {pct}%
          </span>
        </div>
      </div>

      {/* Bar track */}
      <div
        style={{
          position: "relative",
          height: "11px",
          borderRadius: "9999px",
          overflow: "hidden",
          background: "rgba(255,255,255,0.09)",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: `${pct}%`,
            borderRadius: "9999px",
            background: `linear-gradient(90deg, #0ea5e9, ${level.color})`,
            boxShadow: `0 0 10px ${level.color}80`,
            transition: reduceMotion ? "none" : "width 0.45s ease, background 0.45s ease",
          }}
        />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", fontSize: "10px", color: "#64748b" }}>
        <span>0% Calm</span>
        <span>Interest: {Math.round((Number(interest) || 0) * 100)}%</span>
        <span>100% Critical</span>
      </div>
    </div>
  );
}
