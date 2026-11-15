// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, it, expect, beforeAll, vi } from "vitest";
import { loadCity, getSnapshot } from "../src/data/api.js";
import { weatherFor } from "../src/studio/weather/rules.js";
import { describeMonth, spoken, worthAnnouncingWhilePlaying } from "../src/studio/ui/describe.js";
import AccessMenu, { SHORTCUTS } from "../src/studio/ui/AccessMenu.jsx";
import LiveDescription from "../src/studio/ui/LiveDescription.jsx";
import { useA11y } from "../src/studio/state.js";
import { useSettings } from "../src/settings/index.js";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const ALL = ["temperature", "rainfall", "drought", "quakes", "air"];

describe("month description in words", () => {
  let karachi, islamabad;
  beforeAll(async () => { [karachi, islamabad] = await Promise.all([loadCity("karachi"), loadCity("islamabad")]); });
  const text = (city, name, y, m) => { const snapshot = getSnapshot(city, y, m); return describeMonth({ cityName: name, snapshot, wx: weatherFor(snapshot, { city, enabled: ALL }), city, enabled: ALL, showGreenery: true }); };

  it("reads the July 2022 Karachi flood with spoken units and the music", () => {
    const t = text(karachi, "Karachi", 2022, 6);
    expect(t).toContain("Karachi, July 2022.");
    expect(t).toContain("A storm month: 401 millimetres".replace("millimetres", "mm")); // the headline keeps "mm"
    expect(t).toContain("Rain: 401 millimetres")
    expect(t).toContain("Earthquakes: none this month.")
    expect(t).toContain("33 percent greener than normal");
    expect(t).toMatch(/times a normal July/);
    expect(t).toMatch(/Heat: minus 0\.3 degrees Celsius/);
    expect(t).toContain("This is our own index");
    expect(t).toContain("What you hear:");
  });

  it("says the magnitude of the 2005 earthquake and that a layer has not started yet", () => {
    expect(text(islamabad, "Islamabad", 2005, 9)).toContain("magnitude 7.6");
    expect(text(karachi, "Karachi", 1981, 0)).toMatch(/Dry spells: data starts in 1982/);
  });

  it("spells numbers for a speech engine, and while music plays only notable months are announced", () => {
    expect(spoken("−2.5")).toBe("minus 2.5");
    expect(spoken("+1.0")).toBe("plus 1.0");
    expect(spoken("M7.6")).toBe("magnitude 7.6");
    expect(spoken("9× a normal July")).toBe("9 times a normal July");
    expect(worthAnnouncingWhilePlaying({ quake: { magnitude: 6 } }, 4)).toBe(true);
    expect(worthAnnouncingWhilePlaying({ rain: 0.1 }, 0)).toBe(true);   // every January
    expect(worthAnnouncingWhilePlaying({ rain: 0.1, dry: 0 }, 4)).toBe(false);
  });
});

describe("accessibility menu and live description", () => {
  let box, root;
  const mount = async (el) => { box = document.createElement("div"); document.body.appendChild(box); root = createRoot(box); await act(async () => root.render(el)); };
  const unmount = async () => { await act(async () => root.unmount()); box.remove(); };

  it("opens with switches that change the preferences, and lists the keyboard shortcuts", async () => {
    await mount(<AccessMenu description="Karachi, July 2022." />);
    await act(async () => { box.querySelector(".a11y__btn").click(); });
    const sw = [...box.querySelectorAll("[role=switch]")];
    expect(sw.map((b) => b.textContent)).toEqual(expect.arrayContaining([expect.stringContaining("Speak each month aloud"), expect.stringContaining("High contrast")]));
    const hc = sw.find((b) => b.textContent.includes("High contrast"));
    expect(hc.getAttribute("aria-checked")).toBe("false");
    await act(async () => { hc.click(); });
    expect(useA11y.getState().highContrast).toBe(true);
    const voice = sw.find((b) => b.textContent.includes("Speak each month"));
    await act(async () => { voice.click(); });
    expect(useSettings.getState().voiceAnnouncer).toBe(true);
    expect(box.textContent).toContain(SHORTCUTS[0][1]);
    await act(async () => { window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })); });
    expect(box.querySelector("#a11y-menu")).toBeNull();
    useA11y.getState().setHighContrast(false); useSettings.getState().setVoiceAnnouncer(false);
    await unmount();
  });

  it("the live region says the month after a short moment, but stays quiet for ordinary months while playing", async () => {
    vi.useFakeTimers();
    await mount(<LiveDescription text="Karachi, March 1990. Quiet." playing={false} wx={{}} month={2} enabled />);
    expect(box.querySelector("[aria-live=polite]").textContent).toBe("");
    await act(async () => { vi.advanceTimersByTime(800); });
    expect(box.querySelector("[aria-live=polite]").textContent).toContain("March 1990");
    await act(async () => root.render(<LiveDescription text="Karachi, April 1990. Quiet." playing wx={{ rain: 0 }} month={3} enabled />));
    await act(async () => { vi.advanceTimersByTime(2000); });
    expect(box.querySelector("[aria-live=polite]").textContent).toContain("March 1990"); // not replaced
    await act(async () => root.render(<LiveDescription text="Karachi, May 1990. Quake." playing wx={{ quake: { magnitude: 6 } }} month={4} enabled />));
    await act(async () => { vi.advanceTimersByTime(500); });
    expect(box.querySelector("[aria-live=polite]").textContent).toContain("May 1990");
    vi.useRealTimers();
    await unmount();
  });
});
