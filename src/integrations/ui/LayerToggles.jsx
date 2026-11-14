/**
 * LAYER TOGGLES SLOT
 * Contract props:
 *   { layers, onToggle, reduceMotion }
 *   where layers = [{ id, label, available, reason, enabled }]
 */
import React from "react";

const LAYER_META = {
  temperature: { icon: "🌡️", color: "#fb923c" },
  rainfall: { icon: "🌧️", color: "#60a5fa" },
  drought: { icon: "🏜️", color: "#d97706" },
  quakes: { icon: "🌋", color: "#f59e0b" },
  air: { icon: "🌫️", color: "#94a3b8" },
};

export default function LayerToggles({ layers = [], onToggle, reduceMotion = false }) {
  return (
    <div
      style={{
        background: "var(--ej-card-bg, rgba(13, 27, 42, 0.82))",
        border: "1px solid var(--ej-border, rgba(255,255,255,0.1))",
        borderRadius: "12px",
        padding: "12px 14px",
      }}
    >
      <h3 style={{ fontSize: "12px", fontWeight: 700, color: "#93c5fd", margin: "0 0 8px 0" }}>
        🎛 Instrument Layers
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {layers.map((item) => {
          const meta = LAYER_META[item.id] ?? { icon: "🎵", color: "#38bdf8" };
          const available = item.available !== false;
          const enabled = item.enabled !== false && available;

          return (
            <label
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 8px",
                borderRadius: "8px",
                background: enabled ? "rgba(255,255,255,0.05)" : "transparent",
                opacity: available ? 1 : 0.48,
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
              />
              <span style={{ fontSize: "14px" }}>{meta.icon}</span>
              <span style={{ fontSize: "12px", color: "var(--ej-fg, #ffffff)", flex: 1, fontWeight: 500 }}>
                {item.label}
              </span>

              {!available && item.reason && (
                <span style={{ fontSize: "10.5px", color: "#7dd3fc", opacity: 0.8 }}>
                  {item.reason}
                </span>
              )}
              {available && !enabled && (
                <span style={{ fontSize: "10.5px", color: meta.color }}>muted</span>
              )}
            </label>
          );
        })}
      </div>

      <p style={{ fontSize: "10.5px", color: "#60a5fa", opacity: 0.7, margin: "8px 0 0 0" }}>
        Layers join as satellite records begin — the orchestra grows over time.
      </p>
    </div>
  );
}
