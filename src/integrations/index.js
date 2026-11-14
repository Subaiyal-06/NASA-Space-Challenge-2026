// THE REGISTRY: the ONLY place that decides which teammate modules are plugged in.
// Nobody imports teammates' code anywhere else. null = use the placeholder.
//
// To plug in the music module (put it in src/integrations/audio/):
//   import createAudioEngine from "./audio/index.js";
//   ...  audio: createAudioEngine,
// To plug in a UI component (put it in src/integrations/ui/), one slot at a time:
//   import Timeline from "./ui/Timeline.jsx";
//   ...  ui: { ..., Timeline, ... }
// If something breaks, set that one line back to null and the app works again.

export default {
  audio: null, // createAudioEngine factory, or null for NullAudio
  ui: {
    GlobeIntro: null,
    Timeline: null,
    WeatherLayer: null,
    AmbientGlow: null,
    Charts: null,
    TensionMeter: null,
    LayerToggles: null,
    StoryCard: null,
    BadgeToast: null,
    CompareView: null,
    Legend: null,
  },
};
