// Helpers that read the registry. Other code uses these instead of reading the registry directly.
import registry from "./index.js";
import { SLOT_NAMES, validateAudioEngine, validateSlotComponent } from "../contracts/index.js";
import { createNullAudio } from "../slots/NullAudio.js";
import { reportWarning } from "../slots/warnings.js";

/** The plugged-in component for a slot, or null (use the placeholder). Bad modules are reported and ignored. */
export function getSlotComponent(name) {
  const C = registry.ui?.[name];
  if (!C) return null;
  const problems = validateSlotComponent(name, C);
  if (problems.length) { problems.forEach((p) => reportWarning(name, p)); return null; }
  return C;
}

/** Creates the audio engine: the real module if plugged in and valid, otherwise NullAudio. */
export function createAudio() {
  const factory = registry.audio;
  if (!factory) return createNullAudio();
  try {
    const engine = factory();
    const problems = validateAudioEngine(engine);
    if (problems.length) throw new Error(problems.join("; "));
    return engine;
  } catch (e) {
    reportWarning("audio", `Audio module rejected, using NullAudio: ${e.message}`);
    return createNullAudio();
  }
}

/** For the dev panel: which slots and audio are real and which are placeholders. */
export function integrationStatus() {
  const status = { audio: registry.audio ? "real" : "placeholder" };
  for (const n of SLOT_NAMES) status[n] = registry.ui?.[n] ? "real" : "placeholder";
  return status;
}
