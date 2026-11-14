/**
 * TIMELINE SLOT
 * Contract props:
 *   { year, month, startYear, endYear, mode, playing, speed, pacing, markers,
 *     onToggle, onStep, onSeek, onLeap, onModeChange, onSpeedChange, reduceMotion }
 */
import React, { useCallback, useRef } from "react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const SPEEDS = [1, 2, 4];
const MARKER_COLORS = {
  earthquake: "#f59e0b",
  flood: "#3b82f6",
  heat: "#ef4444",
  air: "#a3a3a3",
  drought: "#d97706",
};

export default function Timeline({
  year = 1981,
  month = 0,
  startYear = 1981,
  endYear = 2024,
  mode = "month",
  playing = false,
  speed = 1,
  pacing = "normal",
  markers = { stories: [], badges: [] },
  onToggle,
  onStep,
  onSeek,
  onLeap,
  onModeChange,
  onSpeedChange,
  reduceMotion = false,
}) {
  const scrubberRef = useRef(null);

  const safeStart = Number.isFinite(startYear) ? startYear : 1981;
  const safeEnd = Number.isFinite(endYear) && endYear >= safeStart ? endYear : 2024;
  const totalMonths = Math.max(1, (safeEnd - safeStart + 1) * 12);
  const currentIndex = Math.max(0, Math.min(totalMonths - 1, (year - safeStart) * 12 + month));
  const progress = totalMonths > 1 ? currentIndex / (totalMonths - 1) : 0;

  const handleScrubberClick = useCallback(
    (e) => {
      const rect = scrubberRef.current?.getBoundingClientRect();
      if (!rect || !rect.width) return;
      const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const idx = Math.round(frac * (totalMonths - 1));
      const targetYear = safeStart + Math.floor(idx / 12);
      const targetMonth = idx % 12;
      onSeek?.(targetYear, targetMonth);
    },
    [safeStart, totalMonths, onSeek]
  );

  // Build tick years along the scrubber
  const tickYears = [];
  const span = safeEnd - safeStart;
  const stepY = span > 60 ? 10 : span > 30 ? 5 : 5;
  for (let y = Math.ceil(safeStart / stepY) * stepY; y <= safeEnd; y += stepY) {
    tickYears.push(y);
  }
  if (!tickYears.includes(safeStart)) tickYears.unshift(safeStart);
  if (!tickYears.includes(safeEnd)) tickYears.push(safeEnd);

  // Filter stories to valid range (connector already filters by city via getMarkers)
  const storyDots = (markers?.stories ?? [])
    .filter((s) => s.year >= safeStart && s.year <= safeEnd)
    .map((s, idx) => {
      const mIdx = (s.year - safeStart) * 12 + ((s.month ?? 1) - 1);
      const frac = Math.max(0, Math.min(1, mIdx / Math.max(1, totalMonths - 1)));
      return {
        id: s.id || `${s.year}-${s.month}-${idx}`,
        frac,
        title: `${s.title} (${s.year})`,
        color: MARKER_COLORS[s.type] ?? "#facc15",
      };
    });

  return (
    <div
      role="region"
      aria-label="Timeline player"
      style={{
        background: "var(--ej-card-bg, rgba(13, 27, 42, 0.85))",
        border: "1px solid var(--ej-border, rgba(255,255,255,0.1))",
        borderRadius: "12px",
        padding: "14px 18px",
      }}
    >
      {/* Top Row: Current Date, Mode Switcher, Speed & Smart Pacing Indicator */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
          marginBottom: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              padding: "4px 12px",
              borderRadius: "9999px",
              background: "rgba(14, 165, 233, 0.18)",
              border: "1px solid rgba(14, 165, 233, 0.4)",
              fontFamily: "monospace",
              fontSize: "14px",
              fontWeight: 700,
              color: "var(--ej-fg, #e0f2fe)",
            }}
          >
            {MONTHS[month] ?? "Jan"} {year}
          </span>

          {pacing === "skipping" && (
            <span
              role="status"
              style={{
                padding: "3px 10px",
                borderRadius: "9999px",
                fontSize: "11.5px",
                background: "rgba(139, 92, 246, 0.22)",
                border: "1px solid rgba(139, 92, 246, 0.45)",
                color: "#ddd6fe",
              }}
            >
              ⏩ Skipping quiet stretch…
            </span>
          )}
        </div>

        {/* Mode buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "11.5px", color: "#93c5fd", marginRight: "2px" }}>Mode:</span>
          {[
            { id: "month", label: "📅 Month" },
            { id: "year", label: "📆 Year" },
            { id: "story", label: "📖 Story" },
          ].map((m) => {
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onModeChange?.(m.id)}
                aria-pressed={active}
                style={{
                  padding: "4px 11px",
                  borderRadius: "9999px",
                  fontSize: "12px",
                  fontWeight: active ? 700 : 500,
                  color: active ? "#ffffff" : "#93c5fd",
                  background: active ? "rgba(14, 165, 233, 0.4)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${active ? "rgba(14,165,233,0.7)" : "rgba(255,255,255,0.12)"}`,
                  cursor: "pointer",
                }}
              >
                {m.label}
              </button>
            );
          })}

          {/* Speed buttons */}
          <span style={{ fontSize: "11.5px", color: "#93c5fd", marginLeft: "8px" }}>Speed:</span>
          {SPEEDS.map((s) => {
            const active = speed === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => onSpeedChange?.(s)}
                aria-pressed={active}
                style={{
                  padding: "3px 8px",
                  borderRadius: "6px",
                  fontSize: "11.5px",
                  fontWeight: active ? 700 : 500,
                  color: active ? "#ffffff" : "#93c5fd",
                  background: active ? "rgba(59, 130, 246, 0.4)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${active ? "rgba(59,130,246,0.7)" : "rgba(255,255,255,0.1)"}`,
                  cursor: "pointer",
                }}
              >
                {s}x
              </button>
            );
          })}
        </div>
      </div>

      {/* Scrubber Bar */}
      <div style={{ position: "relative", marginBottom: "10px" }}>
        <div
          ref={scrubberRef}
          onClick={handleScrubberClick}
          role="slider"
          aria-label="Timeline scrubber"
          aria-valuemin={0}
          aria-valuemax={totalMonths - 1}
          aria-valuenow={currentIndex}
          aria-valuetext={`${MONTHS[month]} ${year}`}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") {
              e.preventDefault();
              onStep?.(1);
            } else if (e.key === "ArrowLeft") {
              e.preventDefault();
              onStep?.(-1);
            }
          }}
          style={{
            position: "relative",
            height: "10px",
            borderRadius: "9999px",
            background: "rgba(255,255,255,0.12)",
            cursor: "pointer",
          }}
        >
          {/* Progress Fill */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              height: "100%",
              width: `${progress * 100}%`,
              borderRadius: "9999px",
              background: "linear-gradient(90deg, #0ea5e9, #818cf8)",
              transition: reduceMotion ? "none" : "width 0.2s ease",
            }}
          />

          {/* Story Dots */}
          {storyDots.map((dot) => (
            <div
              key={dot.id}
              title={dot.title}
              style={{
                position: "absolute",
                top: "50%",
                left: `${dot.frac * 100}%`,
                width: "9px",
                height: "9px",
                borderRadius: "50%",
                transform: "translate(-50%, -50%)",
                background: dot.color,
                boxShadow: `0 0 6px ${dot.color}`,
                zIndex: 2,
              }}
            />
          ))}

          {/* Thumb */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: `${progress * 100}%`,
              width: "16px",
              height: "16px",
              borderRadius: "50%",
              border: "2px solid #ffffff",
              background: "#0ea5e9",
              transform: "translate(-50%, -50%)",
              boxShadow: "0 0 10px rgba(14,165,233,0.9)",
              zIndex: 3,
            }}
          />
        </div>

        {/* Year Labels */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "6px",
            fontSize: "11px",
            color: "#60a5fa",
            opacity: 0.75,
            userSelect: "none",
          }}
        >
          {tickYears.map((y) => (
            <span
              key={y}
              onClick={() => onSeek?.(y, 0)}
              style={{ cursor: "pointer" }}
              title={`Jump to Jan ${y}`}
            >
              {y}
            </span>
          ))}
        </div>
      </div>

      {/* Transport Controls */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
        <TransportBtn onClick={() => onSeek?.(safeStart, 0)} label="Replay from start" small>
          ⟳ Start
        </TransportBtn>
        <TransportBtn onClick={() => onLeap?.(-10)} label="Jump back 10 years" small>
          -10y
        </TransportBtn>
        <TransportBtn onClick={() => onLeap?.(-5)} label="Jump back 5 years" small>
          -5y
        </TransportBtn>
        <TransportBtn onClick={() => onStep?.(-1)} label="Step back one month">
          ⏮
        </TransportBtn>

        {/* Play / Pause */}
        <button
          type="button"
          onClick={() => onToggle?.()}
          aria-label={playing ? "Pause" : "Play"}
          aria-pressed={playing}
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
            color: "#ffffff",
            border: "none",
            cursor: "pointer",
            background: playing
              ? "linear-gradient(135deg, #ef4444, #dc2626)"
              : "linear-gradient(135deg, #0ea5e9, #2563eb)",
            boxShadow: `0 0 22px ${playing ? "rgba(239,68,68,0.5)" : "rgba(14,165,233,0.5)"}`,
          }}
        >
          {playing ? "⏸" : "▶"}
        </button>

        <TransportBtn onClick={() => onStep?.(1)} label="Step forward one month">
          ⏭
        </TransportBtn>
        <TransportBtn onClick={() => onLeap?.(5)} label="Jump forward 5 years" small>
          +5y
        </TransportBtn>
        <TransportBtn onClick={() => onLeap?.(10)} label="Jump forward 10 years" small>
          +10y
        </TransportBtn>
      </div>
    </div>
  );
}

function TransportBtn({ onClick, label, children, small = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      style={{
        padding: small ? "5px 10px" : "6px 12px",
        fontSize: small ? "11.5px" : "14px",
        borderRadius: "8px",
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.12)",
        color: "var(--ej-fg, #bae6fd)",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}
