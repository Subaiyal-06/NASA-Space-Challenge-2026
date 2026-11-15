// Earth Jukebox: Pakistan, the studio UI. Calm and spacious: a globe, one big button, then the cities.
import React from "react";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/figtree";
import "@fontsource/spline-sans-mono/400.css";
import "./theme.css";
import GlobeStage from "./GlobeStage.jsx";
import { useStudio } from "./state.js";
import { useSettings } from "../settings/index.js";
import { getCityList } from "../data/api.js";

const cities = getCityList();

function Vinyl() {
  return (
    <svg className="brand__mark" viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="18" fill="none" stroke="#EEF1FF" strokeWidth="2" />
      <circle cx="20" cy="20" r="11" fill="none" stroke="#EEF1FF" strokeOpacity=".45" strokeWidth="1.5" />
      <circle cx="20" cy="20" r="4.5" fill="#FF4B4B" />
    </svg>
  );
}

export default function StudioApp() {
  const { phase, selectedId, start, arrived, select, clear } = useStudio();
  const reduceMotion = useSettings((s) => s.reduceMotion);

  return (
    <div className={`studio${reduceMotion ? " studio--calm" : ""}`} data-phase={phase}>
      <GlobeStage phase={phase} cities={cities} selectedId={selectedId} onSelect={select} onArrived={arrived} reduceMotion={reduceMotion} />

      <header className="brand">
        <Vinyl />
        <div>
          <strong>Earth Jukebox</strong>
          <span>Pakistan</span>
        </div>
      </header>

      {phase === "intro" && (
        <div className="intro">
          <button type="button" className="cta" onClick={start}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" fill="currentColor" /></svg>
            Start listening
          </button>
          <p>Hear Pakistan&rsquo;s climate, month by month.</p>
        </div>
      )}

      {phase === "explore" && !selectedId && <p className="hint">Pick a city to begin</p>}
      {selectedId && (
        <button type="button" className="back" onClick={clear}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          All of Pakistan
        </button>
      )}
    </div>
  );
}
