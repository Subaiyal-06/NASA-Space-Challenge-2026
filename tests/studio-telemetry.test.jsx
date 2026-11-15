// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, it, expect, beforeAll } from "vitest";
import { loadCity, getSnapshot } from "../src/data/api.js";
import { weatherFor } from "../src/studio/weather/rules.js";
import { headlineFor, hearingFor, gaugesFor, stressPercent, stressWord } from "../src/studio/ui/gauges.js";
import { movingAverage, niceDomain, makeAxes, linePath, stemPath, nearestPoint, yearTicks } from "../src/studio/ui/chart.js";
import { toIndex } from "../src/studio/ui/timeline.js";
import RightNow from "../src/studio/ui/RightNow.jsx";
import HistoryChart from "../src/studio/ui/HistoryChart.jsx";
import BadgeToast from "../src/studio/ui/BadgeToast.jsx";
import { useClock } from "../src/state/clock.js";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const ALL = ["temperature", "rainfall", "drought", "quakes", "air"];

describe("telemetry words and gauges (real data)", () => {
  let karachi, quetta, islamabad;
  beforeAll(async () => { [karachi, quetta, islamabad] = await Promise.all([loadCity("karachi"), loadCity("quetta"), loadCity("islamabad")]); });
  const at = (city, y, m) => { const snapshot = getSnapshot(city, y, m); return { snapshot, wx: weatherFor(snapshot, { city, enabled: ALL }) }; };

  it("Karachi July 2022 is a storm month", () => {
    const { snapshot, wx } = at(karachi, 2022, 6);
    expect(headlineFor(wx, snapshot)).toMatch(/storm month: \d+ mm/i);
    expect(hearingFor(wx, 0.8)).toMatch(/rain/);
    const rain = gaugesFor(snapshot, karachi, { enabled: ALL }).find((g) => g.id === "rainfall");
    expect(rain.caption).toMatch(/× a normal July/);
  });

  it("Islamabad October 2005 names the magnitude 7.6 earthquake", () => {
    const { snapshot, wx } = at(islamabad, 2005, 9);
    expect(headlineFor(wx, snapshot)).toContain("7.6");
    const q = gaugesFor(snapshot, islamabad, { enabled: ALL }).find((g) => g.id === "quakes");
    expect(q.value).toBe("M7.6");
  });

  it("Quetta April 2004 is very dry, and a switched-off category has no gauge", () => {
    const { snapshot, wx } = at(quetta, 2004, 3);
    expect(headlineFor(wx, snapshot)).toMatch(/dry/i);
    expect(gaugesFor(snapshot, quetta, { enabled: ["rainfall"], showGreenery: false }).map((g) => g.id)).toEqual(["rainfall"]);
  });

  it("a quiet month says so; stress words follow the percentage", () => {
    expect(headlineFor(weatherFor(null), null)).toBe("A quiet month: nothing unusual.");
    expect(stressPercent({ tension: 0.456 })).toBe(46);
    expect([10, 30, 60, 90].map(stressWord)).toEqual(["calm", "building", "tense", "very high"]);
  });
});

describe("chart maths", () => {
  it("moving average smooths, domain includes zero, nearestPoint finds the closest month", () => {
    expect(movingAverage([0, 10, 0, 10, 0], 3)[2]).toBeCloseTo(6.67, 1);
    const [lo, hi] = niceDomain([2, 5], { include: [0] });
    expect(lo).toBe(0); expect(hi).toBeGreaterThan(5);
    const pts = [{ year: 2000, month: 0 }, { year: 2000, month: 6 }, { year: 2001, month: 0 }];
    expect(nearestPoint(pts, toIndex(2000, 5))).toBe(1);
    expect(nearestPoint([], 5)).toBe(-1);
  });
  it("axes map time to x and back, and paths are well formed", () => {
    const axes = makeAxes({ width: 500, height: 100, startIndex: 0, endIndex: 100, domain: [0, 10] });
    expect(axes.inverseX(axes.x(40))).toBe(40);
    expect(axes.y(10)).toBeLessThan(axes.y(0));
    const pts = [{ year: 0, month: 1, value: 2 }, { year: 0, month: 5, value: 8 }];
    expect(linePath(pts, axes)).toMatch(/^M[\d.]+ [\d.]+L/);
    expect(stemPath(pts, axes, 0).match(/M/g)).toHaveLength(2);
    expect(yearTicks(1981, 2025, 5).map((t) => t.year)).toEqual([1985, 1990, 1995, 2000, 2005, 2010, 2015, 2020, 2025]);
  });
});

describe("components", () => {
  let karachi, root, box;
  beforeAll(async () => { karachi = await loadCity("karachi"); });
  const mount = async (el) => { box = document.createElement("div"); document.body.appendChild(box); root = createRoot(box); await act(async () => root.render(el)); };
  const unmount = async () => { await act(async () => root.unmount()); box.remove(); };

  it("Right now shows the headline, gauges and the 'our own index' label", async () => {
    const snapshot = getSnapshot(karachi, 2022, 6);
    await mount(<RightNow wx={weatherFor(snapshot, { city: karachi, enabled: ALL })} snapshot={snapshot} city={karachi} enabled={ALL} showGreenery />);
    expect(box.textContent).toContain("July 2022");
    expect(box.textContent).toContain("A storm month");
    expect(box.textContent).toContain("our own index");
    expect(box.textContent).toContain("What you’re hearing");
    await unmount();
  });

  it("History chart has a tab per category and clicking the chart jumps the clock", async () => {
    await mount(<HistoryChart city={karachi} enabled={ALL} range={{ startYear: 1981, endYear: 2025 }} onClose={() => {}} />);
    const tabs = [...box.querySelectorAll("[role=tab]")].map((b) => b.textContent);
    expect(tabs).toEqual(expect.arrayContaining(["Heat", "Rain", "Climate stress"]));
    const svg = box.querySelector("svg");
    svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 860, height: 190 });
    await act(async () => { svg.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: 430 })); });
    const { year } = useClock.getState();
    expect(year).toBeGreaterThan(1995); expect(year).toBeLessThan(2010);
    await unmount();
  });

  it("the toast appears on a badge event", async () => {
    await mount(<BadgeToast />);
    await act(async () => { useClock.emit("badge", { year: 2022, month: 7, text: "Wettest July (in our data)" }); });
    expect(box.textContent).toContain("Wettest July (in our data)");
    await unmount();
  });
});
