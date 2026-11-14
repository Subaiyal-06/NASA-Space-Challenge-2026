// APP FLOW, SCREEN NAVIGATION & AUDIO BRIDGE (Steps C8 & C9)
import { create } from "zustand";
import { useClock } from "../state/clock.js";
import { useSettings } from "../settings/index.js";
import { createAudio } from "../integrations/resolve.js";
import createAudioEngine from "../integrations/audio/index.js";
import { getSnapshot, loadCity } from "../data/api.js";
import { getLoadedCity } from "../data/loader.js";
import { announceMonth } from "./announcer.js";

let audioEngine = null;

function createHybridAudioEngine() {
  const base = createAudio();
  if (!base.isNull) return base;
  const real = createAudioEngine();
  return {
    ...real,
    start(...args) {
      base.start?.(...args);
      return real.start(...args);
    },
    stop(...args) {
      base.stop?.(...args);
      return real.stop(...args);
    },
    setMonth(...args) {
      base.setMonth?.(...args);
      return real.setMonth(...args);
    },
    setLayers(...args) {
      base.setLayers?.(...args);
      return real.setLayers(...args);
    },
    setMode(...args) {
      base.setMode?.(...args);
      return real.setMode(...args);
    },
    setPacing(...args) {
      base.setPacing?.(...args);
      return real.setPacing(...args);
    },
    setMuted(...args) {
      base.setMuted?.(...args);
      return real.setMuted(...args);
    },
  };
}

export function getAudioEngine() {
  if (!audioEngine) {
    audioEngine = createHybridAudioEngine();
  }
  return audioEngine;
}

export function resetAudioEngine() {
  audioEngine = createHybridAudioEngine();
  return audioEngine;
}

export const useAppFlow = create((set, get) => ({
  screen: "intro", // "intro" | "player" | "compare"
  activeStory: null,
  activeBadge: null,
  compareStartYear: 1981,
  audioStarted: false,

  setScreen: (screen) => {
    if (!["intro", "player", "compare"].includes(screen)) return;
    set({ screen });
  },

  startExperience: async (initialCityId = "karachi") => {
    const engine = getAudioEngine();
    await loadCity(initialCityId);
    await useClock.getState().selectCity(initialCityId, "A");
    try {
      await engine.start();
    } catch {
      // ignore audio context error in headless environments
    }
    set({ screen: "player", audioStarted: true });
    syncAudioToClock();
  },

  returnToIntro: () => {
    useClock.getState().pause();
    try {
      getAudioEngine().stop();
    } catch {}
    set({ screen: "intro", audioStarted: false });
  },

  openCompare: async (secondCityId = "lahore") => {
    if (secondCityId) {
      await loadCity(secondCityId);
      await useClock.getState().selectCity(secondCityId, "B");
    }
    set({ screen: "compare" });
    syncAudioToClock();
  },

  closeCompare: async () => {
    await useClock.getState().selectCity(null, "B");
    set({ screen: "player" });
    syncAudioToClock();
  },

  setCompareStartYear: (year) => {
    set({ compareStartYear: Math.max(1981, Number(year) || 1981) });
  },

  setActiveStory: (story) => set({ activeStory: story }),
  closeStory: () => set({ activeStory: null }),
  setActiveBadge: (badge) => set({ activeBadge: badge }),
}));

/**
 * Feeds the current clock state and plain data snapshots into the audio engine (Contract 3.4).
 */
export function syncAudioToClock() {
  const engine = getAudioEngine();
  const c = useClock.getState();
  const settings = useSettings.getState();
  const activeScenario = c.futureEnabled ? c.scenario : undefined;

  const cityAObj = getLoadedCity(c.cityA);
  const cityBObj = c.cityB ? getLoadedCity(c.cityB) : null;

  const snapshotA = cityAObj ? getSnapshot(cityAObj, c.year, c.month, activeScenario) : null;
  const snapshotB = cityBObj ? getSnapshot(cityBObj, c.year, c.month, activeScenario) : null;

  if (snapshotA) {
    engine.setMonth({
      year: c.year,
      month: c.month,
      mode: c.mode,
      tension: c.tension,
      interest: c.interest,
      snapshotA,
      snapshotB,
    });
  }

  engine.setLayers(c.layers);
  engine.setMode(c.mode);
  engine.setPacing(c.pacing);
  engine.setMuted(settings.muted);

  if (settings.voiceAnnouncer && snapshotA) {
    announceMonth(c.cityA, c.year, c.month, snapshotA, true);
  }
}

let bridgeUnsubscribers = [];

/**
 * Wires clock events and settings changes to the audio engine and active story/badge state.
 */
export function initAppBridge() {
  for (const unsub of bridgeUnsubscribers) unsub();
  bridgeUnsubscribers = [];

  bridgeUnsubscribers.push(
    useClock.on("tick", () => {
      syncAudioToClock();
    })
  );

  bridgeUnsubscribers.push(
    useClock.on("pacing", ({ pacing }) => {
      getAudioEngine().setPacing(pacing);
    })
  );

  bridgeUnsubscribers.push(
    useClock.on("story", (story) => {
      useAppFlow.getState().setActiveStory(story);
    })
  );

  bridgeUnsubscribers.push(
    useClock.on("badge", (badge) => {
      useAppFlow.getState().setActiveBadge(badge);
    })
  );

  bridgeUnsubscribers.push(
    useClock.subscribe((state, prevState) => {
      if (state.playing !== prevState.playing) {
        const engine = getAudioEngine();
        if (state.playing) {
          Promise.resolve(engine.start()).catch(() => {});
          syncAudioToClock();
        } else {
          try {
            engine.stop();
          } catch {}
        }
      }
    })
  );

  bridgeUnsubscribers.push(
    useSettings.subscribe((s) => {
      getAudioEngine().setMuted(s.muted);
      useClock.getState().setLayers(s.layers);
    })
  );

  return () => {
    for (const unsub of bridgeUnsubscribers) unsub();
    bridgeUnsubscribers = [];
  };
}
