/**
 * AMBIENT GLOW SLOT
 * Contract props:
 *   { states, side, beatPhase, reduceMotion }
 *   where states = [{ type, strength }], side = "both" | "left" | "right"
 *
 * Fixes applied:
 *  - Uses `side` ("both" | "left" | "right") and blended `states` from `buildAmbientGlowProps`
 *    so Compare Mode properly renders City A on the left edge and City B on the right edge!
 */
import React from "react";

const STATE_RGB = {
  "heavy-rain": [37, 99, 235],
  "light-rain": [96, 165, 250],
  hot: [234, 88, 12],
  cool: [56, 189, 248],
  drought: [180, 83, 9],
  haze: [148, 163, 184],
  quake: [250, 204, 21],
  calm: [14, 165, 233],
};

function blendStates(states = []) {
  if (!Array.isArray(states) || !states.length) {
    return "rgba(14, 165, 233, 0.14)";
  }
  let totalW = 0;
  let r = 0;
  let g = 0;
  let b = 0;
  let maxStrength = 0;

  for (const s of states) {
    const rgb = STATE_RGB[s.type] ?? STATE_RGB.calm;
    const w = Math.max(0.05, Number(s.strength) || 0.2);
    totalW += w;
    r += rgb[0] * w;
    g += rgb[1] * w;
    b += rgb[2] * w;
    if (w > maxStrength) maxStrength = w;
  }

  r = Math.round(r / totalW);
  g = Math.round(g / totalW);
  b = Math.round(b / totalW);
  const alpha = Math.min(0.5, 0.12 + maxStrength * 0.35);
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
}

export default function AmbientGlow({
  states = [{ type: "calm", strength: 0.2 }],
  side = "both",
  beatPhase = 0,
  reduceMotion = false,
}) {
  const color = blendStates(states);
  const pulseBoost = reduceMotion ? 1 : 1 + Math.sin(beatPhase * Math.PI * 2) * 0.08;

  let background;
  if (side === "left") {
    background = `radial-gradient(ellipse 55% 95% at 0% 50%, ${color} 0%, transparent 70%)`;
  } else if (side === "right") {
    background = `radial-gradient(ellipse 55% 95% at 100% 50%, ${color} 0%, transparent 70%)`;
  } else {
    background = `
      radial-gradient(ellipse 65% 90% at 0% 50%, ${color} 0%, transparent 60%),
      radial-gradient(ellipse 65% 90% at 100% 50%, ${color} 0%, transparent 60%),
      radial-gradient(ellipse 90% 45% at 50% 0%, ${color} 0%, transparent 55%),
      radial-gradient(ellipse 90% 45% at 50% 100%, ${color} 0%, transparent 55%)
    `;
  }

  return (
    <div
      data-testid={`ambient-glow-${side}`}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        background,
        opacity: pulseBoost,
        transition: reduceMotion ? "none" : "background 0.8s ease, opacity 0.4s ease",
      }}
    />
  );
}
