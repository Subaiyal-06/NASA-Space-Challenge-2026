// Earth Jukebox: Pakistan, the studio UI. Calm and spacious: a globe, one big button, then the cities.
import React, { useEffect } from "react";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/figtree";
import "@fontsource/spline-sans-mono/400.css";
import "./theme.css";
import "./ui/ui.css";
import GlobeStage from "./GlobeStage.jsx";
import PlaybackBar from "./ui/PlaybackBar.jsx";
import CategoryRail from "./ui/CategoryRail.jsx";
import Visualizer from "./ui/Visualizer.jsx";
import { useCity } from "./ui/useCity.js";
import { useStudio, useMotion } from "./state.js";
import { useClock } from "../state/clock.js";
import { initAppBridge, getAudioEngine } from "../app/flow.js";
import { attachKeyboardShortcuts } from "../app/keyboard.js";
import { getCityList } from "../data/api.js";
import { IMAGERY_CREDIT } from "./geo/mapStyle.js";

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
  const { reduce, osAsksForLess, motion, setMotion } = useMotion();
  const scenario = useClock((s) => s.scenario);
  const futureEnabled = useClock((s) => s.futureEnabled);
  const { city, range, markers } = useCity(selectedId, { scenario, futureEnabled });
  const introVisible = phase === "intro" || phase === "zooming";

  // The Start click is the user action that lets sound begin: a soft drone plays while Pakistan comes into view
  const onStart = () => { Promise.resolve(getAudioEngine().start()).catch(() => {}); start(); };

  // Keep the music, charts and weather in step with the clock, and enable the keyboard shortcuts
  useEffect(() => {
    if (import.meta.env.DEV) { window.__audio = getAudioEngine(); window.__clock = useClock; } // for testing only
    const detachBridge = initAppBridge();
    const detachKeys = attachKeyboardShortcuts();
    return () => { detachBridge(); detachKeys(); };
  }, []);

  // Leaving a city (or going back to the start) pauses playback
  useEffect(() => { if (!selectedId) useClock.getState().pause(); }, [selectedId]);

  // Space on a focused button should press that button, not also start playback
  const onKeyDown = (e) => { if ((e.code === "Space" || e.key === " ") && e.target.tagName === "BUTTON") e.stopPropagation(); };

  return (
    <div className={`studio${reduce ? " studio--calm" : ""}${selectedId && city ? " studio--bar" : ""}`} data-phase={phase} onKeyDown={onKeyDown}>
      <GlobeStage phase={phase} cities={cities} selectedId={selectedId} onSelect={select} onArrived={arrived} reduceMotion={reduce} />

      <header className="brand">
        <Vinyl />
        <div>
          <strong>Earth Jukebox</strong>
          <span>Pakistan</span>
        </div>
      </header>

      <button type="button" role="switch" aria-checked={!reduce} className="motion-toggle" onClick={() => setMotion(reduce ? "on" : "reduced")}>
        <span className="motion-toggle__knob" aria-hidden="true" />
        Animations {reduce ? "off" : "on"}
      </button>

      {introVisible && (
        <div className={`intro${phase === "zooming" ? " intro--leaving" : ""}`} aria-hidden={phase === "zooming"}>
          <button type="button" className="cta" onClick={onStart} tabIndex={phase === "zooming" ? -1 : 0}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" fill="currentColor" /></svg>
            Start listening
          </button>
          <p>Hear Pakistan&rsquo;s climate, month by month.</p>
        </div>
      )}

      {phase === "intro" && ((osAsksForLess && motion === "auto") || motion === "reduced") && (
        <p className="motion-note">
          {motion === "auto" ? "Animations are off because your computer asks for less motion. " : "Animations are off. "}
          <button type="button" className="linklike" onClick={() => setMotion("on")}>Turn animations on</button>
        </p>
      )}

      {phase === "explore" && !selectedId && <p className="hint">Pick a city to begin</p>}
      {selectedId && (
        <button type="button" className="back" onClick={clear}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          All of Pakistan
        </button>
      )}

      {phase === "explore" && <Visualizer reduce={reduce} />}
      {selectedId && city && <CategoryRail city={city} />}
      {selectedId && city && <PlaybackBar cityId={selectedId} range={range} markers={markers} reduce={reduce} />}

      <p className="credit">{IMAGERY_CREDIT}</p>
    </div>
  );
}
