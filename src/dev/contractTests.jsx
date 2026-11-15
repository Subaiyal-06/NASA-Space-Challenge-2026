// CONTRACT TESTS for plugged-in modules. Used by the dev panel (/dev) and by the unit tests.
// Slot test: render the slot with its sample props and see whether it survives.
// Audio test: call every audio method once with sample data.
import React from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import SlotHost from "../slots/SlotHost.jsx";
import { getSlotComponent, createAudio } from "../integrations/resolve.js";
import { SLOT_NAMES, SAMPLE_PROPS, validateSlotProps, validateAudioEngine, testAudioEngine } from "../contracts/index.js";

/** Tests one slot. `override` tries a specific component without changing the registry. */
export function runSlotContract(name, override) {
  const props = { ...SAMPLE_PROPS[name], reduceMotion: false };
  const real = override ?? getSlotComponent(name);
  const problems = validateSlotProps(name, props); // our own sample props must be valid

  const host = document.createElement("div");
  const root = createRoot(host);
  try {
    flushSync(() => root.render(<SlotHost name={name} override={override} {...props} />));
    // A real component that crashed is swapped for the placeholder, which carries a data-slot attribute.
    if (real && host.querySelector("[data-slot]")) problems.push("crashed while rendering with the sample props (placeholder shown instead; see Warnings)");
    if (!host.textContent && !host.children.length) problems.push("rendered nothing");
  } catch (e) {
    problems.push(`threw while rendering: ${e?.message ?? e}`);
  } finally {
    flushSync(() => root.unmount());
  }
  return { slot: name, status: real ? "real" : "placeholder", ok: problems.length === 0, problems };
}

export function runAllSlotContracts() {
  return SLOT_NAMES.map((n) => runSlotContract(n));
}

/** Tests the audio engine the app would use right now (the real module if plugged in, else NullAudio). */
export async function runAudioContract(engine = createAudio()) {
  const problems = validateAudioEngine(engine);
  const calls = problems.length ? [] : await testAudioEngine(engine);
  const failed = calls.filter((c) => !c.ok);
  return {
    status: engine.isNull ? "placeholder" : "real",
    ok: problems.length === 0 && failed.length === 0,
    problems: [...problems, ...failed.map((c) => `${c.method}: ${c.error}`)],
    calls,
  };
}
