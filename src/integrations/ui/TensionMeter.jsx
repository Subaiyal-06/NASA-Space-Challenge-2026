/**
 * TENSION METER SLOT
 * Pastel Mint & White 3D meter card with Framer Motion animated bar.
 * Contract props: { tension, interest, reduceMotion }
 * Always labeled clearly as "our own index".
 */
import React from "react";
import { motion } from "framer-motion";
import { Gauge } from "lucide-react";

const LEVELS = [
  { max: 0.2, label: "Calm", color: "#10B981", pillBg: "#D1FAE5", pillFg: "#065F46" },
  { max: 0.4, label: "Stirring", color: "#14B8A6", pillBg: "#CCFBF1", pillFg: "#115E59" },
  { max: 0.6, label: "Unsettled", color: "#D97706", pillBg: "#FEF3C7", pillFg: "#92400E" },
  { max: 0.8, label: "Stressed", color: "#EA580C", pillBg: "#FFEDD5", pillFg: "#9A3412" },
  { max: 1.0, label: "Critical", color: "#DC2626", pillBg: "#FEE2E2", pillFg: "#991B1B" },
];

export default function TensionMeter({ tension = 0, interest = 0, reduceMotion = false }) {
  const t = Math.max(0, Math.min(1, Number(tension) || 0));
  const pct = Math.round(t * 100);
  const level = LEVELS.find((l) => t <= l.max) ?? LEVELS[LEVELS.length - 1];

  return (
    <motion.div
      role="meter"
      aria-label="Climate Tension Meter (our own index)"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.28 }}
      className="ej-card-3d"
      style={{
        padding: "14px 16px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <Gauge size={16} color="#059669" />
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#064E3B" }}>Climate Tension</span>
          <span style={{ fontSize: "11px", color: "#475569", fontStyle: "italic" }}>(our own index)</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              fontSize: "11.5px",
              fontWeight: 700,
              padding: "2px 9px",
              borderRadius: "9999px",
              background: level.pillBg,
              color: level.pillFg,
            }}
          >
            {level.label}
          </span>
          <span
            style={{
              fontSize: "13.5px",
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              color: "#064E3B",
              fontWeight: 700,
            }}
          >
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
          background: "#E2F7EC",
          border: "1px solid #BCEAD5",
        }}
      >
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={{ duration: reduceMotion ? 0 : 0.45, ease: "easeOut" }}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            borderRadius: "9999px",
            background: `linear-gradient(90deg, #34D399, ${level.color})`,
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "6px",
          fontSize: "10.5px",
          fontWeight: 600,
          color: "#475569",
        }}
      >
        <span>0% Calm</span>
        <span>Interest: {Math.round((Number(interest) || 0) * 100)}%</span>
        <span>100% Critical</span>
      </div>
    </motion.div>
  );
}
