// APP COMPOSITION (Step C8, C9 & C12: Intro -> Player -> Compare layout with all 11 Slot Connectors)
import React, { useEffect, useState } from "react";
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
  const returnToIntro = useAppFlow((s) => s.returnToIntro);
  const openCompare = useAppFlow((s) => s.openCompare);
  const closeCompare = useAppFlow((s) => s.closeCompare);

  const cityA = useClock((s) => s.cityA);
  const cityB = useClock((s) => s.cityB);
  const selectCity = useClock((s) => s.selectCity);
  const futureEnabled = useClock((s) => s.futureEnabled);
  const setFutureEnabled = useClock((s) => s.setFutureEnabled);
  const scenario = useClock((s) => s.scenario);
  const setScenario = useClock((s) => s.setScenario);

  const [highContrast, setHighContrast] = useState(false);

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
    loadCity("karachi")
      .then(() => {
        // Ensure initial city snapshot & metrics are populated right away
        useClock.getState().selectCity(useClock.getState().cityA || "karachi", "A");
      })
      .catch(() => {});
    const detachBridge = initAppBridge();
    const detachKeys = attachKeyboardShortcuts();
    return () => {
      detachBridge();
      detachKeys();
    };
  }, []);

  return (
    <div
      data-testid="app-root"
      data-screen={screen}
      className={highContrast ? "high-contrast" : ""}
      style={{
        minHeight: "100vh",
        background: "var(--ej-bg, #0d1b2a)",
        color: "var(--ej-fg, #e8f4f8)",
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top Bar */}
      <header
        style={{
          position: "relative",
          zIndex: 20,
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          alignItems: "center",
          padding: "10px 18px",
          background: "var(--ej-header-bg, rgba(8, 20, 36, 0.94))",
          borderBottom: "1px solid var(--ej-border, rgba(255,255,255,0.1))",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "18px" }}>🌍</span>
          <strong style={{ fontSize: "15px", letterSpacing: "0.2px" }}>Earth Jukebox: Pakistan</strong>
        </div>

        <nav aria-label="Screen navigation" style={{ display: "flex", gap: "6px", marginLeft: "8px" }}>
          <NavBtn
            active={screen === "intro"}
            onClick={() => (returnToIntro ? returnToIntro() : setScreen("intro"))}
          >
            ← Globe
          </NavBtn>
          <NavBtn active={screen === "player"} onClick={() => closeCompare()}>
            Player
          </NavBtn>
          <NavBtn
            active={screen === "compare"}
            onClick={() => openCompare(cityB || (cityA === "karachi" ? "lahore" : "karachi"))}
          >
            🎧 Compare
          </NavBtn>
        </nav>

        {/* City Selectors */}
        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px", marginLeft: "6px" }}>
          <span style={{ color: "#93c5fd" }}>City A:</span>
          <select
            value={cityA}
            onChange={(e) => selectCity(e.target.value, "A")}
            style={selectStyle}
          >
            {cities.map((c) => (
              <option key={c.id} value={c.id} style={{ background: "#0d1b2a", color: "#fff" }}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        {screen === "compare" && (
          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px" }}>
            <span style={{ color: "#c4b5fd" }}>City B:</span>
            <select
              value={cityB ?? "lahore"}
              onChange={(e) => selectCity(e.target.value, "B")}
              style={{ ...selectStyle, borderColor: "rgba(139, 92, 246, 0.5)" }}
            >
              {cities.map((c) => (
                <option key={c.id} value={c.id} style={{ background: "#0d1b2a", color: "#fff" }}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {/* Future Projection Controls */}
        {screen !== "intro" && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer", color: "#93c5fd" }}>
              <input
                type="checkbox"
                checked={futureEnabled}
                onChange={(e) => setFutureEnabled(e.target.checked)}
              />
              🔭 Future
            </label>
            {futureEnabled && (
              <select
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                aria-label="Projection scenario"
                style={{ ...selectStyle, padding: "2px 6px", fontSize: "11.5px" }}
              >
                <option value="ssp245" style={{ background: "#0d1b2a" }}>SSP2-4.5 (Lower)</option>
                <option value="ssp585" style={{ background: "#0d1b2a" }}>SSP5-8.5 (Higher)</option>
              </select>
            )}
          </div>
        )}

        {/* Accessibility & Feature Toggles */}
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "10px",
            fontSize: "12px",
          }}
        >
          <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={reduceMotion}
              onChange={(e) => setReduceMotion(e.target.checked)}
            />
            Reduce motion
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={showGhostAlways}
              onChange={(e) => setShowGhostAlways(e.target.checked)}
            />
            Show the 1980s
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={voiceAnnouncer}
              onChange={(e) => setVoiceAnnouncer(e.target.checked)}
            />
            Voice announcer
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={muted}
              onChange={(e) => setMuted(e.target.checked)}
            />
            Mute
          </label>
          <button
            type="button"
            onClick={() => setHighContrast((v) => !v)}
            aria-pressed={highContrast}
            title="Toggle High Contrast"
            style={{
              padding: "3px 8px",
              borderRadius: "6px",
              fontSize: "11.5px",
              background: highContrast ? "#facc15" : "rgba(255,255,255,0.08)",
              color: highContrast ? "#000000" : "#e0f2fe",
              border: "1px solid rgba(255,255,255,0.2)",
              cursor: "pointer",
              fontWeight: highContrast ? 700 : 500,
            }}
          >
            {highContrast ? "🌕 High Contrast" : "🌑 Contrast"}
          </button>
        </div>
      </header>

      {/* Screen 1: Intro Globe */}
      {screen === "intro" && (
        <section data-testid="screen-intro" style={{ flex: 1 }}>
          <GlobeIntroConnector />
        </section>
      )}

      {/* Screen 2: Main Player Dashboard */}
      {screen === "player" && (
        <section
          data-testid="screen-player"
          style={{
            position: "relative",
            zIndex: 10,
            flex: 1,
            padding: "14px 18px",
            display: "grid",
            gridTemplateColumns: "minmax(270px, 310px) 1fr",
            gap: "14px",
            alignItems: "start",
          }}
        >
          <AmbientGlowConnector side="both" />

          {/* Left Column: Weather Stage + Instrument Layer Toggles */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ minHeight: "250px" }}>
              <WeatherLayerConnector citySlot="A" selected={true} />
            </div>
            <LayerTogglesConnector />
          </div>

          {/* Center / Right Column: Alerts, Tension, Timeline, Charts, Legend */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", minWidth: 0 }}>
            <StoryCardConnector />
            <BadgeToastConnector />
            <TensionMeterConnector />
            <TimelineConnector />
            <ChartsConnector />
            <LegendConnector />
          </div>
        </section>
      )}

      {/* Screen 3: Compare Two Cities */}
      {screen === "compare" && (
        <section
          data-testid="screen-compare"
          style={{
            position: "relative",
            zIndex: 10,
            flex: 1,
            padding: "14px 18px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <AmbientGlowConnector side="left" />
          <AmbientGlowConnector side="right" />
          <CompareViewConnector />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", minHeight: "230px" }}>
            <WeatherLayerConnector citySlot="A" selected={true} />
            <WeatherLayerConnector citySlot="B" selected={true} />
          </div>
          <TimelineConnector />
        </section>
      )}
    </div>
  );
}

const selectStyle = {
  padding: "4px 10px",
  borderRadius: "8px",
  background: "rgba(14, 165, 233, 0.16)",
  border: "1px solid rgba(56, 189, 248, 0.35)",
  color: "#ffffff",
  fontSize: "12.5px",
  cursor: "pointer",
};

function NavBtn({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        padding: "5px 12px",
        borderRadius: "8px",
        fontSize: "12.5px",
        fontWeight: active ? 700 : 500,
        color: active ? "#ffffff" : "#93c5fd",
        background: active ? "rgba(14, 165, 233, 0.35)" : "rgba(255,255,255,0.05)",
        border: `1px solid ${active ? "rgba(56, 189, 248, 0.65)" : "rgba(255,255,255,0.12)"}`,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}
