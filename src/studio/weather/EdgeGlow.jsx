// The ambient edge glow: a soft colour around the screen edges that matches the weather, like a video player's
// ambient light. Colours blend by strength and fade over 1.5 s, and the glow breathes once per bar (every 2.5 s,
// faster when the climate "tension" is high). Lightning adds a soft flash (never more than one per 4 s).
// Cheap on purpose: only opacity is animated.
import React from "react";
import { GLOW_COLORS } from "./rules.js";
import { useFx } from "./fx.js";

// side: "left" or "right" while comparing (city A fades in from the left edge, city B from the right), else the whole frame
export default function EdgeGlow({ glow, beatSeconds, reduce, side }) {
  const flash = useFx((s) => s.flash);
  const strengths = {};
  for (const g of glow) strengths[g.type] = Math.max(strengths[g.type] ?? 0, g.strength);
  return (
    <div className={`edge${reduce ? " edge--still" : ""}${side ? ` edge--${side}` : ""}`} style={{ "--beat": `${beatSeconds.toFixed(2)}s` }} aria-hidden="true">
      {Object.entries(GLOW_COLORS).map(([type, color]) => (
        <div key={type} className="edge__layer" data-type={type} style={{ "--c": color, opacity: Math.min(1, strengths[type] ?? 0) }} />
      ))}
      {!reduce && flash > 0 && side !== "right" && <div key={flash} className="edge__flash" />}
    </div>
  );
}

/** Seconds per pulse: one per bar, a little faster when tension is high (README 6A). */
export const beatSeconds = (speed = 1, tension = 0) => (2.5 / speed) * (1 - 0.35 * Math.min(1, Math.max(0, tension)));
