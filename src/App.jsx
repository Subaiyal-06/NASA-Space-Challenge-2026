// APP COMPOSITION (Pastel Mint & White 3D Minimal UI with Framer Motion + Lucide icons)
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Contrast, Headphones, PlayCircle, Sparkles } from "lucide-react";
import { useClock } from "./state/clock.js";
import { useSettings } from "./settings/index.js";
import { useAppFlow, initAppBridge } from "./app/flow.js";
import { attachKeyboardShortcuts } from "./app/keyboard.js";
import { getCityList, loadCity } from "./data/api.js";
import { GlobeArtifact3D } from "./integrations/ui/Artifacts3D.jsx";
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
        background: "var(--ej-bg-gradient, #F3FBF7)",
        color: "var(--ej-fg, #064E3B)",
        fontFamily: "'Plus Jakarta Sans', 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
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
          background: "var(--ej-header-bg, rgba(255, 255, 255, 0.9))",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--ej-border, #BCEAD5)",
          boxShadow: "0 4px 18px rgba(6, 78, 59, 0.05)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <GlobeArtifact3D size={28} reduceMotion={reduceMotion} />
          <strong style={{ fontSize: "15px", letterSpacing: "-0.2px", color: "var(--ej-fg, #064E3B)" }}>
            Earth Jukebox: Pakistan
          </strong>
        </div>

        <nav aria-label="Screen navigation" style={{ display: "flex", gap: "6px", marginLeft: "6px" }}>
          <NavBtn
            active={screen === "intro"}
            onClick={() => (returnToIntro ? returnToIntro() : setScreen("intro"))}
            reduceMotion={reduceMotion}
          >
            <ArrowLeft size={13} />
            <span>Map</span>
          </NavBtn>
          <NavBtn active={screen === "player"} onClick={() => closeCompare()} reduceMotion={reduceMotion}>
            <PlayCircle size={13} />
            <span>Player</span>
          </NavBtn>
          <NavBtn
            active={screen === "compare"}
            onClick={() => openCompare(cityB || (cityA === "karachi" ? "lahore" : "karachi"))}
            reduceMotion={reduceMotion}
          >
            <Headphones size={13} />
            <span>Compare</span>
          </NavBtn>
        </nav>

        {/* City Selectors */}
        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px", marginLeft: "4px" }}>
          <span style={{ color: "var(--ej-fg-muted, #475569)", fontWeight: 600 }}>City A:</span>
          <select value={cityA} onChange={(e) => selectCity(e.target.value, "A")} style={selectStyle}>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        {screen === "compare" && (
          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px" }}>
            <span style={{ color: "var(--ej-fg-muted, #475569)", fontWeight: 600 }}>City B:</span>
            <select
              value={cityB ?? "lahore"}
              onChange={(e) => selectCity(e.target.value, "B")}
              style={{ ...selectStyle, borderColor: "#5EEAD4" }}
            >
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {/* Future Projection Controls */}
        {screen !== "intro" && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                cursor: "pointer",
                color: "#065F46",
                fontWeight: 600,
              }}
            >
              <input
                type="checkbox"
                checked={futureEnabled}
                onChange={(e) => setFutureEnabled(e.target.checked)}
                style={{ accentColor: "#059669" }}
              />
              <Sparkles size={13} color="#059669" />
              <span>Future</span>
            </label>
            {futureEnabled && (
              <select
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                aria-label="Projection scenario"
                style={{ ...selectStyle, padding: "3px 7px", fontSize: "11.5px" }}
              >
                <option value="ssp245">SSP2-4.5 (Lower)</option>
                <option value="ssp585">SSP5-8.5 (Higher)</option>
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
            color: "var(--ej-fg-muted, #475569)",
            fontWeight: 600,
          }}
        >
          <label style={toggleLabelStyle}>
            <input
              type="checkbox"
              checked={reduceMotion}
              onChange={(e) => setReduceMotion(e.target.checked)}
              style={{ accentColor: "#059669" }}
            />
            Reduce motion
          </label>
          <label style={toggleLabelStyle}>
            <input
              type="checkbox"
              checked={showGhostAlways}
              onChange={(e) => setShowGhostAlways(e.target.checked)}
              style={{ accentColor: "#059669" }}
            />
            Show the 1980s
          </label>
          <label style={toggleLabelStyle}>
            <input
              type="checkbox"
              checked={voiceAnnouncer}
              onChange={(e) => setVoiceAnnouncer(e.target.checked)}
              style={{ accentColor: "#059669" }}
            />
            Voice announcer
          </label>
          <label style={toggleLabelStyle}>
            <input
              type="checkbox"
              checked={muted}
              onChange={(e) => setMuted(e.target.checked)}
              style={{ accentColor: "#059669" }}
            />
            Mute
          </label>
          <button
            type="button"
            onClick={() => setHighContrast((v) => !v)}
            aria-pressed={highContrast}
            title="Toggle High Contrast"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "4px 10px",
              borderRadius: "8px",
              fontSize: "11.5px",
              background: highContrast ? "#064E3B" : "#ECFDF5",
              color: highContrast ? "#FFFFFF" : "#065F46",
              border: "1px solid #A7F3D0",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            <Contrast size={13} />
            <span>{highContrast ? "High Contrast" : "Contrast"}</span>
          </button>
        </div>
      </header>

      {/* Screen Views with Framer Motion transitions */}
      {screen === "intro" && (
        <motion.section
          key="intro"
          data-testid="screen-intro"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.25 }}
          style={{ flex: 1, display: "flex", flexDirection: "column" }}
        >
          <GlobeIntroConnector />
        </motion.section>
      )}

      {screen === "player" && (
        <motion.section
          key="player"
          data-testid="screen-player"
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.28 }}
          style={{
            position: "relative",
            zIndex: 10,
            flex: 1,
            padding: "16px 20px",
            display: "grid",
            gridTemplateColumns: "minmax(280px, 330px) 1fr",
            gap: "16px",
            alignItems: "start",
            maxWidth: "1440px",
            width: "100%",
            margin: "0 auto",
          }}
        >
          <AmbientGlowConnector side="both" />

          {/* Left Column: 3D Weather Stage + Instrument Layer Toggles */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ minHeight: "268px" }}>
              <WeatherLayerConnector citySlot="A" selected={true} />
            </div>
            <LayerTogglesConnector />
          </div>

          {/* Center / Right Column: Alerts, Tension, Timeline, Charts, Legend */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", minWidth: 0 }}>
            <StoryCardConnector />
            <BadgeToastConnector />
            <TensionMeterConnector />
            <TimelineConnector />
            <ChartsConnector />
            <LegendConnector />
          </div>
        </motion.section>
      )}

      {screen === "compare" && (
        <motion.section
          key="compare"
          data-testid="screen-compare"
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.28 }}
          style={{
            position: "relative",
            zIndex: 10,
            flex: 1,
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            maxWidth: "1440px",
            width: "100%",
            margin: "0 auto",
          }}
        >
          <AmbientGlowConnector side="left" />
          <AmbientGlowConnector side="right" />
          <CompareViewConnector />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: "14px", minHeight: "260px" }}>
            <WeatherLayerConnector citySlot="A" selected={true} />
            <WeatherLayerConnector citySlot="B" selected={true} />
          </div>
          <TimelineConnector />
        </motion.section>
      )}
    </div>
  );
}

const toggleLabelStyle = {
  display: "flex",
  alignItems: "center",
  gap: "5px",
  cursor: "pointer",
};

const selectStyle = {
  padding: "4px 10px",
  borderRadius: "8px",
  background: "#ECFDF5",
  border: "1px solid #A7F3D0",
  color: "#064E3B",
  fontWeight: 600,
  fontSize: "12.5px",
  cursor: "pointer",
};

function NavBtn({ active, onClick, children, reduceMotion }) {
  return (
    <motion.button
      type="button"
      whileTap={reduceMotion ? undefined : { scale: 0.96 }}
      onClick={onClick}
      aria-pressed={active}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "5px 12px",
        borderRadius: "9px",
        fontSize: "12.5px",
        fontWeight: active ? 700 : 600,
        color: active ? "#FFFFFF" : "#065F46",
        background: active ? "linear-gradient(135deg, #10B981, #059669)" : "#F0FDF4",
        border: `1px solid ${active ? "#059669" : "#BCEAD5"}`,
        boxShadow: active ? "0 3px 10px rgba(5, 150, 105, 0.24)" : "none",
        cursor: "pointer",
      }}
    >
      {children}
    </motion.button>
  );
}
