// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from "vitest";
import { loadCity, getSnapshot } from "../src/data/api.js";
import { weatherFor, vegetationNormal, T, GLOW_COLORS } from "../src/studio/weather/rules.js";
import { metersPerPixel, liftPixels, projectDisc } from "../src/studio/weather/anchor.js";
import { createFlashGovernor, nextFlashDelay, MIN_FLASH_GAP_MS, useFx } from "../src/studio/weather/fx.js";
import EdgeGlow, { beatSeconds } from "../src/studio/weather/EdgeGlow.jsx";
import WeatherLayer from "../src/studio/weather/WeatherLayer.jsx";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const ALL = ["temperature", "rainfall", "drought", "quakes", "air"];

describe("weather rules use the real data", () => {
  let karachi, quetta, islamabad;
  beforeAll(async () => { [karachi, quetta, islamabad] = await Promise.all([loadCity("karachi"), loadCity("quetta"), loadCity("islamabad")]); });
  const wx = (city, y, m, extra = {}) => weatherFor(getSnapshot(city, y, m), { city, enabled: ALL, ...extra });

  it("the July 2022 Karachi flood is a storm: dark clouds, heavy rain, lightning allowed", () => {
    const w = wx(karachi, 2022, 6);
    expect(w.storm).toBe(true);
    expect(w.rain).toBe(1);
    expect(w.clouds).toBe(1);
    expect(w.labels.map((l) => l.text)).toContain("Storm");
    expect(w.glow.find((g) => g.type === "rainHeavy").strength).toBeGreaterThanOrEqual(0.6);
  });

  it("a dry July has no clouds, rain or storm", () => {
    const w = wx(karachi, 1987, 6);
    expect(w).toMatchObject({ clouds: 0, rain: 0, storm: false });
    expect(w.labels.some((l) => ["storm", "rain", "clouds"].includes(l.kind))).toBe(false);
  });

  it("the 2005 Kashmir earthquake shows on Islamabad's October, and only when the Earthquakes chip is on", () => {
    const w = wx(islamabad, 2005, 9);
    expect(w.quake.magnitude).toBe(7.6);
    expect(w.labels.map((l) => l.text)).toContain("Earthquake M7.6");
    const quakeGlow = w.glow.find((g) => g.type === "quake");
    expect(quakeGlow.strength).toBeLessThanOrEqual(0.7);
    expect(weatherFor(getSnapshot(islamabad, 2005, 9), { city: islamabad, enabled: ALL.filter((l) => l !== "quakes") }).quake).toBeNull();
    expect(wx(islamabad, 2005, 8).quake).toBeNull();
  });

  it("Quetta's April 2004 is very dry; heat and cold are labelled in words", () => {
    const dry = wx(quetta, 2004, 3);
    expect(dry.dry).toBeGreaterThan(0.8);
    expect(dry.labels.map((l) => l.text)).toContain("Very dry");
    const hot = wx(karachi, 2006, 1);
    expect(hot.heat).toBeGreaterThan(0.6);
    expect(hot.labels.map((l) => l.text)).toContain("Much hotter than usual");
    const cool = wx(karachi, 1986, 11);
    expect(cool.heat).toBeLessThan(0);
    expect(cool.labels.map((l) => l.text)).toContain("Cooler than usual");
  });

  it("greenery compares with that month's normal, starts in 2001 and can be switched off", () => {
    expect(vegetationNormal(karachi, 2)).toBeGreaterThan(0);
    const green = wx(karachi, 2023, 2);
    expect(green.green).toBeGreaterThan(0.5);
    expect(green.labels.map((l) => l.text)).toContain("Greener than usual");
    expect(wx(karachi, 1990, 2).green).toBe(0); // before the data begins
    expect(wx(karachi, 2023, 2, { showGreenery: false }).green).toBe(0);
  });

  it("switching every chip off, or having no data yet, shows no weather and no glow", () => {
    const off = weatherFor(getSnapshot(karachi, 2022, 6), { city: karachi, enabled: [], showGreenery: false });
    expect(off).toMatchObject({ clouds: 0, rain: 0, storm: false, quake: null, dry: 0, heat: 0, green: 0, labels: [], glow: [] });
    expect(weatherFor(null).labels).toEqual([]);
    expect(wx(karachi, 1981, 6).dry).toBe(0); // drought data starts in 1982
  });

  it("a few millimetres in a desert month never become a storm", () => {
    const snap = { year: 2000, month: 1, layers: { rainfall: { available: true, value: 6, percentile: 99 } } };
    const w = weatherFor(snap, { enabled: ALL });
    expect(w.storm).toBe(false);
    expect(w.rain).toBe(0);
    expect(w.clouds).toBeGreaterThan(0); // just a few clouds
    expect(T.stormMm).toBeGreaterThan(T.heavyMm);
  });

  it("every glow type used has a colour", () => {
    for (const y of [1981, 2005, 2022]) for (const m of [0, 6, 9]) for (const c of [karachi, quetta, islamabad])
      for (const g of wx(c, y, m).glow) expect(GLOW_COLORS[g.type]).toBeTruthy();
  });
});

describe("where the disc is on the screen", () => {
  const fakeMap = { project: ([lng, lat]) => ({ x: 500 + (lng - 67) * 1000, y: 400 - (lat - 24.86) * 600 }), getZoom: () => 9.2, getPitch: () => 54 };

  it("pixels per metre shrink as you zoom in, so the disc grows", () => {
    expect(metersPerPixel(25, 9)).toBeGreaterThan(metersPerPixel(25, 10));
    expect(metersPerPixel(25, 9.2)).toBeCloseTo(120, -1); // about 121 m per pixel at Karachi's city view
  });

  it("the raised top is a few tens of pixels above the base, more when more tilted", () => {
    const lift = liftPixels(24.86, 9.2, 54);
    expect(lift).toBeGreaterThan(20); expect(lift).toBeLessThan(40);
    expect(liftPixels(24.86, 9.2, 30)).toBeLessThan(lift);
    expect(liftPixels(24.86, 9.2, 0)).toBe(0);
  });

  it("finds the centre and size of the disc from four points on its edge", () => {
    const a = projectDisc(fakeMap, { lon: 67, lat: 24.86 }, 24);
    expect(a.cx).toBeCloseTo(500, 5); expect(a.cy).toBeCloseTo(400, 5);
    expect(a.rx).toBeGreaterThan(a.ry === 0 ? 0 : 0); expect(a.rx).toBeGreaterThan(0); expect(a.ry).toBeGreaterThan(0);
    expect(a.lift).toBeGreaterThan(0);
  });
});

describe("lightning is never rapid", () => {
  it("allows one flash, then none for 4 seconds", () => {
    const g = createFlashGovernor();
    expect(g.tryFlash(1000)).toBe(true);
    expect(g.tryFlash(1500)).toBe(false);
    expect(g.tryFlash(4999)).toBe(false);
    expect(g.tryFlash(1000 + MIN_FLASH_GAP_MS)).toBe(true);
    expect(MIN_FLASH_GAP_MS).toBeGreaterThanOrEqual(4000);
  });

  it("the wait between flashes is always at least 4 seconds", () => {
    expect(nextFlashDelay(() => 0)).toBeGreaterThanOrEqual(4000);
    for (let i = 0; i < 2000; i++) expect(nextFlashDelay()).toBeGreaterThanOrEqual(4000);
  });
});

describe("edge glow", () => {
  let host, root;
  const mount = async (el) => { host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host); await act(async () => root.render(el)); };
  afterEach(async () => { if (root) await act(async () => root.unmount()); host?.remove(); useFx.setState({ flash: 0, quake: 0 }); });

  it("pulses once per bar and a little faster with more tension or speed", () => {
    expect(beatSeconds(1, 0)).toBe(2.5);
    expect(beatSeconds(2, 0)).toBe(1.25);
    expect(beatSeconds(1, 1)).toBeLessThan(beatSeconds(1, 0));
  });

  it("lights each active condition by its strength and leaves the rest dark", async () => {
    await mount(<EdgeGlow glow={[{ type: "hot", strength: 0.7 }, { type: "rainLight", strength: 0.4 }]} beatSeconds={2.5} reduce={false} />);
    const layer = (t) => host.querySelector(`[data-type=${t}]`);
    expect(layer("hot").style.opacity).toBe("0.7");
    expect(layer("rainLight").style.opacity).toBe("0.4");
    expect(layer("drought").style.opacity).toBe("0");
    expect(host.querySelector(".edge").style.getPropertyValue("--beat")).toBe("2.50s");
  });

  it("flashes with lightning, but never when motion is reduced", async () => {
    useFx.setState({ flash: 3 });
    await mount(<EdgeGlow glow={[]} beatSeconds={2.5} reduce={false} />);
    expect(host.querySelector(".edge__flash")).not.toBeNull();
    await act(async () => root.render(<EdgeGlow glow={[]} beatSeconds={2.5} reduce />));
    expect(host.querySelector(".edge__flash")).toBeNull();
    expect(host.querySelector(".edge--still")).not.toBeNull();
  });
});

describe("weather on the disc", () => {
  let host, root;
  const city = { id: "karachi", name: "Karachi", lat: 24.86, lon: 67 };
  const fakeMap = { project: ([lng, lat]) => ({ x: 500 + (lng - 67) * 1000, y: 400 - (lat - 24.86) * 600 }), getZoom: () => 9.2, getPitch: () => 54, on: vi.fn(), off: vi.fn() };
  const storm = { clouds: 1, rain: 1, storm: true, quake: null, dry: 0, heat: 0, green: 0, labels: [{ kind: "storm", text: "Storm" }], glow: [] };
  // The layer places itself on the next animation frame, so wait until it has appeared
  const mount = async (el) => {
    host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host);
    await act(async () => root.render(el));
    for (let i = 0; i < 40 && !host.querySelector(".wx"); i++) await act(async () => { await new Promise((r) => setTimeout(r, 25)); });
    await act(async () => { await new Promise((r) => setTimeout(r, 25)); });
  };

  beforeEach(() => { vi.stubGlobal("requestAnimationFrame", (cb) => setTimeout(() => cb(performance.now()), 0)); vi.stubGlobal("cancelAnimationFrame", (id) => clearTimeout(id)); });
  afterEach(async () => { if (root) await act(async () => root.unmount()); host?.remove(); vi.unstubAllGlobals(); useFx.setState({ flash: 0, quake: 0 }); });

  it("puts the clouds, a word label and the storm on the disc", async () => {
    await mount(<WeatherLayer map={fakeMap} city={city} wx={storm} reduce />);
    expect(host.querySelector(".wx-clouds--in.wx-clouds--dark")).not.toBeNull();
    expect(host.querySelector(".wx-label--storm").textContent).toBe("Storm");
    expect(host.querySelector(".wx-rain")).not.toBeNull();
    expect(host.querySelector(".wx-bolt")).toBeNull(); // reduced motion: no lightning
  });

  it("an earthquake draws the cracks (and nothing when there was none)", async () => {
    const quake = { ...storm, storm: false, rain: 0, clouds: 0, quake: { magnitude: 7.6 }, labels: [{ kind: "quake", text: "Earthquake M7.6" }] };
    useFx.setState({ quake: 1, quakeMagnitude: 7.6 });
    await mount(<WeatherLayer map={fakeMap} city={city} wx={quake} reduce={false} />);
    expect(host.querySelectorAll(".wx-crack").length).toBeGreaterThan(8);
    expect(host.querySelector(".wx-label--quake").textContent).toContain("M7.6");
    await act(async () => root.render(<WeatherLayer map={fakeMap} city={city} wx={{ ...quake, quake: null, labels: [] }} reduce={false} />));
    expect(host.querySelector(".wx-crack")).toBeNull();
    expect(host.querySelector(".wx-labels")).toBeNull();
  });

  it("clouds leave when the rain stops", async () => {
    await mount(<WeatherLayer map={fakeMap} city={city} wx={storm} reduce={false} />);
    await act(async () => root.render(<WeatherLayer map={fakeMap} city={city} wx={{ ...storm, clouds: 0, rain: 0, storm: false, labels: [] }} reduce={false} />));
    expect(host.querySelector(".wx-clouds--out")).not.toBeNull();
    expect(host.querySelector(".wx-rain")).toBeNull();
  });
});
