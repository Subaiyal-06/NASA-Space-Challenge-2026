// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, it, expect, beforeEach } from "vitest";
import SlotHost from "../src/slots/SlotHost.jsx";
import { useWarnings } from "../src/slots/warnings.js";
import {
  SAMPLE_PROPS,
  validateAudioEngine,
  testAudioEngine,
  validateSlotComponent,
} from "../src/contracts/index.js";

import createAudioEngine, { chordForMonth, transposeOctave, noteToFreq } from "../src/integrations/audio/index.js";
import GlobeIntro from "../src/integrations/ui/GlobeIntro.jsx";
import Timeline from "../src/integrations/ui/Timeline.jsx";
import WeatherLayer from "../src/integrations/ui/WeatherLayer.jsx";
import AmbientGlow from "../src/integrations/ui/AmbientGlow.jsx";
import Charts from "../src/integrations/ui/Charts.jsx";
import TensionMeter from "../src/integrations/ui/TensionMeter.jsx";
import LayerToggles from "../src/integrations/ui/LayerToggles.jsx";
import StoryCard from "../src/integrations/ui/StoryCard.jsx";
import BadgeToast from "../src/integrations/ui/BadgeToast.jsx";
import CompareView from "../src/integrations/ui/CompareView.jsx";
import Legend from "../src/integrations/ui/Legend.jsx";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const UI_COMPONENTS = {
  GlobeIntro,
  Timeline,
  WeatherLayer,
  AmbientGlow,
  Charts,
  TensionMeter,
  LayerToggles,
  StoryCard,
  BadgeToast,
  CompareView,
  Legend,
};

function render(element) {
  const el = document.createElement("div");
  document.body.appendChild(el);
  const root = createRoot(el);
  act(() => root.render(element));
  return { el, unmount: () => act(() => root.unmount()) };
}

describe("C12: UI & Audio Modules Contract Validation & Bug Fixes", () => {
  beforeEach(() => {
    useWarnings.getState().clear();
  });

  it.each(Object.entries(UI_COMPONENTS))(
    "validates and renders %s inside SlotHost with SAMPLE_PROPS and zero warnings",
    (name, Component) => {
      expect(validateSlotComponent(name, Component)).toEqual([]);
      const sample = { ...SAMPLE_PROPS[name], reduceMotion: false };
      const { unmount } = render(<SlotHost name={name} override={Component} {...sample} />);
      expect(useWarnings.getState().warnings).toEqual([]);
      unmount();
    }
  );

  it("validates createAudioEngine against the Audio Contract and passes testAudioEngine()", async () => {
    const engine = createAudioEngine();
    expect(validateAudioEngine(engine)).toEqual([]);
    const results = await testAudioEngine(engine);
    expect(results.every((r) => r.ok)).toBe(true);
    engine.dispose();
  });

  it("fixes the G#3 note bug in E major tense chord and octave transposition", () => {
    const tenseChord = chordForMonth(10, true); // 4th chord in tense loop = E major
    expect(tenseChord).toEqual(["E3", "G#3", "B3"]);
    expect(transposeOctave("G#3", 1)).toBe("G#4");
    expect(noteToFreq("G#3")).toBeGreaterThan(200);
    expect(noteToFreq("G#3")).toBeLessThan(215);
  });

  it("renders Ghost Weather in WeatherLayer when ghost prop is provided", () => {
    const sample = {
      ...SAMPLE_PROPS.WeatherLayer,
      ghost: { heatAnomaly: 0.1, rainPercentile: 50, spi: 0, aod: 0.2 },
      reduceMotion: false,
    };
    const { el, unmount } = render(<SlotHost name="WeatherLayer" override={WeatherLayer} {...sample} />);
    expect(el.textContent).toContain("1980s normal ghost");
    expect(el.textContent).toContain("+0.7°C vs 1980s");
    unmount();
  });

  it("renders left and right AmbientGlow sides for stereo compare mode", () => {
    const left = render(
      <SlotHost
        name="AmbientGlow"
        override={AmbientGlow}
        states={[{ type: "hot", strength: 0.8 }]}
        side="left"
        beatPhase={0}
        reduceMotion={false}
      />
    );
    const right = render(
      <SlotHost
        name="AmbientGlow"
        override={AmbientGlow}
        states={[{ type: "heavy-rain", strength: 0.9 }]}
        side="right"
        beatPhase={0}
        reduceMotion={false}
      />
    );
    expect(left.el.querySelector('[data-testid="ambient-glow-left"]')).not.toBeNull();
    expect(right.el.querySelector('[data-testid="ambient-glow-right"]')).not.toBeNull();
    left.unmount();
    right.unmount();
  });
});
