// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, it, expect, beforeEach } from "vitest";
import DevPanel from "../src/dev/DevPanel.jsx";
import { runSlotContract, runAllSlotContracts, runAudioContract } from "../src/dev/contractTests.jsx";
import { createNullAudio } from "../src/slots/NullAudio.js";
import { SLOT_NAMES } from "../src/contracts/index.js";
import { useWarnings } from "../src/slots/warnings.js";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
beforeEach(() => useWarnings.getState().clear());

describe("contract tests", () => {
  it("all 11 slots pass as placeholders", () => {
    const results = runAllSlotContracts();
    expect(results).toHaveLength(SLOT_NAMES.length);
    expect(results.every((r) => r.ok && r.status === "placeholder")).toBe(true);
  });

  it("a good component passes and is reported as real", () => {
    const Good = ({ tension }) => <b>tension {tension}</b>;
    expect(runSlotContract("TensionMeter", Good)).toMatchObject({ slot: "TensionMeter", status: "real", ok: true });
  });

  it("a component that crashes on the sample props fails with a clear message", () => {
    const Crashy = () => { throw new Error("boom"); };
    const quiet = console.error; console.error = () => {};
    const r = runSlotContract("Legend", Crashy);
    console.error = quiet;
    expect(r.ok).toBe(false);
    expect(r.problems.join(" ")).toContain("crashed while rendering");
  });

  it("audio: the real music module and the placeholder both pass; an engine missing a method fails clearly", async () => {
    expect(await runAudioContract()).toMatchObject({ ok: true, status: "real" });
    expect(await runAudioContract(createNullAudio())).toMatchObject({ ok: true, status: "placeholder" });
    const bad = { ...createNullAudio(), setPacing: undefined };
    const r = await runAudioContract(bad);
    expect(r.ok).toBe(false);
    expect(r.problems.join(" ")).toContain('"setPacing"');
  });
});

describe("DevPanel", () => {
  it("renders its sections, runs the contract tests and shows PASS", async () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    const root = createRoot(el);
    await act(async () => { root.render(<DevPanel />); });
    expect(el.textContent).toContain("Integration status");
    expect(el.textContent).toContain("Clock controls");
    expect(el.textContent).toContain("Audio call log");
    const button = [...el.querySelectorAll("button")].find((b) => b.textContent === "Run contract tests");
    await act(async () => { button.click(); });
    expect(el.textContent).toContain("Audio (real): PASS");
    expect(el.textContent).toContain("Clock contract: PASS");
    expect(el.textContent).not.toContain("FAIL");
    await act(async () => { root.unmount(); });
  });
});
