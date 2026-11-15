// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, it, expect, beforeAll, vi } from "vitest";
import { loadCity, getSnapshot, getCityList } from "../src/data/api.js";
import { weatherFor } from "../src/studio/weather/rules.js";
import CompareCard from "../src/studio/ui/CompareCard.jsx";
import CompareControl from "../src/studio/ui/CompareControl.jsx";
import EdgeGlow from "../src/studio/weather/EdgeGlow.jsx";

const core = { start: vi.fn(), stop: vi.fn(), setMuted: vi.fn(), setTension: vi.fn(), setSkipping: vi.fn(), applyMonth: vi.fn(), getLevels: vi.fn() };
vi.mock("../src/integrations/audio/core.js", () => ({ buildCore: async () => core }));
vi.mock("tone", () => ({ start: async () => {} }));
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const ALL = ["temperature", "rainfall", "drought", "quakes", "air"];

describe("the music engine in compare mode", () => {
  let karachi, lahore;
  beforeAll(async () => { [karachi, lahore] = await Promise.all([loadCity("karachi"), loadCity("lahore")]); });
  it("passes the second city's sounds on, and only while comparing", async () => {
    const { default: createAudioEngine } = await import("../src/integrations/audio/index.js");
    const engine = createAudioEngine();
    await engine.start();
    const payload = { year: 2022, month: 6, mode: "month", tension: 0.3, interest: 0.2, snapshotA: getSnapshot(karachi, 2022, 6), snapshotB: getSnapshot(lahore, 2022, 6) };
    core.applyMonth.mockClear();
    engine.setMonth(payload);
    const [a, , b] = core.applyMonth.mock.calls.at(-1);
    expect(a.rainLevel).toBeGreaterThan(0.5);   // Karachi's flood
    expect(b).toMatchObject({ rainLevel: expect.any(Number) }); // Lahore on the right
    engine.setMonth({ ...payload, snapshotB: null });
    expect(core.applyMonth.mock.calls.at(-1)[2]).toBeNull();
  });
});

describe("compare UI", () => {
  let karachi, lahore, root, box;
  beforeAll(async () => { [karachi, lahore] = await Promise.all([loadCity("karachi"), loadCity("lahore")]); });
  const mount = async (el) => { box = document.createElement("div"); document.body.appendChild(box); root = createRoot(box); await act(async () => root.render(el)); };
  const unmount = async () => { await act(async () => root.unmount()); box.remove(); };

  it("the card shows both cities with their ears and a plain 'since' sentence", async () => {
    const mk = (id, name, city) => { const snapshot = getSnapshot(city, 2022, 6); return { id, name, city, snapshot, wx: weatherFor(snapshot, { city, enabled: ALL }) }; };
    await mount(<CompareCard a={mk("karachi", "Karachi", karachi)} b={mk("lahore", "Lahore", lahore)} year={2022} month={6} enabled={ALL} showGreenery onClear={() => {}} />);
    expect(box.textContent).toContain("Karachi");
    expect(box.textContent).toContain("Lahore");
    expect(box.textContent).toContain("left ear");
    expect(box.textContent).toContain("right ear");
    expect(box.textContent).toMatch(/Since 1981|Comparing/);
    expect(box.querySelectorAll(".cmp__row").length).toBeGreaterThan(2);
    await unmount();
  });

  it("the Compare pill lists the other cities, calls back, and shows 'vs' once chosen", async () => {
    const cities = getCityList(); const picked = [];
    await mount(<CompareControl cities={cities} cityId="karachi" cityBId={null} onPick={(id) => picked.push(id)} onClear={() => {}} />);
    await act(async () => { box.querySelector("button").click(); });
    const items = [...box.querySelectorAll("[role=menuitem]")];
    expect(items.map((b) => b.textContent)).not.toContain(cities.find((c) => c.id === "karachi").name);
    await act(async () => { items[0].click(); });
    expect(picked).toHaveLength(1);
    await unmount();
    await mount(<CompareControl cities={cities} cityId="karachi" cityBId="lahore" onPick={() => {}} onClear={() => {}} />);
    expect(box.textContent).toMatch(/vs Lahore/);
    await unmount();
  });

  it("the edge glow can be limited to one side", async () => {
    await mount(<EdgeGlow glow={[]} beatSeconds={2.5} reduce={false} side="right" />);
    expect(box.querySelector(".edge--right")).not.toBeNull();
    await unmount();
  });
});
