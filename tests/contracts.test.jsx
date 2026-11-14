// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, it, expect, beforeEach } from "vitest";
import SlotHost from "../src/slots/SlotHost.jsx";
import { useWarnings } from "../src/slots/warnings.js";
import { createNullAudio, useAudioLog } from "../src/slots/NullAudio.js";
import { createAudio, integrationStatus } from "../src/integrations/resolve.js";
import { useSettings, DEFAULT_SETTINGS } from "../src/settings/index.js";
import {
  SLOT_NAMES, SAMPLE_PROPS, validateAudioEngine, testAudioEngine, validateSlotProps, validateClock, CLOCK_STATE, CLOCK_ACTIONS,
} from "../src/contracts/index.js";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function render(element) {
  const el = document.createElement("div");
  document.body.appendChild(el);
  const root = createRoot(el);
  act(() => root.render(element));
  return el;
}
const props = (name) => ({ ...SAMPLE_PROPS[name], reduceMotion: false });

beforeEach(() => { useWarnings.getState().clear(); useAudioLog.getState().clear(); });

describe("placeholders and SlotHost", () => {
  it.each(SLOT_NAMES)("renders %s as a placeholder with no warnings", (name) => {
    const el = render(<SlotHost name={name} {...props(name)} />);
    expect(el.textContent).toContain(name);
    expect(el.textContent).toContain("(placeholder)");
    expect(useWarnings.getState().warnings).toEqual([]);
  });

  it("prints the props as JSON so the UI team can see them", () => {
    const el = render(<SlotHost name="TensionMeter" {...props("TensionMeter")} />);
    expect(el.textContent).toContain('"tension": 0.3');
  });

  it("reports missing props in the box and in the warnings", () => {
    const el = render(<SlotHost name="TensionMeter" reduceMotion={false} />);
    expect(el.textContent).toContain('missing prop "tension"');
    expect(useWarnings.getState().warnings[0].message).toContain('missing prop "tension"');
    expect(validateSlotProps("Nope", {})[0]).toContain('unknown slot "Nope"');
  });

  it("uses a real component when given one", () => {
    const Real = ({ tension }) => <b>REAL {tension}</b>;
    const el = render(<SlotHost name="TensionMeter" override={Real} {...props("TensionMeter")} />);
    expect(el.textContent).toBe("REAL 0.3");
  });

  it("falls back to the placeholder when a component crashes", () => {
    const Crashy = () => { throw new Error("boom"); };
    const quiet = console.error; console.error = () => {}; // React logs the crash; keep test output clean
    const el = render(<SlotHost name="TensionMeter" override={Crashy} {...props("TensionMeter")} />);
    console.error = quiet;
    expect(el.textContent).toContain("(placeholder)");
    expect(useWarnings.getState().warnings.some((w) => w.message.includes("boom"))).toBe(true);
  });
});

describe("audio contract and NullAudio", () => {
  it("NullAudio satisfies the contract and logs every call", async () => {
    const engine = createNullAudio();
    expect(validateAudioEngine(engine)).toEqual([]);
    const results = await testAudioEngine(engine);
    expect(results.every((r) => r.ok)).toBe(true);
    const methods = useAudioLog.getState().calls.map((c) => c.method);
    expect(methods).toEqual(expect.arrayContaining(["start", "setMonth", "setPacing", "setMuted"]));
  });

  it("rejects an engine with a missing method, with a clear message", async () => {
    const bad = { start() {}, stop() {} };
    expect(validateAudioEngine(bad).join(" ")).toContain('required method "setMonth"');
    const results = await testAudioEngine({ ...createNullAudio(), setMode: () => { throw new Error("nope"); } });
    expect(results.find((r) => r.method === "setMode")).toMatchObject({ ok: false, error: "nope" });
  });

  it("createAudio() gives NullAudio while nothing is plugged in", () => {
    expect(createAudio().isNull).toBe(true);
    expect(Object.values(integrationStatus()).every((s) => s === "placeholder")).toBe(true);
  });
});

describe("settings and clock contract", () => {
  it("has the agreed defaults and toggles layers", () => {
    useSettings.getState().reset();
    expect(useSettings.getState().layers).toEqual(DEFAULT_SETTINGS.layers);
    useSettings.getState().toggleLayer("air");
    expect(useSettings.getState().layers).not.toContain("air");
    useSettings.getState().setLayers(["rainfall", "bogus"]);
    expect(useSettings.getState().layers).toEqual(["rainfall"]);
    useSettings.getState().reset();
  });

  it("validateClock finds missing parts", () => {
    expect(validateClock({}).length).toBeGreaterThan(5);
    const full = Object.fromEntries([...CLOCK_STATE.map((k) => [k, null]), ...CLOCK_ACTIONS.map((k) => [k, () => {}])]);
    expect(validateClock({ ...full, month: 5, mode: "month" })).toEqual([]);
    expect(validateClock({ ...full, month: 12, mode: "month" })[0]).toContain("month must be 0-11");
  });
});
