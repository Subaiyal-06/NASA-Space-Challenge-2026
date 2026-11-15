/**
 * STORY CARD SLOT
 * Pastel Mint & White 3D alert card with Framer Motion + Lucide icons.
 * Contract props: { story, onClose, reduceMotion }
 */
import React from "react";
import { motion } from "framer-motion";
import { Activity, Bookmark, Droplets, Flame, Waves, Wind, X } from "lucide-react";

const TYPE_META = {
  earthquake: { Icon: Activity, color: "#B45309", bg: "#FEF3C7", border: "#FDE68A" },
  flood: { Icon: Waves, color: "#0369A1", bg: "#E0F2FE", border: "#BAE6FD" },
  heat: { Icon: Flame, color: "#C2410C", bg: "#FFEDD5", border: "#FDBA74" },
  drought: { Icon: Droplets, color: "#92400E", bg: "#FEF3C7", border: "#FCD34D" },
  air: { Icon: Wind, color: "#475569", bg: "#F1F5F9", border: "#CBD5E1" },
};

export default function StoryCard({ story = null, onClose, reduceMotion = false }) {
  if (!story) return null;

  const meta = TYPE_META[story.type] ?? {
    Icon: Bookmark,
    color: "#059669",
    bg: "#ECFDF5",
    border: "#A7F3D0",
  };
  const IconComponent = meta.Icon;

  return (
    <motion.div
      role="alert"
      aria-live="assertive"
      initial={reduceMotion ? false : { opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: reduceMotion ? 0 : 0.3 }}
      className="ej-card-3d"
      style={{
        background: meta.bg,
        border: `1.5px solid ${meta.border}`,
        padding: "13px 16px",
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
      }}
    >
      <div
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "10px",
          background: "#FFFFFF",
          border: `1px solid ${meta.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <IconComponent size={18} color={meta.color} />
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
          <h3 style={{ margin: 0, fontSize: "14.5px", fontWeight: 700, color: "#064E3B" }}>
            {story.title} <span style={{ fontSize: "12px", color: "#475569", fontWeight: 600 }}>({story.year})</span>
          </h3>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close story card"
              style={{
                background: "#FFFFFF",
                border: `1px solid ${meta.border}`,
                borderRadius: "8px",
                width: "26px",
                height: "26px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#064E3B",
                cursor: "pointer",
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
        <p style={{ margin: "6px 0", fontSize: "12.5px", color: "#1E293B", lineHeight: 1.5 }}>
          {story.summary || story.text}
        </p>
        {story.source && (
          <div style={{ fontSize: "11px", color: "#475569", fontWeight: 600 }}>Source: {story.source}</div>
        )}
      </div>
    </motion.div>
  );
}
