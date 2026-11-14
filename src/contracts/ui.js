// UI SLOT CONTRACT: UI teammates deliver pure React components (default export), one per slot.
// A slot receives ONLY props. Our connectors fill them. Every slot also receives { reduceMotion }.
// Styling and animation are entirely the UI team's job.

/** Required props per slot. A prop may be null, but the key must be present. Props starting with "on" must be functions. */
export const SLOT_PROPS = {
  GlobeIntro: ["cities", "onStart", "onSelectCity"],
  Timeline: ["year", "month", "startYear", "endYear", "mode", "playing", "speed", "pacing", "markers",
    "onToggle", "onStep", "onSeek", "onLeap", "onModeChange", "onSpeedChange"],
  WeatherLayer: ["cityId", "selected", "year", "month", "conditions", "ghost"], // conditions = { heatAnomaly, rainPercentile, spi, aod, quake|null }
  AmbientGlow: ["states", "side", "beatPhase"], // states = [{ type, strength }], side = "both"|"left"|"right"
  Charts: ["series", "year", "month", "layers", "mode"],
  TensionMeter: ["tension", "interest"],
  LayerToggles: ["layers", "onToggle"], // layers = [{ id, label, available, reason, enabled }]
  StoryCard: ["story", "onClose"],
  BadgeToast: ["badge"],
  CompareView: ["cityA", "cityB", "summary", "changeSince", "startYear", "onStartYearChange"],
  Legend: ["layers", "explanation"],
};
export const SLOT_NAMES = Object.keys(SLOT_PROPS);

const noop = () => {};
const markers = { stories: [], badges: [] };
const cond = { heatAnomaly: 0.8, rainPercentile: 55, spi: -0.4, aod: 0.2, quake: null };
const layerList = ["temperature", "rainfall", "drought", "quakes", "air"].map((id) => ({
  id, label: id, available: true, reason: null, enabled: true,
}));

/** Example props for every slot. Shown by placeholders and used by the contract test. */
export const SAMPLE_PROPS = {
  GlobeIntro: { cities: [{ id: "karachi", name: "Karachi", lat: 24.86, lon: 67 }], onStart: noop, onSelectCity: noop },
  Timeline: { year: 1981, month: 5, startYear: 1900, endYear: 2025, mode: "month", playing: false, speed: 1, pacing: "normal",
    markers, onToggle: noop, onStep: noop, onSeek: noop, onLeap: noop, onModeChange: noop, onSpeedChange: noop },
  WeatherLayer: { cityId: "karachi", selected: true, year: 1981, month: 5, conditions: cond, ghost: null },
  AmbientGlow: { states: [{ type: "hot", strength: 0.6 }], side: "both", beatPhase: 0 },
  Charts: { series: { temperature: [{ year: 1981, month: 5, value: 0.4 }] }, year: 1981, month: 5, layers: ["temperature"], mode: "month" },
  TensionMeter: { tension: 0.3, interest: 0.2 },
  LayerToggles: { layers: layerList, onToggle: noop },
  StoryCard: { story: null, onClose: noop },
  BadgeToast: { badge: null },
  CompareView: { cityA: "karachi", cityB: "lahore", summary: "", changeSince: {}, startYear: 1981, onStartYearChange: noop },
  Legend: { layers: layerList, explanation: "" },
};

/** Checks the props a connector is about to pass. Returns a list of problems (empty = OK). */
export function validateSlotProps(name, props) {
  const required = SLOT_PROPS[name];
  if (!required) return [`ui: unknown slot "${name}". Known slots: ${SLOT_NAMES.join(", ")}`];
  const problems = [];
  for (const key of required) {
    if (!(key in props)) problems.push(`ui ${name}: missing prop "${key}"`);
    else if (/^on[A-Z]/.test(key) && typeof props[key] !== "function") problems.push(`ui ${name}: prop "${key}" must be a function`);
  }
  if (!("reduceMotion" in props)) problems.push(`ui ${name}: missing prop "reduceMotion"`);
  return problems;
}

/** Checks that a delivered component is usable (a function component or a class). */
export function validateSlotComponent(name, Component) {
  if (!SLOT_PROPS[name]) return [`ui: unknown slot "${name}"`];
  if (typeof Component !== "function" && !(Component && typeof Component === "object" && Component.$$typeof)) {
    return [`ui ${name}: the module must default-export a React component`];
  }
  return [];
}
