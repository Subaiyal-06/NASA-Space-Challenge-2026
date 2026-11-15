/**
 * LEGEND SLOT
 * Pastel Mint & White audio guide card with 3D AudioPulseArtifact3D + Lucide icons.
 * Contract props: { layers, explanation, reduceMotion }
 */
import React from "react";
import { motion } from "framer-motion";
import { Activity, CloudRain, Droplets, Headphones, Music, Thermometer, Wind } from "lucide-react";
import { AudioPulseArtifact3D } from "./Artifacts3D.jsx";

const INSTRUMENT_GUIDE = {
  temperature: { Icon: Thermometer, color: "#EA580C", name: "Temperature", sound: "Pad & arpeggio pitch/brightness (NASA GISTEMP / POWER)" },
  rainfall: { Icon: CloudRain, color: "#0284C7", name: "Rainfall", sound: "Plucked rain notes & filtered hiss (NASA POWER)" },
  drought: { Icon: Droplets, color: "#D97706", name: "Drought (SPI)", sound: "Low sub-bass rumble & muffled filter (NASA MERRA-2)" },
  quakes: { Icon: Activity, color: "#B45309", name: "Earthquakes", sound: "Deep seismic boom on event month (USGS, non-NASA)" },
  air: { Icon: Wind, color: "#475569", name: "Air Quality (AOD)", sound: "Pink-noise breath haze from 2000+ (NASA MODIS / MERRA-2)" },
};

export default function Legend({ layers = [], explanation = "", reduceMotion = false }) {
  const anyActive = layers.some((l) => l.available !== false && l.enabled !== false);

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.35 }}
      className="ej-card-3d"
      style={{ padding: "14px 16px" }}
    >
      {/* What am I hearing? Live Banner */}
      <div
        role="status"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          background: "#ECFDF5",
          border: "1px solid #A7F3D0",
          borderRadius: "12px",
          padding: "10px 12px",
          marginBottom: "12px",
          fontSize: "12px",
          color: "#064E3B",
          lineHeight: 1.45,
        }}
      >
        <AudioPulseArtifact3D active={anyActive} tension={0.35} reduceMotion={reduceMotion} />
        <div style={{ flex: 1 }}>
          <strong style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: "#047857", marginRight: "6px" }}>
            <Headphones size={14} />
            What am I hearing?
          </strong>
          <span>{explanation || "Select Play to hear the climate layers."}</span>
        </div>
      </div>

      {/* Instrument mapping list */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "8px" }}>
        {layers.map((l) => {
          const info = INSTRUMENT_GUIDE[l.id] ?? { Icon: Music, color: "#059669", name: l.label, sound: "Climate instrument" };
          const IconComponent = info.Icon;
          const active = l.available !== false && l.enabled !== false;
          return (
            <div
              key={l.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
                padding: "7px 9px",
                borderRadius: "10px",
                background: active ? "#F8FFFB" : "#F8FAFC",
                border: `1px solid ${active ? "#D1FAE5" : "#E2E8F0"}`,
                opacity: active ? 1 : 0.5,
                fontSize: "11px",
              }}
            >
              <IconComponent size={14} color={info.color} style={{ marginTop: "2px", flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700, color: "#064E3B" }}>{info.name}</div>
                <div style={{ color: "#475569", marginTop: "1px" }}>{info.sound}</div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
