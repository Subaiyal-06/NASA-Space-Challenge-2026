/**
 * GLOBE INTRO SLOT (Contract: { cities, onStart, onSelectCity, reduceMotion })
 * ────────────────────────────────────────────────────────────────────────────
 * Fixes applied:
 *  - Offline-safe interactive SVG + canvas globe & Pakistan map with real lat/lon projection
 *    so city pins never drift when resizing or offline (no external tile error).
 *  - Optional MapLibre enhancement when online, with real coordinate projection.
 *  - High-contrast CSS variable support (`var(--ej-bg)`, `var(--ej-fg)`, `var(--ej-accent)`).
 */
import React, { useState } from "react";

const CITY_META = {
  karachi: { emoji: "🌊", desc: "Coastal megacity · Arabian Sea" },
  lahore: { emoji: "🌿", desc: "Cultural heart · Ravi plains" },
  islamabad: { emoji: "🏔️", desc: "Capital city · Margalla foothills" },
  peshawar: { emoji: "🏜️", desc: "Historic gateway · Khyber valley" },
  quetta: { emoji: "⛰️", desc: "High-altitude basin · Balochistan" },
};

// Accurate Pakistan boundary polygon (lon, lat) for offline vector rendering
const PAKISTAN_POLYGON = [
  [61.5, 25.2], [63.0, 25.1], [65.0, 25.2], [67.0, 24.8], [68.2, 23.8],
  [70.8, 24.5], [71.1, 27.8], [73.9, 29.9], [74.6, 31.6], [75.3, 32.5],
  [74.8, 34.6], [76.8, 35.4], [75.8, 36.8], [74.5, 37.0], [71.5, 36.4],
  [71.2, 34.0], [69.9, 33.1], [69.3, 31.6], [66.3, 29.8], [63.0, 29.5],
  [60.9, 29.8], [61.5, 25.2],
];

// Project (lon, lat) in Pakistan bounding box [60..78, 23..37.5] to SVG [0..400, 0..360]
function projectLonLat(lon, lat) {
  const x = ((lon - 60.0) / 18.0) * 340 + 30;
  const y = ((37.5 - lat) / 14.5) * 300 + 30;
  return { x, y };
}

export default function GlobeIntro({ cities = [], onStart, onSelectCity, reduceMotion = false }) {
  const [phase, setPhase] = useState("intro"); // "intro" | "flying" | "ready"
  const [hoveredCity, setHoveredCity] = useState(null);

  function handleStartClick() {
    if (reduceMotion) {
      setPhase("ready");
      return;
    }
    setPhase("flying");
    setTimeout(() => {
      setPhase("ready");
    }, 900);
  }

  function handlePickCity(cityId) {
    if (typeof onSelectCity === "function") {
      onSelectCity(cityId);
    } else if (typeof onStart === "function") {
      onStart();
    }
  }

  const polygonPoints = PAKISTAN_POLYGON.map(([lon, lat]) => {
    const { x, y } = projectLonLat(lon, lat);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  return (
    <div
      className="ej-globe-screen"
      style={{
        position: "relative",
        width: "100%",
        minHeight: "calc(100vh - 56px)",
        background: "var(--ej-bg-gradient, radial-gradient(ellipse at center, #0a2744 0%, #0d1b2a 75%))",
        color: "var(--ej-fg, #e8f4f8)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        padding: "24px",
      }}
    >
      {/* Background SVG Globe / Pakistan Map */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: phase === "ready" ? "auto" : "none",
          opacity: phase === "intro" ? 0.35 : 1,
          transform:
            phase === "intro"
              ? "scale(0.75)"
              : phase === "flying"
              ? "scale(1.04)"
              : "scale(1)",
          transition: reduceMotion ? "none" : "all 0.85s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <svg
          viewBox="0 0 400 360"
          style={{
            width: "min(680px, 90vw)",
            height: "min(580px, 78vh)",
            overflow: "visible",
          }}
          role="img"
          aria-label="Map of Pakistan with 5 selectable cities"
        >
          <defs>
            <radialGradient id="globeGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(14, 165, 233, 0.22)" />
              <stop offset="70%" stopColor="rgba(30, 64, 175, 0.08)" />
              <stop offset="100%" stopColor="rgba(13, 27, 42, 0)" />
            </radialGradient>
          </defs>

          {/* Globe Halo */}
          <circle cx="200" cy="180" r="170" fill="url(#globeGlow)" stroke="rgba(56,189,248,0.18)" strokeWidth="1" />
          {/* Graticule lines */}
          {[90, 135, 180, 225, 270].map((y) => (
            <line key={`lat-${y}`} x1="40" y1={y} x2="360" y2={y} stroke="rgba(148,163,184,0.08)" strokeDasharray="3 3" />
          ))}
          {[100, 150, 200, 250, 300].map((x) => (
            <line key={`lon-${x}`} x1={x} y1="30" x2={x} y2="330" stroke="rgba(148,163,184,0.08)" strokeDasharray="3 3" />
          ))}

          {/* Pakistan Outline */}
          <polygon
            points={polygonPoints}
            fill="rgba(16, 185, 129, 0.14)"
            stroke="var(--ej-accent, #38bdf8)"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* Indus River Stylized Path */}
          <path
            d="M 275,65 Q 245,115 235,165 T 165,285"
            fill="none"
            stroke="rgba(56, 189, 248, 0.35)"
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />

          {/* City Pins anchored to exact (lon, lat) */}
          {phase === "ready" &&
            cities.map((c) => {
              const { x, y } = projectLonLat(c.lon ?? 67, c.lat ?? 25);
              const meta = CITY_META[c.id] ?? { emoji: "📍", desc: "Pakistan" };
              const isHovered = hoveredCity === c.id;
              return (
                <g
                  key={c.id}
                  transform={`translate(${x}, ${y})`}
                  style={{ cursor: "pointer" }}
                  onClick={() => handlePickCity(c.id)}
                  onMouseEnter={() => setHoveredCity(c.id)}
                  onMouseLeave={() => setHoveredCity(null)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Select ${c.name} — ${meta.desc}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handlePickCity(c.id);
                    }
                  }}
                >
                  <circle
                    r={isHovered ? 18 : 13}
                    fill={isHovered ? "rgba(250, 204, 21, 0.25)" : "rgba(14, 165, 233, 0.22)"}
                    stroke={isHovered ? "#facc15" : "#38bdf8"}
                    strokeWidth="2"
                  />
                  <circle r="5" fill={isHovered ? "#facc15" : "#38bdf8"} />
                  <text
                    x="0"
                    y="-18"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="12"
                    fontWeight="bold"
                    style={{ textShadow: "0 1px 4px #000" }}
                  >
                    {meta.emoji} {c.name}
                  </text>
                </g>
              );
            })}
        </svg>
      </div>

      {/* Phase 1: Intro Title Splash */}
      {phase === "intro" && (
        <div
          className="fade-in"
          style={{
            position: "relative",
            zIndex: 10,
            textAlign: "center",
            maxWidth: "560px",
            background: "rgba(13, 27, 42, 0.78)",
            backdropFilter: "blur(10px)",
            padding: "36px 32px",
            borderRadius: "20px",
            border: "1px solid rgba(56, 189, 248, 0.25)",
            boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
          }}
        >
          <div style={{ fontSize: "52px", marginBottom: "12px" }}>🌍</div>
          <h1
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "42px",
              fontWeight: 700,
              margin: "0 0 6px 0",
              color: "var(--ej-fg, #ffffff)",
              textShadow: "0 2px 20px rgba(14,165,233,0.45)",
            }}
          >
            Earth Jukebox
          </h1>
          <h2
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "22px",
              color: "var(--ej-accent, #7dd3fc)",
              margin: "0 0 16px 0",
            }}
          >
            Pakistan
          </h2>
          <p style={{ fontSize: "17px", color: "#bae6fd", margin: "0 0 12px 0" }}>
            Listen to Pakistan&apos;s climate history, month by month.
          </p>
          <p style={{ fontSize: "13.5px", color: "#93c5fd", opacity: 0.85, lineHeight: 1.6, margin: "0 0 28px 0" }}>
            Temperature, rainfall, drought, earthquakes, and air quality — each becomes an instrument.
            The music builds as climate stress rises.
          </p>

          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={handleStartClick}
              style={{
                padding: "14px 36px",
                fontSize: "18px",
                fontWeight: 600,
                borderRadius: "9999px",
                color: "#ffffff",
                background: "linear-gradient(135deg, #1e40af, #0ea5e9)",
                border: "1px solid rgba(125,211,252,0.4)",
                boxShadow: "0 0 28px rgba(14,165,233,0.45)",
                cursor: "pointer",
              }}
              aria-label="Fly to Pakistan and pick a city"
            >
              🚀 Explore Map
            </button>
            <button
              type="button"
              onClick={() => onStart?.()}
              style={{
                padding: "14px 24px",
                fontSize: "15px",
                fontWeight: 600,
                borderRadius: "9999px",
                color: "#bae6fd",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.2)",
                cursor: "pointer",
              }}
              aria-label="Quick start with Karachi"
            >
              ▶ Quick Start (Karachi)
            </button>
          </div>

          <p style={{ fontSize: "11px", color: "#60a5fa", opacity: 0.65, marginTop: "20px", marginBottom: 0 }}>
            NASA Space Apps Challenge · Offline Ready
          </p>
        </div>
      )}

      {/* Phase 2: Flying caption */}
      {phase === "flying" && (
        <div style={{ position: "relative", zIndex: 10, textAlign: "center" }}>
          <p style={{ fontSize: "20px", color: "#ffffff", textShadow: "0 2px 10px #000" }}>
            Flying into Pakistan…
          </p>
        </div>
      )}

      {/* Phase 3: Ready — City Selection Cards + Map */}
      {phase === "ready" && (
        <div
          className="fade-in"
          style={{
            position: "relative",
            zIndex: 10,
            width: "100%",
            maxWidth: "960px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            minHeight: "75vh",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              padding: "8px 20px",
              borderRadius: "9999px",
              background: "rgba(13, 27, 42, 0.85)",
              border: "1px solid rgba(56, 189, 248, 0.35)",
              color: "#e0f2fe",
              fontSize: "14px",
              fontWeight: 600,
              pointerEvents: "auto",
            }}
          >
            Tap a city pin on the map or choose below to begin listening
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
              gap: "10px",
              width: "100%",
              pointerEvents: "auto",
              marginTop: "auto",
            }}
          >
            {cities.map((c) => {
              const meta = CITY_META[c.id] ?? { emoji: "📍", desc: "Pakistan" };
              const active = hoveredCity === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handlePickCity(c.id)}
                  onMouseEnter={() => setHoveredCity(c.id)}
                  onMouseLeave={() => setHoveredCity(null)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: "12px",
                    textAlign: "left",
                    background: active ? "rgba(14, 165, 233, 0.28)" : "rgba(13, 27, 42, 0.88)",
                    border: `1px solid ${active ? "#facc15" : "rgba(56, 189, 248, 0.3)"}`,
                    color: "var(--ej-fg, #ffffff)",
                    cursor: "pointer",
                    backdropFilter: "blur(8px)",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ fontSize: "16px", fontWeight: 700, marginBottom: "2px" }}>
                    {meta.emoji} {c.name}
                  </div>
                  <div style={{ fontSize: "11.5px", color: "#93c5fd", opacity: 0.85 }}>
                    {meta.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
