// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, it, expect, beforeEach } from "vitest";
import App from "../src/App.jsx";
import { useClock } from "../src/state/clock.js";
import { useSettings } from "../src/settings/index.js";
import { useAppFlow, resetAudioEngine, initAppBridge } from "../src/app/flow.js";
import { buildCompareProps } from "../src/app/compare.js";
import { handleAppKeyDown } from "../src/app/keyboard.js";
import { announceMonth } from "../src/app/announcer.js";
import { useWarnings } from "../src/slots/warnings.js";
import { useAudioLog } from "../src/slots/NullAudio.js";
import { loadCity, getSnapshot } from "../src/data/api.js";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function render(element) {
  const el = document.createElement("div");
  document.body.appendChild(el);
  const root = createRoot(el);
  act(() => root.render(element));
  return { el, unmount: () => act(() => root.unmount()) };
}

describe("C8 & C9: Connectors, App Composition, Compare, Keyboard & Announcer", () => {
  beforeEach(async () => {
    useWarnings.getState().clear();
    useAudioLog.getState().clear();
    await loadCity("karachi");
    await loadCity("lahore");
    resetAudioEngine();
    useClock.getState().pause();
    useClock.clearListeners();
    useSettings.getState().reset();
    useClock.setState({
      year: 1981,
      month: 0,
      mode: "month",
      playing: false,
      speed: 1,
      pacing: "normal",
      cityA: "karachi",
      cityB: null,
      scenario: "ssp245",
      futureEnabled: false,
      layers: ["temperature", "rainfall", "drought", "quakes", "air"],
    });
    useAppFlow.setState({
      screen: "intro",
      activeStory: null,
      activeBadge: null,
      compareStartYear: 1981,
      audioStarted: false,
    });
  });

  it("renders Intro, Player, and Compare screens with zero slot prop warnings", async () => {
    const { el, unmount } = render(<App />);
    expect(el.textContent).toContain("GlobeIntro");
    expect(useWarnings.getState().warnings).toEqual([]);

    // Transition to Player screen
    await act(async () => {
      await useAppFlow.getState().startExperience("karachi");
    });
    expect(useAppFlow.getState().screen).toBe("player");
    expect(el.textContent).toContain("Timeline");
    expect(el.textContent).toContain("WeatherLayer");
    expect(el.textContent).toContain("TensionMeter");
    expect(useWarnings.getState().warnings).toEqual([]);

    // Audio engine received start() and setMonth()
    const audioCalls = useAudioLog.getState().calls.map((c) => c.method);
    expect(audioCalls).toContain("start");
    expect(audioCalls).toContain("setMonth");

    // Transition to Compare screen
    await act(async () => {
      await useAppFlow.getState().openCompare("lahore");
    });
    expect(useAppFlow.getState().screen).toBe("compare");
    expect(el.textContent).toContain("CompareView");
    expect(useWarnings.getState().warnings).toEqual([]);
    unmount();
  });

  it("computes 'Change Since' summary sentence and deltas between two cities", () => {
    const compareProps = buildCompareProps({
      cityA: "karachi",
      cityB: "lahore",
      startYear: 1981,
      currentYear: 2022,
      month: 7,
      reduceMotion: false,
    });
    expect(compareProps.summary).toContain("Since 1981");
    expect(compareProps.summary).toContain("Karachi");
    expect(compareProps.summary).toContain("Lahore");
    expect(compareProps.changeSince.karachi).toHaveProperty("tempDelta");
    expect(compareProps.changeSince.lahore).toHaveProperty("tempDelta");
    expect(compareProps.stereo).toEqual({ left: "karachi", right: "lahore" });
  });

  it("handles keyboard shortcuts (Space, Left/Right arrows, Shift+Arrow leap, Up/Down speed)", () => {
    initAppBridge();
    expect(useClock.getState().playing).toBe(false);

    // Space toggles play
    handleAppKeyDown({ code: "Space", preventDefault: () => {} });
    expect(useClock.getState().playing).toBe(true);

    // Space pauses
    handleAppKeyDown({ code: "Space", preventDefault: () => {} });
    expect(useClock.getState().playing).toBe(false);

    // ArrowRight steps 1 month forward
    handleAppKeyDown({ code: "ArrowRight", preventDefault: () => {} });
    expect(useClock.getState().month).toBe(1);

    // Shift + ArrowRight leaps +5 years
    handleAppKeyDown({ code: "ArrowRight", shiftKey: true, preventDefault: () => {} });
    expect(useClock.getState().year).toBe(1986);

    // ArrowUp increases speed (1 -> 2 -> 4)
    handleAppKeyDown({ code: "ArrowUp", preventDefault: () => {} });
    expect(useClock.getState().speed).toBe(2);
    handleAppKeyDown({ code: "ArrowUp", preventDefault: () => {} });
    expect(useClock.getState().speed).toBe(4);

    // ArrowDown decreases speed (4 -> 2)
    handleAppKeyDown({ code: "ArrowDown", preventDefault: () => {} });
    expect(useClock.getState().speed).toBe(2);
  });

  it("builds plain-language voice announcer text for each month", () => {
    const snap = getSnapshot("karachi", 2022, 7); // Aug 2022 flood
    const text = announceMonth("karachi", 2022, 7, snap, false);
    expect(text).toContain("Karachi, August 2022");
    expect(text).toContain("Heavy rainfall is rising");
  });
});
