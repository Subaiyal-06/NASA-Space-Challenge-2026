/**
 * TIMELINE SLOT
 * Pastel Mint & White minimal 3D transport bar with Framer Motion + Lucide icons.
 * Contract props:
 *   { year, month, startYear, endYear, mode, playing, speed, pacing, markers,
 *     onToggle, onStep, onSeek, onLeap, onModeChange, onSpeedChange, reduceMotion }
 */
import React, { useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Calendar,
  CalendarRange,
  FastForward,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
} from "lucide-react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const SPEEDS = [1, 2, 4];
const MARKER_COLORS = {
  earthquake: "#D97706",
  flood: "#0284C7",
  heat: "#EA580C",
  air: "#64748B",
  drought: "#B45309",
};

const MODE_OPTIONS = [
  { id: "month", label: "Month", Icon: Calendar },
  { id: "year", label: "Year", Icon: CalendarRange },
  { id: "story", label: "Story", Icon: BookOpen },
];

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

  const tickYears = [];
  const span = safeEnd - safeStart;
  const stepY = span > 60 ? 10 : 5;
  for (let y = Math.ceil(safeStart / stepY) * stepY; y <= safeEnd; y += stepY) {
    tickYears.push(y);
  }
  if (!tickYears.includes(safeStart)) tickYears.unshift(safeStart);
  if (!tickYears.includes(safeEnd)) tickYears.push(safeEnd);

  const storyDots = (markers?.stories ?? [])
    .filter((s) => s.year >= safeStart && s.year <= safeEnd)
    .map((s, idx) => {
      const mIdx = (s.year - safeStart) * 12 + ((s.month ?? 1) - 1);
      const frac = Math.max(0, Math.min(1, mIdx / Math.max(1, totalMonths - 1)));
      return {
        id: s.id || `${s.year}-${s.month}-${idx}`,
        frac,
        title: `${s.title} (${s.year})`,
        color: MARKER_COLORS[s.type] ?? "#059669",
      };
    });

  return (
    <motion.div
      role="region"
      aria-label="Timeline player"
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.3 }}
      className="ej-card-3d"
      style={{
        padding: "16px 18px",
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
          marginBottom: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              padding: "5px 13px",
              borderRadius: "9999px",
              background: "#ECFDF5",
              border: "1px solid #A7F3D0",
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "14px",
              fontWeight: 700,
              color: "#064E3B",
            }}
          >
            {MONTHS[month] ?? "Jan"} {year}
          </span>

          {pacing === "skipping" && (
            <motion.span
              role="status"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "4px 10px",
                borderRadius: "9999px",
                fontSize: "11.5px",
                fontWeight: 600,
                background: "#D1FAE5",
                border: "1px solid #6EE7B7",
                color: "#065F46",
              }}
            >
              <FastForward size={13} />
              Skipping quiet stretch...
            </motion.span>
          )}
        </div>

        {/* Mode & Speed buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "11.5px", color: "var(--ej-fg-muted, #475569)", fontWeight: 600, marginRight: "2px" }}>
            Mode
          </span>
          {MODE_OPTIONS.map(({ id, label, Icon }) => {
            const active = mode === id;
            return (
              <motion.button
                key={id}
                type="button"
                whileHover={reduceMotion ? undefined : { y: -1 }}
                whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                onClick={() => onModeChange?.(id)}
                aria-pressed={active}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "5px 11px",
                  borderRadius: "9999px",
                  fontSize: "12px",
                  fontWeight: active ? 700 : 600,
                  color: active ? "#FFFFFF" : "#065F46",
                  background: active ? "linear-gradient(135deg, #10B981, #059669)" : "#F0FDF4",
                  border: `1px solid ${active ? "#059669" : "#BCEAD5"}`,
                  boxShadow: active ? "0 3px 10px rgba(5, 150, 105, 0.25)" : "none",
                  cursor: "pointer",
                }}
              >
                <Icon size={13} />
                {label}
              </motion.button>
            );
          })}

          <span style={{ fontSize: "11.5px", color: "var(--ej-fg-muted, #475569)", fontWeight: 600, marginLeft: "8px" }}>
            Speed
          </span>
          {SPEEDS.map((s) => {
            const active = speed === s;
            return (
              <motion.button
                key={s}
                type="button"
                whileTap={reduceMotion ? undefined : { scale: 0.94 }}
                onClick={() => onSpeedChange?.(s)}
                aria-pressed={active}
                style={{
                  padding: "4px 9px",
                  borderRadius: "8px",
                  fontSize: "11.5px",
                  fontWeight: active ? 700 : 600,
                  color: active ? "#FFFFFF" : "#065F46",
                  background: active ? "#059669" : "#F0FDF4",
                  border: `1px solid ${active ? "#059669" : "#BCEAD5"}`,
                  cursor: "pointer",
                }}
              >
                {s}x
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Scrubber Bar */}
      <div style={{ position: "relative", marginBottom: "12px" }}>
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
            background: "#D1FAE5",
            border: "1px solid #A7F3D0",
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
              background: "linear-gradient(90deg, #34D399, #059669)",
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
                border: "1.5px solid #FFFFFF",
                boxShadow: "0 1px 4px rgba(6, 78, 59, 0.25)",
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
              width: "18px",
              height: "18px",
              borderRadius: "50%",
              border: "2.5px solid #FFFFFF",
              background: "#059669",
              transform: "translate(-50%, -50%)",
              boxShadow: "0 2px 10px rgba(5, 150, 105, 0.45)",
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
            fontWeight: 600,
            color: "#475569",
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", flexWrap: "wrap" }}>
        <TransportBtn onClick={() => onSeek?.(safeStart, 0)} label="Replay from start" small reduceMotion={reduceMotion}>
          <RotateCcw size={13} />
          <span>Start</span>
        </TransportBtn>
        <TransportBtn onClick={() => onLeap?.(-10)} label="Jump back 10 years" small reduceMotion={reduceMotion}>
          -10y
        </TransportBtn>
        <TransportBtn onClick={() => onLeap?.(-5)} label="Jump back 5 years" small reduceMotion={reduceMotion}>
          -5y
        </TransportBtn>
        <TransportBtn onClick={() => onStep?.(-1)} label="Step back one month" reduceMotion={reduceMotion}>
          <SkipBack size={15} />
        </TransportBtn>

        {/* Play / Pause */}
        <motion.button
          type="button"
          whileHover={reduceMotion ? undefined : { scale: 1.06 }}
          whileTap={reduceMotion ? undefined : { scale: 0.94 }}
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
            color: "#FFFFFF",
            border: "2px solid #FFFFFF",
            cursor: "pointer",
            background: playing
              ? "linear-gradient(135deg, #F97316, #EA580C)"
              : "linear-gradient(135deg, #10B981, #059669)",
            boxShadow: playing
              ? "0 8px 20px rgba(234, 88, 12, 0.35)"
              : "0 8px 20px rgba(5, 150, 105, 0.35)",
          }}
        >
          {playing ? <Pause size={20} fill="#FFFFFF" /> : <Play size={20} fill="#FFFFFF" style={{ marginLeft: "2px" }} />}
        </motion.button>

        <TransportBtn onClick={() => onStep?.(1)} label="Step forward one month" reduceMotion={reduceMotion}>
          <SkipForward size={15} />
        </TransportBtn>
        <TransportBtn onClick={() => onLeap?.(5)} label="Jump forward 5 years" small reduceMotion={reduceMotion}>
          +5y
        </TransportBtn>
        <TransportBtn onClick={() => onLeap?.(10)} label="Jump forward 10 years" small reduceMotion={reduceMotion}>
          +10y
        </TransportBtn>
      </div>
    </motion.div>
  );
}

function TransportBtn({ onClick, label, children, small = false, reduceMotion = false }) {
  return (
    <motion.button
      type="button"
      whileHover={reduceMotion ? undefined : { y: -1 }}
      whileTap={reduceMotion ? undefined : { scale: 0.95 }}
      onClick={onClick}
      aria-label={label}
      title={label}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: small ? "6px 10px" : "7px 12px",
        fontSize: small ? "11.5px" : "13px",
        fontWeight: 600,
        borderRadius: "10px",
        background: "#F0FDF4",
        border: "1px solid #BCEAD5",
        color: "#064E3B",
        cursor: "pointer",
      }}
    >
      {children}
    </motion.button>
  );
}
