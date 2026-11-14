import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useClock } from "../src/state/clock.js";
import { getCalmStreak, isGhostCalmEligible, computePacing, getLayerGating } from "../src/state/pacing.js";
import { loadCity, getSnapshot } from "../src/data/api.js";

describe("C6: Smart Pacing, Calm Detection, Layer Gating & Future", () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    await loadCity("karachi");
    useClock.getState().pause();
    useClock.clearListeners();
    useClock.setState({
      year: 1995,
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

  afterEach(() => {
    useClock.getState().pause();
    vi.useRealTimers();
  });

  it("detects calm streaks and ghost weather eligibility (hidden before 1991 and in eventful months)", () => {
    // Find a stretch of 3+ calm months in Karachi >= 1991
    let calmPair = null;
    for (let y = 1991; y <= 2020 && !calmPair; y++) {
      for (let m = 2; m < 12; m++) {
        const s0 = getSnapshot("karachi", y, m - 2);
        const s1 = getSnapshot("karachi", y, m - 1);
        const s2 = getSnapshot("karachi", y, m);
        if (s0.interest < 0.25 && s1.interest < 0.25 && s2.interest < 0.25) {
          calmPair = { year: y, month: m };
          break;
        }
      }
    }
    expect(calmPair).not.toBeNull();

    const streak = getCalmStreak("karachi", calmPair.year, calmPair.month);
    expect(streak.isCalm).toBe(true);
    expect(streak.streakEndingHere).toBeGreaterThanOrEqual(3);
    expect(isGhostCalmEligible("karachi", calmPair.year, calmPair.month)).toBe(true);

    // Before 1991, ghost weather is never eligible (1981-1990 is baseline)
    expect(isGhostCalmEligible("karachi", 1985, 0)).toBe(false);

    // Eventful month (Aug 2022 monsoon flood) -> not calm, ghost not eligible
    expect(isGhostCalmEligible("karachi", 2022, 7)).toBe(false);
  });

  it("compresses calm stretches of 3+ months to 1s/month in Story Mode and emits pacing events", () => {
    // Find a 3+ calm stretch
    let startCalm = null;
    for (let y = 1991; y <= 2020 && !startCalm; y++) {
      for (let m = 0; m <= 9; m++) {
        const s0 = getSnapshot("karachi", y, m);
        const s1 = getSnapshot("karachi", y, m + 1);
        const s2 = getSnapshot("karachi", y, m + 2);
        if (s0.interest < 0.25 && s1.interest < 0.25 && s2.interest < 0.25) {
          startCalm = { year: y, month: m };
          break;
        }
      }
    }
    expect(startCalm).not.toBeNull();

    const pacingEvents = [];
    useClock.on("pacing", (e) => pacingEvents.push(e));

    // In Month Mode, never skips
    useClock.getState().seek(startCalm.year, startCalm.month);
    expect(useClock.getState().pacing).toBe("normal");

    // Switch to Story Mode -> enters "skipping"
    useClock.getState().setMode("story");
    expect(useClock.getState().pacing).toBe("skipping");
    expect(pacingEvents.some((e) => e.pacing === "skipping")).toBe(true);

    // When playing in Story Mode while skipping, advances in 1000ms instead of 2500ms
    useClock.getState().play();
    vi.advanceTimersByTime(1000);
    expect(useClock.getState().month).toBe(startCalm.month + 1);

    // Seek to eventful month (Aug 2022) -> returns to "normal" pacing
    useClock.getState().seek(2022, 7);
    expect(useClock.getState().pacing).toBe("normal");
  });

  it("gates layers before their startYear with a clear reason", () => {
    const gating1950 = getLayerGating("karachi", 1950, ["temperature", "rainfall", "drought", "quakes", "air"]);
    const rain1950 = gating1950.find((l) => l.id === "rainfall");
    expect(rain1950.available).toBe(false);
    expect(rain1950.reason).toContain("1981");

    const gating1995 = getLayerGating("karachi", 1995, ["temperature", "rainfall"]);
    const temp1995 = gating1995.find((l) => l.id === "temperature");
    expect(temp1995.available).toBe(true);
    expect(temp1995.reason).toBeNull();
    expect(temp1995.enabled).toBe(true);

    const drought1995 = gating1995.find((l) => l.id === "drought");
    expect(drought1995.enabled).toBe(false);
  });
});
