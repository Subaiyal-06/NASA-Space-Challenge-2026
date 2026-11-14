/**
 * BADGE TOAST SLOT
 * Contract props: { badge, reduceMotion }
 * Always states "in our data" per rule.
 */
import React from "react";

const LAYER_ICON = {
  temperature: "🌡️",
  rainfall: "🌧️",
  drought: "🏜️",
  air: "🌫️",
  earthquakes: "🌋",
  quakes: "🌋",
};

export default function BadgeToast({ badge = null, reduceMotion = false }) {
  if (!badge) return null;

  const icon = LAYER_ICON[badge.layer] ?? "⭐";
  const text = badge.text?.includes("in our data") ? badge.text : `${badge.text} (in our data)`;

  return (
    <div
      role="status"
      aria-live="polite"
      className={reduceMotion ? "" : "record-badge"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "7px 14px",
        borderRadius: "9999px",
        background: "linear-gradient(135deg, rgba(250, 204, 21, 0.22), rgba(251, 146, 60, 0.22))",
        border: "1px solid rgba(250, 204, 21, 0.55)",
        color: "#ffffff",
        fontSize: "12.5px",
        fontWeight: 600,
        boxShadow: "0 0 14px rgba(250, 204, 21, 0.25)",
      }}
    >
      <span>⭐</span>
      <span>{icon}</span>
      <span>{text}</span>
    </div>
  );
}
