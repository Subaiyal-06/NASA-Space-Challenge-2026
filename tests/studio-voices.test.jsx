// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, it, expect, beforeAll } from "vitest";
import { loadCity, getSnapshot } from "../src/data/api.js";
import { computeMonthValues } from "../src/integrations/audio/mapping.js";
import Visualizer, { lanesFor, LANES } from "../src/studio/ui/Visualizer.jsx";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.ResizeObserver ??= class { observe() {} disconnect() {} };
const ALL = ["temperature", "rainfall", "drought", "quakes", "air"];

describe("every category has its own instrument", () => {
  let karachi;
  beforeAll(async () => { karachi = await loadCity("karachi"); });

  it("heat now has its own voice: cooler plays low and soft, hotter plays more and higher", () => {
    const hot = computeMonthValues({ layers: { temperature: { available: true, anomaly: 2 } } }, ALL);
    const cool = computeMonthValues({ layers: { temperature: { available: true, anomaly: -2 } } }, ALL);
    expect(hot).toMatchObject({ heatOn: true, heat: 1 });
    expect(cool).toMatchObject({ heatOn: true, heat: -1 });
    expect(computeMonthValues({ layers: {} }, ALL).heatOn).toBe(false);
    expect(computeMonthValues({ layers: { temperature: { available: true, anomaly: 2 } } }, ["rainfall"]).heatOn).toBe(false); // chip off = silent
  });

  it("the visualiser has one lane per instrument the city has and the listener switched on", () => {
    expect(LANES.map((l) => l.key)).toEqual(["heat", "rain", "drought", "quakes", "haze"]);
    const keys = lanesFor(karachi, ALL).map((l) => l.key);
    expect(keys).toEqual(expect.arrayContaining(["heat", "rain", "drought", "quakes"]));
    expect(lanesFor(karachi, ["rainfall"]).map((l) => l.key)).toEqual(["rain"]);
    expect(lanesFor(null, ALL)).toEqual([]);
  });

  it("the visualiser names each instrument in words and still renders with no sound engine running", async () => {
    const box = document.createElement("div"); document.body.appendChild(box);
    const root = createRoot(box);
    await act(async () => root.render(<div className="studio"><Visualizer reduce city={karachi} /></div>));
    expect(box.textContent).toContain("Sound of the data");
    for (const word of ["glass chimes", "rain drops", "dry wind", "deep boom"]) expect(box.textContent).toContain(word);
    await act(async () => root.unmount()); box.remove();
  });

  it("a small earthquake counts in Karachi (its floor is magnitude 5) with the Karachi 2013 quake still there", () => {
    const s = getSnapshot(karachi, 2013, 8);
    expect(s.layers.quakes.some((q) => q.magnitude === 7.7)).toBe(true);
  });
});
