/**
 * 3D SCULPTED ARTIFACTS (Minimal Pastel Green & White)
 * Pure vector 3D-shaded spheres, isometric diorama tiles, and acoustic wave orbs
 * animated with Framer Motion — zero emojis.
 */
import React from "react";
import { motion } from "framer-motion";

/**
 * 3D Isometric Earth / Climate Sphere Artifact
 */
export function GlobeArtifact3D({ size = 72, reduceMotion = false }) {
  return (
    <motion.div
      animate={reduceMotion ? {} : { y: [0, -5, 0] }}
      transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
      style={{
        width: size,
        height: size,
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 100 100" width={size} height={size} style={{ overflow: "visible" }}>
        <defs>
          <radialGradient id="spherePastel" cx="34%" cy="28%" r="72%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="32%" stopColor="#a7f3d0" />
            <stop offset="72%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </radialGradient>
          <linearGradient id="ringMint" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.6" />
          </linearGradient>
          <filter id="softDrop3d" x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#059669" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Ground contact shadow */}
        <ellipse cx="50" cy="91" rx="28" ry="5" fill="rgba(5, 150, 105, 0.16)" />

        {/* Back orbital ring */}
        <path
          d="M 10 52 A 42 14 -16 0 1 90 48"
          fill="none"
          stroke="url(#ringMint)"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.45"
        />

        {/* Sculpted 3D sphere */}
        <circle cx="50" cy="48" r="32" fill="url(#spherePastel)" filter="url(#softDrop3d)" />

        {/* Latitude & Longitude subtle arcs */}
        <ellipse cx="50" cy="48" rx="15" ry="31" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.2" />
        <ellipse cx="50" cy="48" rx="31" ry="11" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.1" />

        {/* Specular highlight */}
        <ellipse cx="38" cy="34" rx="10" ry="6" transform="rotate(-28 38 34)" fill="rgba(255,255,255,0.72)" />

        {/* Front orbital ring */}
        <path
          d="M 10 52 A 42 14 -16 0 0 90 48"
          fill="none"
          stroke="url(#ringMint)"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Orbiting satellite node */}
        <circle cx="84" cy="43" r="4" fill="#ffffff" stroke="#059669" strokeWidth="2" />
      </svg>
    </motion.div>
  );
}

/**
 * 3D Isometric Climate Diorama Artifact for WeatherLayer
 * Renders a layered 3D terrain slab with volumetric sun/rain/haze/quake/1980s-ghost objects.
 */
export function WeatherDiorama3D({
  isHot,
  isCool,
  isRaining,
  rainLevel = 0,
  droughtLevel = 0,
  airLevel = 0,
  quake = null,
  ghost = null,
  reduceMotion = false,
}) {
  const slabTop = droughtLevel > 0.35
    ? "#fde68a"
    : isHot
    ? "#fed7aa"
    : isRaining
    ? "#bfdbfe"
    : "#d1fae5";
  const slabSideLeft = droughtLevel > 0.35 ? "#d97706" : isRaining ? "#60a5fa" : "#34d399";
  const slabSideRight = droughtLevel > 0.35 ? "#b45309" : isRaining ? "#3b82f6" : "#059669";

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "155px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 240 160" style={{ width: "220px", height: "150px", overflow: "visible" }}>
        <defs>
          <radialGradient id="sunOrb3d" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor={isHot ? "#fb923c" : isCool ? "#93c5fd" : "#fde047"} />
            <stop offset="100%" stopColor={isHot ? "#ea580c" : isCool ? "#3b82f6" : "#f59e0b"} />
          </radialGradient>
          <linearGradient id="cloud3d" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>
          <filter id="dioramaShadow" x="-20%" y="-20%" width="140%" height="150%">
            <feDropShadow dx="0" dy="10" stdDeviation="6" floodColor="#064e3b" floodOpacity="0.16" />
          </filter>
        </defs>

        {/* Isometric 3D Terrain Tile */}
        <g filter="url(#dioramaShadow)">
          {/* Top face */}
          <polygon points="120,76 205,108 120,140 35,108" fill={slabTop} stroke="#ffffff" strokeWidth="1.5" />
          {/* Left extruded side */}
          <polygon points="35,108 120,140 120,152 35,120" fill={slabSideLeft} opacity="0.88" />
          {/* Right extruded side */}
          <polygon points="205,108 120,140 120,152 205,120" fill={slabSideRight} opacity="0.92" />
          {/* Subtle grid lines on terrain */}
          <line x1="77" y1="92" x2="162" y2="124" stroke="rgba(255,255,255,0.55)" strokeWidth="1" />
          <line x1="162" y1="92" x2="77" y2="124" stroke="rgba(255,255,255,0.55)" strokeWidth="1" />
        </g>

        {/* Earthquake 3D Shockwave Rings on terrain */}
        {quake && (
          <motion.g
            animate={reduceMotion ? {} : { scale: [0.85, 1.15, 0.85], opacity: [0.95, 0.4, 0.95] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "120px 108px" }}
          >
            <ellipse cx="120" cy="108" rx="46" ry="17" fill="none" stroke="#f59e0b" strokeWidth="2.5" />
            <ellipse cx="120" cy="108" rx="28" ry="10" fill="none" stroke="#ea580c" strokeWidth="2" />
          </motion.g>
        )}

        {/* 1980s Baseline Wireframe Ghost Sphere */}
        {ghost && (
          <motion.g
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.72, scale: 1 }}
            transition={{ duration: reduceMotion ? 0 : 0.4 }}
          >
            <circle
              cx="66"
              cy="52"
              r="16"
              fill="rgba(255,255,255,0.45)"
              stroke="#059669"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
            <ellipse
              cx="66"
              cy="52"
              rx="16"
              ry="6"
              fill="none"
              stroke="#059669"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
          </motion.g>
        )}

        {/* 3D Sun / Heat Orb OR 3D Rain Cloud */}
        {!isRaining ? (
          <motion.g
            animate={reduceMotion ? {} : { y: [0, -4, 0] }}
            transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <circle
              cx="148"
              cy="46"
              r={isHot ? 26 : 21}
              fill="url(#sunOrb3d)"
              filter="url(#dioramaShadow)"
            />
            <ellipse cx="141" cy="38" rx="7" ry="4" transform="rotate(-25 141 38)" fill="rgba(255,255,255,0.65)" />
          </motion.g>
        ) : (
          <motion.g
            animate={reduceMotion ? {} : { y: [0, -3, 0] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            filter="url(#dioramaShadow)"
          >
            <circle cx="102" cy="48" r="18" fill="url(#cloud3d)" />
            <circle cx="124" cy="40" r="22" fill="url(#cloud3d)" />
            <circle cx="146" cy="48" r="16" fill="url(#cloud3d)" />
            <rect x="98" y="46" width="52" height="20" rx="10" fill="url(#cloud3d)" />
            {/* 3D Rain streaks */}
            {[102, 116, 130, 142].map((rx, idx) => (
              <motion.line
                key={rx}
                x1={rx}
                y1="70"
                x2={rx - 3}
                y2={80 + rainLevel * 6}
                stroke="#3b82f6"
                strokeWidth="2.2"
                strokeLinecap="round"
                animate={reduceMotion ? {} : { y: [0, 10, 0], opacity: [0.9, 0.3, 0.9] }}
                transition={{ duration: 0.9, delay: idx * 0.15, repeat: Infinity }}
              />
            ))}
          </motion.g>
        )}

        {/* Air Aerosol Haze Pill */}
        {airLevel > 0.2 && (
          <ellipse
            cx="120"
            cy="78"
            rx="68"
            ry="14"
            fill="rgba(148, 163, 184, 0.32)"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="1"
          />
        )}
      </svg>
    </div>
  );
}

/**
 * Animated 3D Acoustic Wave Bars (used in Header & Legend)
 */
export function AudioPulseArtifact3D({ active = false, tension = 0, reduceMotion = false }) {
  const bars = [0.45, 0.85, 0.65, 0.95, 0.55];
  return (
    <div
      style={{ display: "inline-flex", alignItems: "center", gap: "3px", height: "18px" }}
      aria-hidden="true"
    >
      {bars.map((h, i) => (
        <motion.span
          key={i}
          animate={
            active && !reduceMotion
              ? { scaleY: [0.35, h + tension * 0.3, 0.4] }
              : { scaleY: 0.4 }
          }
          transition={{
            duration: 0.65 + i * 0.1,
            repeat: active && !reduceMotion ? Infinity : 0,
            ease: "easeInOut",
          }}
          style={{
            width: "3px",
            height: "16px",
            borderRadius: "9999px",
            background: "linear-gradient(to top, #059669, #34d399)",
            transformOrigin: "bottom",
          }}
        />
      ))}
    </div>
  );
}

