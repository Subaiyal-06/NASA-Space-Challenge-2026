// APP COMPOSITION (Step C8 & C9: Intro -> Player -> Compare flow, Keyboard, Settings & All 11 Slot Connectors)
import React, { useEffect } from "react";
import { useClock } from "./state/clock.js";
import { useSettings } from "./settings/index.js";
import { useAppFlow, initAppBridge } from "./app/flow.js";
import { attachKeyboardShortcuts } from "./app/keyboard.js";
import { getCityList, loadCity } from "./data/api.js";
import {
  GlobeIntroConnector,
  TimelineConnector,
  WeatherLayerConnector,
  AmbientGlowConnector,
  ChartsConnector,
  TensionMeterConnector,
  LayerTogglesConnector,
  StoryCardConnector,
  BadgeToastConnector,
  CompareViewConnector,
  LegendConnector,
} from "./app/connectors.jsx";

export default function App() {
  const screen = useAppFlow((s) => s.screen);
  const setScreen = useAppFlow((s) => s.setScreen);
  const openCompare = useAppFlow((s) => s.openCompare);
  const closeCompare = useAppFlow((s) => s.closeCompare);

  const cityA = useClock((s) => s.cityA);
  const cityB = useClock((s) => s.cityB);
  const selectCity = useClock((s) => s.selectCity);

  const {
    reduceMotion,
    setReduceMotion,
    showGhostAlways,
    setShowGhostAlways,
    voiceAnnouncer,
    setVoiceAnnouncer,
    muted,
    setMuted,
  } = useSettings();

  const cities = getCityList();

  useEffect(() => {
    loadCity("karachi").catch(() => {});
    const detachBridge = initAppBridge();
    const detachKeys = attachKeyboardShortcuts();
    return () => {
      detachBridge();
      detachKeys();
    };
  }, []);

  return (
    <div data-testid="app-root" data-screen={screen} style={{ padding: 12, fontFamily: "sans-serif" }}>
      {/* Navigation & Accessibility Top Bar */}
      <header style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <strong>Earth Jukebox: Pakistan</strong>
        <nav aria-label="Screen navigation" style={{ display: "flex", gap: 6 }}>
          <button type="button" onClick={() => setScreen("intro")} aria-pressed={screen === "intro"}>
            Intro
          </button>
          <button type="button" onClick={() => closeCompare()} aria-pressed={screen === "player"}>
            Player
          </button>
          <button
            type="button"
            onClick={() => openCompare(cityB || (cityA === "karachi" ? "lahore" : "karachi"))}
            aria-pressed={screen === "compare"}
          >
            Compare
          </button>
        </nav>

        {/* City Selector */}
        <label style={{ marginLeft: 8 }}>
          City A:{" "}
          <select value={cityA} onChange={(e) => selectCity(e.target.value, "A")}>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        {screen === "compare" && (
          <label>
            City B:{" "}
            <select value={cityB ?? "lahore"} onChange={(e) => selectCity(e.target.value, "B")}>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {/* Accessibility & Feature Toggles */}
        <div style={{ marginLeft: "auto", display: "flex", gap: 10, fontSize: 12 }}>
          <label>
            <input
              type="checkbox"
              checked={reduceMotion}
              onChange={(e) => setReduceMotion(e.target.checked)}
            />{" "}
            Reduce motion
          </label>
          <label>
            <input
              type="checkbox"
              checked={showGhostAlways}
              onChange={(e) => setShowGhostAlways(e.target.checked)}
            />{" "}
            Show the 1980s
          </label>
          <label>
            <input
              type="checkbox"
              checked={voiceAnnouncer}
              onChange={(e) => setVoiceAnnouncer(e.target.checked)}
            />{" "}
            Voice announcer
          </label>
          <label>
            <input
              type="checkbox"
              checked={muted}
              onChange={(e) => setMuted(e.target.checked)}
            />{" "}
            Mute
          </label>
        </div>
      </header>

      {/* Screen 1: Intro Globe */}
      {screen === "intro" && (
        <section data-testid="screen-intro">
          <GlobeIntroConnector />
        </section>
      )}

      {/* Screen 2: Main Player */}
      {screen === "player" && (
        <section data-testid="screen-player" style={{ display: "grid", gap: 8 }}>
          <AmbientGlowConnector side="both" />
          <WeatherLayerConnector citySlot="A" selected={true} />
          <TensionMeterConnector />
          <ChartsConnector />
          <LayerTogglesConnector />
          <LegendConnector />
          <StoryCardConnector />
          <BadgeToastConnector />
          <TimelineConnector />
        </section>
      )}

      {/* Screen 3: Compare Two Cities */}
      {screen === "compare" && (
        <section data-testid="screen-compare" style={{ display: "grid", gap: 8 }}>
          <AmbientGlowConnector side="left" />
          <AmbientGlowConnector side="right" />
          <CompareViewConnector />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <WeatherLayerConnector citySlot="A" selected={true} />
            <WeatherLayerConnector citySlot="B" selected={true} />
          </div>
          <TimelineConnector />
        </section>
      )}
    </div>
  );
}
