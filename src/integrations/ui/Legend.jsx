/**
 * LEGEND SLOT
 * Contract props: { layers, explanation, reduceMotion }
 * Shows "What am I hearing?" plain-language sentence + layer instrument guide + data sources.
 */
import React from "react";

const INSTRUMENT_GUIDE = {
  temperature: { icon: "🌡️", name: "Temperature", sound: "Pad & arpeggio pitch/brightness (NASA GISTEMP / POWER)" },
  rainfall: { icon: "🌧️", name: "Rainfall", sound: "Plucked rain notes & filtered hiss (NASA POWER)" },
  drought: { icon: "🏜️", name: "Drought (SPI)", sound: "Low sub-bass rumble & muffled filter (NASA MERRA-2)" },
  quakes: { icon: "🌋", name: "Earthquakes", sound: "Deep seismic boom on event month (USGS, non-NASA)" },
  air: { icon: "🌫️", name: "Air Quality (AOD)", sound: "Pink-noise breath haze from 2000+ (NASA MODIS / MERRA-2)" },
};

export default function Legend({ layers = [], explanation = "", reduceMotion = false }) {
  return (
    <div
      style={{
        background: "var(--ej-card-bg, rgba(13, 27, 42, 0.82))",
        border: "1px solid var(--ej-border, rgba(255,255,255,0.1))",
        borderRadius: "12px",
        padding: "12px 14px",
      }}
    >
      {/* What am I hearing? Live Banner */}
      <div
        role="status"
        style={{
          background: "rgba(14, 165, 233, 0.14)",
          border: "1px solid rgba(56, 189, 248, 0.35)",
          borderRadius: "8px",
          padding: "9px 12px",
          marginBottom: "10px",
          fontSize: "12px",
          color: "#e0f2fe",
          lineHeight: 1.45,
        }}
      >
        <strong style={{ color: "#38bdf8" }}>🎧 What am I hearing? </strong>
        <span>{explanation || "Select Play to hear the climate layers."}</span>
      </div>

      {/* Instrument mapping list */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "6px" }}>
        {layers.map((l) => {
          const info = INSTRUMENT_GUIDE[l.id] ?? { icon: "🎵", name: l.label, sound: "Climate instrument" };
          const active = l.available !== false && l.enabled !== false;
          return (
            <div
              key={l.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "6px",
                padding: "5px 7px",
                borderRadius: "6px",
                background: "rgba(255,255,255,0.03)",
                opacity: active ? 1 : 0.45,
                fontSize: "11px",
              }}
            >
              <span>{info.icon}</span>
              <div>
                <div style={{ fontWeight: 700, color: "#ffffff" }}>{info.name}</div>
                <div style={{ color: "#93c5fd", opacity: 0.85 }}>{info.sound}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
