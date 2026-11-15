/**
 * AMBIENT GLOW SLOT
 * Pastel edge wash driven by climate conditions & Stereo Compare sides.
 * Contract props: { states, side, beatPhase, reduceMotion }
 */
import React from "react";
import { motion } from "framer-motion";

const STATE_RGB = {
  "heavy-rain": [14, 165, 233],
  "light-rain": [56, 189, 248],
  hot: [249, 115, 22],
  cool: [20, 184, 166],
  drought: [217, 119, 6],
  haze: [100, 116, 139],
  quake: [234, 179, 8],
  calm: [16, 185, 129],
};

function blendStates(states = []) {
  if (!Array.isArray(states) || !states.length) {
    return "rgba(16, 185, 129, 0.14)";
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
  const alpha = Math.min(0.28, 0.08 + maxStrength * 0.18);
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
}

export default function AmbientGlow({
  states = [{ type: "calm", strength: 0.2 }],
  side = "both",
  beatPhase = 0,
  reduceMotion = false,
}) {
  const color = blendStates(states);
  const pulseOpacity = reduceMotion ? 0.9 : 0.85 + Math.sin(beatPhase * Math.PI * 2) * 0.12;

  let background;
  if (side === "left") {
    background = `radial-gradient(ellipse 50% 90% at 0% 50%, ${color} 0%, transparent 72%)`;
  } else if (side === "right") {
    background = `radial-gradient(ellipse 50% 90% at 100% 50%, ${color} 0%, transparent 72%)`;
  } else {
    background = `
      radial-gradient(ellipse 55% 85% at 0% 50%, ${color} 0%, transparent 65%),
      radial-gradient(ellipse 55% 85% at 100% 50%, ${color} 0%, transparent 65%),
      radial-gradient(ellipse 85% 40% at 50% 0%, ${color} 0%, transparent 58%)
    `;
  }

  return (
    <motion.div
      data-testid={`ambient-glow-${side}`}
      aria-hidden="true"
      animate={{ opacity: pulseOpacity }}
      transition={{ duration: reduceMotion ? 0 : 0.45, ease: "easeOut" }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        background,
        transition: reduceMotion ? "none" : "background 0.8s ease",
      }}
    />
  );
}
