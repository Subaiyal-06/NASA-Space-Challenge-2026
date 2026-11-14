import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useClock } from "../src/state/clock.js";
import { validateClock, MONTH_SECONDS } from "../src/contracts/clock.js";
import { loadCity } from "../src/data/api.js";

describe("C4: Global Clock Store", () => {
  beforeEach(async () => {
    vi.useFakeTimers();
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
    useClock.getState().seek(1981, 0);
  });

  afterEach(() => {
    useClock.getState().pause();
    vi.useRealTimers();
  });

  it("satisfies the clock contract (validateClock)", () => {
    const problems = validateClock(useClock.getState());
    expect(problems).toEqual([]);
  });

  it("steps forward and backward across year boundaries and clamps to range", () => {
    const clock = useClock.getState();
    clock.seek(1981, 11);
    expect(useClock.getState().year).toBe(1981);
    expect(useClock.getState().month).toBe(11);

    clock.stepMonth(1);
    expect(useClock.getState().year).toBe(1982);
    expect(useClock.getState().month).toBe(0);

    clock.stepMonth(-1);
    expect(useClock.getState().year).toBe(1981);
    expect(useClock.getState().month).toBe(11);

    // Clamp at startYear (1981, 0)
    clock.seek(1981, 0);
    clock.stepMonth(-5);
    expect(useClock.getState().year).toBe(1981);
    expect(useClock.getState().month).toBe(0);
  });

  it("ticks one month every 2.5s in Month Mode and stops when paused", () => {
    const ticks = [];
    useClock.on("tick", (p) => ticks.push(p));

    useClock.getState().play();
    expect(useClock.getState().playing).toBe(true);

    vi.advanceTimersByTime(MONTH_SECONDS * 1000);
    expect(useClock.getState().month).toBe(1);
    expect(ticks.length).toBe(1);

    vi.advanceTimersByTime(MONTH_SECONDS * 1000);
    expect(useClock.getState().month).toBe(2);
    expect(ticks.length).toBe(2);

    useClock.getState().pause();
    vi.advanceTimersByTime(MONTH_SECONDS * 2000);
    expect(useClock.getState().month).toBe(2);
  });

  it("supports speed multipliers (1x, 2x, 4x) and Year Mode", () => {
    useClock.getState().setSpeed(2);
    useClock.getState().play();

    // At 2x speed, 1.25s advances 1 month
    vi.advanceTimersByTime(1250);
    expect(useClock.getState().month).toBe(1);

    // Switch to Year Mode (2s / speed = 1000ms at 2x speed)
    useClock.getState().setMode("year");
    vi.advanceTimersByTime(1000);
    expect(useClock.getState().year).toBe(1982);
  });

  it("updates tension and interest from city data when seeking or stepping", () => {
    // August 2022 (month 7) in Karachi had monsoon floods
    useClock.getState().seek(2022, 7);
    const s = useClock.getState();
    expect(s.year).toBe(2022);
    expect(s.month).toBe(7);
    expect(s.tension).toBeGreaterThan(0);
    expect(s.interest).toBeGreaterThan(0);
  });

  it("loads and selects cityA and cityB", async () => {
    const events = [];
    useClock.on("cityChange", (e) => events.push(e));

    await useClock.getState().selectCity("lahore", "A");
    expect(useClock.getState().cityA).toBe("lahore");

    await useClock.getState().selectCity("islamabad", "B");
    expect(useClock.getState().cityB).toBe("islamabad");
    expect(events).toEqual([
      { slot: "A", cityId: "lahore" },
      { slot: "B", cityId: "islamabad" },
    ]);
  });
});
