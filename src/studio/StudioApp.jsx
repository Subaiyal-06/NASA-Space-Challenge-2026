// Earth Jukebox: Pakistan, the studio UI. Calm and spacious: a globe, one big button, then the cities.
import React, { useEffect, useMemo, useState } from "react";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/figtree";
import "@fontsource/spline-sans-mono/400.css";
import "./theme.css";
import "./ui/ui.css";
import "./weather/weather.css";
import GlobeStage from "./GlobeStage.jsx";
import PlaybackBar from "./ui/PlaybackBar.jsx";
import CategoryRail from "./ui/CategoryRail.jsx";
import Visualizer from "./ui/Visualizer.jsx";
import RightNow from "./ui/RightNow.jsx";
import HistoryChart from "./ui/HistoryChart.jsx";
import BadgeToast from "./ui/BadgeToast.jsx";
import WeatherLayer from "./weather/WeatherLayer.jsx";
import EdgeGlow, { beatSeconds } from "./weather/EdgeGlow.jsx";
import { weatherFor } from "./weather/rules.js";
import { useFx } from "./weather/fx.js";
import { useCity } from "./ui/useCity.js";
import { useStudio, useMotion } from "./state.js";
import { useClock } from "../state/clock.js";
import { initAppBridge, getAudioEngine } from "../app/flow.js";
import { attachKeyboardShortcuts } from "../app/keyboard.js";
import { getCityList, getSnapshot } from "../data/api.js";
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

  // ---- weather: what the data says about this month, shown on the disc and at the screen edges ----
  const [map, setMap] = useState(null);
  const [discUp, setDiscUp] = useState(false);
  const year = useClock((s) => s.year);
  const month = useClock((s) => s.month);
  const layers = useClock((s) => s.layers);
  const speed = useClock((s) => s.speed);
  const tension = useClock((s) => s.tension);
  const showGreenery = useStudio((s) => s.extras.vegetation) !== false;
  const cityMeta = useMemo(() => cities.find((c) => c.id === selectedId) ?? null, [selectedId]);
  const snapshot = useMemo(() => (city ? getSnapshot(city, year, month, futureEnabled ? scenario : undefined) : null), [city, year, month, futureEnabled, scenario]);
  const wx = useMemo(() => (snapshot ? weatherFor(snapshot, { city, enabled: layers, showGreenery }) : weatherFor(null)), [snapshot, city, layers, showGreenery]);
  const [historyOpen, setHistoryOpen] = useState(false);
  useEffect(() => { if (!selectedId) setHistoryOpen(false); }, [selectedId]);

  // An earthquake month: cracks on the disc and a short shake of the picture (not when motion is reduced)
  const quakeCount = useFx((s) => s.quake);
  const quakeMagnitude = useFx((s) => s.quakeMagnitude);
  const hasQuake = !!wx.quake;
  useEffect(() => { if (discUp && hasQuake) useFx.getState().quakeNow(wx.quake.magnitude); }, [discUp, selectedId, year, month, hasQuake]); // eslint-disable-line react-hooks/exhaustive-deps
  const [shaking, setShaking] = useState(false);
  useEffect(() => {
    if (!quakeCount || reduce) return undefined;
    setShaking(true);
    const t = setTimeout(() => setShaking(false), 650);
    return () => clearTimeout(t);
  }, [quakeCount, reduce]);

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
      <div className={`stage-wrap${shaking ? " is-shaking" : ""}`} style={{ "--amp": `${Math.min(7, 2 + (quakeMagnitude - 5) * 1.6)}px` }}>
        <GlobeStage phase={phase} cities={cities} selectedId={selectedId} onSelect={select} onArrived={arrived} reduceMotion={reduce} onReady={setMap} onDisc={setDiscUp} padBottom={historyOpen ? 120 : 0} />
      </div>

      {selectedId && city && <EdgeGlow glow={wx.glow} beatSeconds={beatSeconds(speed, tension)} reduce={reduce} />}
      {selectedId && city && discUp && <WeatherLayer map={map} city={cityMeta} wx={wx} reduce={reduce} />}

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
      {selectedId && city && !historyOpen && <RightNow wx={wx} snapshot={snapshot} city={city} enabled={layers} showGreenery={showGreenery} />}
      {selectedId && city && !historyOpen && <button type="button" className="hist-toggle" onClick={() => setHistoryOpen(true)}>History</button>}
      {selectedId && city && historyOpen && <HistoryChart city={city} enabled={layers} range={range} onClose={() => setHistoryOpen(false)} />}
      {selectedId && city && <BadgeToast />}
      {selectedId && city && <PlaybackBar cityId={selectedId} range={range} markers={markers} reduce={reduce} />}

      <p className="credit">{IMAGERY_CREDIT}</p>
    </div>
  );
}
