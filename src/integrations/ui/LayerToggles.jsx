/**
 * LAYER TOGGLES SLOT
 * Pastel Mint & White 3D card with Lucide icons + Framer Motion hover feedback.
 * Contract props:
 *   { layers, onToggle, reduceMotion }
 */
import React from "react";
import { motion } from "framer-motion";
import { Activity, CloudRain, Droplets, Music, SlidersHorizontal, Thermometer, Wind } from "lucide-react";

const LAYER_META = {
  temperature: { Icon: Thermometer, color: "#EA580C" },
  rainfall: { Icon: CloudRain, color: "#0284C7" },
  drought: { Icon: Droplets, color: "#D97706" },
  quakes: { Icon: Activity, color: "#B45309" },
  air: { Icon: Wind, color: "#475569" },
};

export default function LayerToggles({ layers = [], onToggle, reduceMotion = false }) {
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.3 }}
      className="ej-card-3d"
      style={{ padding: "14px 16px" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "10px" }}>
        <SlidersHorizontal size={15} color="#059669" />
        <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#064E3B", margin: 0 }}>Instrument Layers</h3>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {layers.map((item) => {
          const meta = LAYER_META[item.id] ?? { Icon: Music, color: "#059669" };
          const IconComponent = meta.Icon;
          const available = item.available !== false;
          const enabled = item.enabled !== false && available;

          return (
            <label
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "7px 10px",
                borderRadius: "10px",
                background: enabled ? "#ECFDF5" : "#F8FAFC",
                border: `1px solid ${enabled ? "#BCEAD5" : "#E2E8F0"}`,
                opacity: available ? 1 : 0.52,
                cursor: available ? "pointer" : "not-allowed",
                transition: reduceMotion ? "none" : "all 0.15s ease",
              }}
            >
              <input
                type="checkbox"
                checked={enabled}
                disabled={!available}
                onChange={() => available && onToggle?.(item.id)}
                aria-label={`Toggle ${item.label} layer`}
                style={{ accentColor: "#059669" }}
              />
              <IconComponent size={15} color={meta.color} />
              <span style={{ fontSize: "12.5px", color: "#064E3B", flex: 1, fontWeight: 600 }}>{item.label}</span>

              {!available && item.reason && (
                <span style={{ fontSize: "10.5px", color: "#475569", fontWeight: 600 }}>{item.reason}</span>
              )}
              {available && !enabled && (
                <span style={{ fontSize: "10.5px", color: meta.color, fontWeight: 600 }}>muted</span>
              )}
            </label>
          );
        })}
      </div>

      <p style={{ fontSize: "10.5px", color: "#475569", margin: "10px 0 0 0", lineHeight: 1.4 }}>
        Layers join as satellite records begin — the orchestra grows over time.
      </p>
    </motion.div>
  );
}
