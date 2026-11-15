// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { useClock } from "../src/state/clock.js";
import { useSettings } from "../src/settings/index.js";
import { loadCity, getRange, getMarkers } from "../src/data/api.js";
import PlaybackBar from "../src/studio/ui/PlaybackBar.jsx";
import CategoryRail from "../src/studio/ui/CategoryRail.jsx";
import { useStudio } from "../src/studio/state.js";
import {
  toIndex, fromIndex, percentAlong, formatDate, stepSeconds, nextSpeed, categoriesFor, bigMoments, tidyMoment,
} from "../src/studio/ui/timeline.js";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("timeline helpers", () => {
  it("treats time as one line and converts back", () => {
    expect(fromIndex(toIndex(2022, 6))).toEqual({ year: 2022, month: 6 });
    expect(toIndex(1981, 0)).toBeLessThan(toIndex(1981, 1));
    expect(formatDate(2022, 6)).toBe("July 2022");
  });

  it("works out how far along the scrubber is, never outside 0-100", () => {
    expect(percentAlong(50, 0, 100)).toBe(50);
    expect(percentAlong(-5, 0, 100)).toBe(0);
    expect(percentAlong(500, 0, 100)).toBe(100);
    expect(percentAlong(3, 3, 3)).toBe(0);
  });

  it("matches the clock's timing and cycles the speed", () => {
    expect(stepSeconds({ mode: "month", speed: 1 })).toBe(2.5);
    expect(stepSeconds({ mode: "month", speed: 2 })).toBe(1.25);
    expect(stepSeconds({ mode: "year", speed: 1 })).toBe(2);
    expect(stepSeconds({ mode: "story", speed: 1, pacing: "skipping" })).toBe(1);
    expect([1, 2, 4].map(nextSpeed)).toEqual([2, 4, 1]);
  });

  it("tidies record texts for the jump list but keeps 'in our data'", () => {
    expect(tidyMoment("One of the hottest months vs normal in our data (September)")).toBe("One of the hottest months in our data");
    expect(tidyMoment("Wettest year in our data")).toBe("Wettest year in our data");
  });

  it("big moments: stories first, one per date, data months 1-12 become clock months 0-11", () => {
    const out = bigMoments({ stories: [{ year: 2005, month: 10, title: "Kashmir earthquake" }], badges: [{ year: 2005, month: 10, text: "Kashmir earthquake" }, { year: 2022, month: 8, text: "Wettest month (August)" }] });
    expect(out[0]).toEqual({ year: 2005, month: 9, text: "Kashmir earthquake" });
    expect(out).toHaveLength(2); // the duplicate was dropped
    expect(out[1]).toEqual({ year: 2022, month: 7, text: "Wettest month" });
  });
});

describe("categories come from the city's real layers", () => {
  let karachi;
  beforeAll(async () => { karachi = await loadCity("karachi"); });

  it("lists only layers the city has, and says when each one starts", () => {
    const early = categoriesFor(karachi, 1981);
    expect(early.map((c) => c.id)).toEqual(["temperature", "rainfall", "drought", "quakes", "vegetation"]);
    expect(early.find((c) => c.id === "drought")).toMatchObject({ available: false, startYear: 1982 });
    expect(early.find((c) => c.id === "vegetation")).toMatchObject({ available: false, startYear: 2001 });
    expect(early.find((c) => c.id === "temperature").available).toBe(true);
    expect(categoriesFor(karachi, 2005).every((c) => c.available)).toBe(true);
    expect(categoriesFor(null, 2000)).toEqual([]);
  });

  it("a new layer shows up as a chip with no code change", () => {
    const withLights = { ...karachi, layers: { ...karachi.layers, nightlights: { source: "x", startYear: 2012, yearly: { 2015: 3 } } } };
    expect(categoriesFor(withLights, 2020).map((c) => c.id)).toContain("nightlights");
  });
});

describe("playback bar and category rail", () => {
  let host, root, city, range, markers;
  const mount = async (el) => { host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host); await act(async () => root.render(el)); };
  const click = async (selector, text) => {
    const nodes = [...host.querySelectorAll(selector)];
    const target = text ? nodes.find((n) => n.textContent.trim() === text || n.getAttribute("aria-label") === text) : nodes[0];
    await act(async () => target.click());
  };

  const clickChip = async (label) => {
    const chip = [...host.querySelectorAll("button.chip")].find((b) => b.querySelector(".chip__label").textContent === label);
    await act(async () => chip.click());
  };

  beforeAll(async () => {
    await useClock.getState().selectCity("karachi", "A");
    city = await loadCity("karachi");
    range = getRange(city); markers = getMarkers(city);
  });
  afterEach(async () => {
    useClock.getState().pause();
    useClock.getState().seek(1981, 0);
    useClock.getState().setMode("month");
    useClock.getState().setSpeed(1);
    useClock.getState().setLayers(["temperature", "rainfall", "drought", "quakes", "air"]);
    useSettings.getState().setMuted(false);
    if (root) await act(async () => root.unmount());
    host?.remove();
  });

  const bar = () => <PlaybackBar cityId="karachi" range={range} markers={markers} reduce />;

  it("shows the city and the date, and play/pause drives the clock", async () => {
    await mount(bar());
    expect(host.textContent).toContain("Karachi");
    expect(host.textContent).toContain("January 1981");
    await click("button", "Play");
    expect(useClock.getState().playing).toBe(true);
    await click("button", "Pause");
    expect(useClock.getState().playing).toBe(false);
  });

  it("step, leap and the scrubber move the playhead", async () => {
    await mount(bar());
    await click("button", "Next month");
    expect(host.textContent).toContain("February 1981");
    await click("button", "Forward 5 years");
    expect(useClock.getState().year).toBe(1986);
    await click("button", "Back 5 years");
    expect(useClock.getState().year).toBe(1981);
    const input = host.querySelector("input[type=range]");
    expect(Number(input.min)).toBe(toIndex(range.startYear, 0));
    expect(Number(input.max)).toBe(toIndex(range.endYear, 11));
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, String(toIndex(2022, 6)));
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(host.textContent).toContain("July 2022");
  });

  it("mode, speed and mute work", async () => {
    await mount(bar());
    await click("button[role=radio]", "Year");
    expect(useClock.getState().mode).toBe("year");
    await click("button.speed");
    expect(useClock.getState().speed).toBe(2);
    await click("button", "Mute");
    expect(useSettings.getState().muted).toBe(true);
    expect(host.querySelector("[aria-label='Unmute']")).not.toBeNull();
  });

  it("jump to a time: decade, year and month, and Escape closes it", async () => {
    await mount(bar());
    expect(host.querySelector("[role=dialog]")).toBeNull();
    await click("button.jump-btn");
    expect(host.querySelector("[role=dialog]")).not.toBeNull();
    await click(".jump .pill", "2020s");
    await click(".jump .pill", "2022");
    await click(".jump .pill", "Jul");
    expect(useClock.getState().year).toBe(2022);
    expect(useClock.getState().month).toBe(6);
    await act(async () => { document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); });
    expect(host.querySelector("[role=dialog]")).toBeNull();
  });

  it("picking a big moment jumps there and closes the panel", async () => {
    await mount(bar());
    await click("button.jump-btn");
    const first = host.querySelector(".moment");
    expect(first).not.toBeNull();
    await act(async () => first.click());
    expect(host.querySelector("[role=dialog]")).toBeNull();
  });

  it("category chips switch core layers through the clock and extras through the studio", async () => {
    await mount(<CategoryRail city={city} />);
    expect(host.textContent).toContain("Listen to");
    await clickChip("Rain");
    expect(useClock.getState().layers).not.toContain("rainfall");
    await clickChip("Rain");
    expect(useClock.getState().layers).toContain("rainfall");
    const before = useStudio.getState().extras.vegetation;
    await clickChip("Greenery");
    expect(useStudio.getState().extras.vegetation).toBe(!before);
    await clickChip("Greenery");
    expect(host.querySelector("button.chip[aria-pressed=true]")).not.toBeNull();
  });
});
