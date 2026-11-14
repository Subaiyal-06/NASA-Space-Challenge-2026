/**
 * STORY CARD SLOT
 * Contract props: { story, onClose, reduceMotion }
 */
import React from "react";

const TYPE_ICON = {
  earthquake: "🌋",
  flood: "🌊",
  heat: "🔥",
  drought: "🏜️",
  air: "🌫️",
};

const TYPE_BG = {
  earthquake: "rgba(245, 158, 11, 0.18)",
  flood: "rgba(59, 130, 246, 0.18)",
  heat: "rgba(239, 68, 68, 0.18)",
  drought: "rgba(217, 119, 6, 0.18)",
  air: "rgba(107, 114, 128, 0.18)",
};

export default function StoryCard({ story = null, onClose, reduceMotion = false }) {
  if (!story) return null;

  const icon = TYPE_ICON[story.type] ?? "📌";
  const bg = TYPE_BG[story.type] ?? "rgba(14, 165, 233, 0.16)";

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={reduceMotion ? "" : "fade-in"}
      style={{
        background: bg,
        border: "1px solid rgba(255,255,255,0.22)",
        borderRadius: "12px",
        padding: "12px 16px",
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
      }}
    >
      <span style={{ fontSize: "24px", lineHeight: 1 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
          <h3 style={{ margin: 0, fontSize: "14.5px", fontWeight: 700, color: "#ffffff" }}>
            {story.title} <span style={{ fontSize: "12px", color: "#93c5fd", fontWeight: 500 }}>({story.year})</span>
          </h3>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close story card"
              style={{
                background: "transparent",
                border: "none",
                color: "#bae6fd",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              ✕
            </button>
          )}
        </div>
        <p style={{ margin: "6px 0", fontSize: "12.5px", color: "#e0f2fe", lineHeight: 1.5 }}>
          {story.summary || story.text}
        </p>
        {story.source && (
          <div style={{ fontSize: "11px", color: "#7dd3fc", opacity: 0.85 }}>
            Source: {story.source}
          </div>
        )}
      </div>
    </div>
  );
}
