// The Spotify-style bar at the bottom: now playing, transport, a scrubber with markers, and the tools on the right.
import React, { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useClock } from "../../state/clock.js";
import { useSettings } from "../../settings/index.js";
import { getCityList } from "../../data/api.js";
import TimeJump from "./TimeJump.jsx";
import { Play, Pause, StepBack, StepNext, LeapBack, LeapNext, Volume, VolumeOff, Calendar, Star } from "./icons.jsx";
import { toIndex, fromIndex, percentAlong, formatDate, stepSeconds, nextSpeed } from "./timeline.js";

const MODES = [["month", "Month"], ["year", "Year"], ["story", "Story"]];
const MODE_TEXT = { month: "Month by month", year: "Year by year", story: "Story mode" };

export default function PlaybackBar({ cityId, range, markers, reduce }) {
  const { year, month, playing, mode, speed, pacing } = useClock(useShallow((s) => ({ year: s.year, month: s.month, playing: s.playing, mode: s.mode, speed: s.speed, pacing: s.pacing })));
  const { toggle, stepMonth, leap, seek, setMode, setSpeed } = useClock.getState();
  const muted = useSettings((s) => s.muted);
  const setMuted = useSettings((s) => s.setMuted);
  const [jumpOpen, setJumpOpen] = useState(false);
  const [dragging, setDragging] = useState(false);

  if (!range) return null;
  const name = getCityList().find((c) => c.id === cityId)?.name ?? "";
  const minIndex = toIndex(range.startYear, 0);
  const maxIndex = toIndex(range.endYear, 11);
  const index = toIndex(year, month);
  const pct = percentAlong(index, minIndex, maxIndex);
  const glide = !reduce && playing && !dragging ? `${stepSeconds({ mode, speed, pacing })}s` : "0s";
  const stars = [...markers.stories, ...markers.badges].filter((m) => m.year >= range.startYear && m.year <= range.endYear).slice(0, 14);
  const onScrub = (e) => { const { year: y, month: m } = fromIndex(Number(e.target.value)); seek(y, m); };

  return (
    <section className="bar" aria-label="Playback">
      <div className="now">
        <div className={`disc${playing && !reduce ? " disc--spin" : ""}`} aria-hidden="true"><i /></div>
        <div className="now__text">
          <strong>{name}</strong>
          <span>{formatDate(year, month)}</span>
          <em>{pacing === "skipping" ? "Skipping quiet months" : MODE_TEXT[mode]}</em>
        </div>
      </div>

      <div className="transport">
        <div className="transport__buttons">
          <button type="button" className="icon-btn" aria-label="Back 5 years" title="Back 5 years" onClick={() => leap(-5)}><LeapBack /></button>
          <button type="button" className="icon-btn" aria-label="Previous month" title="Previous month" onClick={() => stepMonth(-1)}><StepBack /></button>
          <button type="button" className="play" aria-label={playing ? "Pause" : "Play"} onClick={toggle}>{playing ? <Pause /> : <Play />}</button>
          <button type="button" className="icon-btn" aria-label="Next month" title="Next month" onClick={() => stepMonth(1)}><StepNext /></button>
          <button type="button" className="icon-btn" aria-label="Forward 5 years" title="Forward 5 years" onClick={() => leap(5)}><LeapNext /></button>
        </div>
        <div className="scrub-row">
          <span className="scrub__year">{range.startYear}</span>
          <div
            className={`scrub${dragging ? " scrub--drag" : ""}`}
            style={{ "--p": `${pct}%`, "--glide": glide }}
          >
            <div className="scrub__track"><div className="scrub__fill" /></div>
            {stars.map((m, i) => (
              <span key={i} className="scrub__star" title={m.title ?? m.text} style={{ left: `${percentAlong(toIndex(m.year, (m.month ?? 1) - 1), minIndex, maxIndex)}%` }}><Star /></span>
            ))}
            <div className="scrub__thumb" />
            <input
              type="range" className="scrub__input" min={minIndex} max={maxIndex} step={1} value={index}
              aria-label="Time" aria-valuetext={formatDate(year, month)}
              onChange={onScrub} onPointerDown={() => setDragging(true)} onPointerUp={() => setDragging(false)} onBlur={() => setDragging(false)}
            />
          </div>
          <span className="scrub__year">{range.endYear}</span>
        </div>
      </div>

      <div className="tools">
        <div className="seg" role="radiogroup" aria-label="Playback mode">
          {MODES.map(([id, label]) => (
            <button key={id} type="button" role="radio" aria-checked={mode === id} className={mode === id ? "seg--on" : ""} onClick={() => setMode(id)}>{label}</button>
          ))}
        </div>
        <button type="button" className="speed" aria-label={`Speed ${speed} times. Change speed`} onClick={() => setSpeed(nextSpeed(speed))}>{speed}×</button>
        <button type="button" className="icon-btn" aria-label={muted ? "Unmute" : "Mute"} aria-pressed={muted} onClick={() => setMuted(!muted)}>{muted ? <VolumeOff /> : <Volume />}</button>
        <button type="button" className="jump-btn" data-jump-toggle aria-expanded={jumpOpen} onClick={() => setJumpOpen((o) => !o)}><Calendar /> Jump to a time</button>
      </div>

      {jumpOpen && (
        <TimeJump year={year} month={month} range={range} markers={markers} onSeek={seek} onClose={() => setJumpOpen(false)} />
      )}
    </section>
  );
}
