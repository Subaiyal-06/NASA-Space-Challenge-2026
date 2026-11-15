// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, it, expect } from "vitest";
import AboutSound, { SOUND_ROWS, DATA_SOURCES, TENSION_STEPS } from "../src/studio/ui/AboutSound.jsx";
import { LANES } from "../src/studio/ui/Visualizer.jsx";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("How it sounds page", () => {
  it("describes every instrument the visualiser shows, with the same sound names", () => {
    for (const lane of LANES.filter((l) => l.key !== "haze")) expect(SOUND_ROWS.some((r) => r.sound.toLowerCase() === lane.sound.toLowerCase())).toBe(true);
    expect(TENSION_STEPS).toHaveLength(5);
  });

  it("is honest about sources: USGS is not NASA, drought and climate stress are ours", () => {
    const all = DATA_SOURCES.map(([k, v]) => `${k} ${v}`).join(" ");
    expect(all).toContain("not NASA");
    expect(all).toMatch(/Computed by us/);
    expect(all).toMatch(/Our own index/);
    expect(all).not.toMatch(/air quality|haze/i); // we have no air-quality data, so we do not claim it
  });

  it("opens as a dialog, moves focus into it, and Escape closes it and returns focus", async () => {
    const box = document.createElement("div"); document.body.appendChild(box);
    const root = createRoot(box);
    await act(async () => root.render(<AboutSound />));
    const opener = box.querySelector(".about__btn");
    await act(async () => { opener.focus(); opener.click(); });
    const dialog = box.querySelector("[role=dialog]");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.textContent).toContain("Where the data comes from");
    expect(document.activeElement.textContent).toBe("Close");
    await act(async () => { window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })); });
    expect(box.querySelector("[role=dialog]")).toBeNull();
    expect(document.activeElement).toBe(opener);
    await act(async () => root.unmount()); box.remove();
  });
});
