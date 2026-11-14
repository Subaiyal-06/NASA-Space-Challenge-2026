import { describe, it, expect, beforeEach } from "vitest";
import { useClock } from "../src/state/clock.js";
import { findEventsAt } from "../src/state/events.js";
import {
  buildWeatherLayerProps,
  buildAmbientGlowProps,
  buildTensionMeterProps,
  buildLegendProps,
} from "../src/app/propBuilders.js";
import { validateSlotProps } from "../src/contracts/ui.js";
import { loadCity, getSnapshot } from "../src/data/api.js";

describe("C7: Events & Derived Prop Builders", () => {
  beforeEach(async () => {
    await loadCity("karachi");
    useClock.getState().pause();
    useClock.clearListeners();
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
  });

  it("emits badge and quake events when seeking to notable historical months", () => {
    const badges = [];
    const quakes = [];
    useClock.on("badge", (b) => badges.push(b));
    useClock.on("quake", (q) => quakes.push(q));

    // August 2020 (month 7) has a rainfall record badge in karachi.json
    useClock.getState().seek(2020, 7);
    expect(badges.length).toBeGreaterThan(0);
    expect(badges[0].text).toContain("in our data");

    // April 2013 (month 3) has earthquakes including a M7.7 quake in karachi.json
    useClock.getState().seek(2013, 3);
    expect(quakes.length).toBeGreaterThan(0);
    expect(quakes.some((q) => q.magnitude >= 7.0)).toBe(true);
    expect(quakes[0].source).toContain("USGS");
  });

  it("builds valid WeatherLayer props with anomaly conditions and ghost baseline rules", () => {
    // Eventful month (Aug 2022 flood, month 7): ghost must be null unless showGhostAlways is true
    const propsAug2022 = buildWeatherLayerProps({
      cityId: "karachi",
      selected: true,
      year: 2022,
      month: 7,
      showGhostAlways: false,
      reduceMotion: false,
    });
    expect(validateSlotProps("WeatherLayer", propsAug2022)).toEqual([]);
    expect(propsAug2022.conditions.rainPercentile).toBeGreaterThanOrEqual(80);
    expect(propsAug2022.ghost).toBeNull();

    // With showGhostAlways = true, ghost is populated with 1981-1990 baseline
    const propsForcedGhost = buildWeatherLayerProps({
      cityId: "karachi",
      selected: true,
      year: 2022,
      month: 7,
      showGhostAlways: true,
      reduceMotion: true,
    });
    expect(propsForcedGhost.ghost).not.toBeNull();
    expect(propsForcedGhost.ghost).toHaveProperty("heatAnomaly");
    expect(propsForcedGhost.ghost).toHaveProperty("rainPercentile");
    expect(propsForcedGhost.reduceMotion).toBe(true);
  });

  it("builds blended AmbientGlow props sorted by strength", () => {
    const snapFlood = getSnapshot("karachi", 2022, 7);
    const glowProps = buildAmbientGlowProps({
      snapshot: snapFlood,
      side: "both",
      beatPhase: 0.5,
      reduceMotion: false,
    });
    expect(validateSlotProps("AmbientGlow", glowProps)).toEqual([]);
    expect(glowProps.states.length).toBeGreaterThan(0);
    expect(glowProps.states.some((s) => s.type === "heavy-rain")).toBe(true);
  });

  it("builds valid TensionMeter and Legend props with 'What am I hearing?' text", () => {
    const snap = getSnapshot("karachi", 2013, 3);
    const tmProps = buildTensionMeterProps({
      tension: snap.tension,
      interest: snap.interest,
      reduceMotion: false,
    });
    expect(validateSlotProps("TensionMeter", tmProps)).toEqual([]);
    expect(tmProps.label).toContain("our own index");

    const legendProps = buildLegendProps({
      cityId: "karachi",
      year: 2013,
      month: 3,
      snapshot: snap,
      enabledLayers: ["temperature", "rainfall", "drought", "quakes", "air"],
      reduceMotion: false,
    });
    expect(validateSlotProps("Legend", legendProps)).toEqual([]);
    expect(legendProps.explanation).toContain("Karachi, April 2013");
    expect(legendProps.explanation).toContain("USGS");
    expect(legendProps.explanation).toContain("our own index");
  });
});
