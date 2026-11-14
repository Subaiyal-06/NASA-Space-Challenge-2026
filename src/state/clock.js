// GLOBAL CLOCK STORE (Contract 3.3 + Step C6 Pacing & Calm Events)
import { create } from "zustand";
import { loadCity, getRange, getSnapshot } from "../data/api.js";
import { getLoadedCity } from "../data/loader.js";
import { MONTH_SECONDS, CLOCK_EVENTS } from "../contracts/clock.js";
import { LAYER_IDS } from "../contracts/audio.js";
import { computePacing, getCalmStreak, isGhostCalmEligible } from "./pacing.js";

const listeners = new Map(CLOCK_EVENTS.map((e) => [e, new Set()]));

export function emitClockEvent(event, payload) {
  const set = listeners.get(event);
  if (set) for (const fn of set) fn(payload);
}

export function onClockEvent(event, fn) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(fn);
  return () => listeners.get(event)?.delete(fn);
}

export function clearClockListeners() {
  for (const set of listeners.values()) set.clear();
}

let timerId = null;

function clearTimer() {
  if (timerId !== null) {
    clearTimeout(timerId);
    timerId = null;
  }
}

function safeRange(cityId, scenario, futureEnabled) {
  if (!cityId || !getLoadedCity(cityId)) {
    return { startYear: 1981, endYear: 2024, layerStartYears: {} };
  }
  try {
    return getRange(cityId, futureEnabled ? scenario : undefined);
  } catch {
    return { startYear: 1981, endYear: 2024, layerStartYears: {} };
  }
}

function safeMetrics(cityId, year, month, scenario, futureEnabled) {
  if (!cityId || !getLoadedCity(cityId)) {
    return { tension: 0, interest: 0, snapshot: null };
  }
  try {
    const snap = getSnapshot(cityId, year, month, futureEnabled ? scenario : undefined);
    return { tension: snap.tension ?? 0, interest: snap.interest ?? 0, snapshot: snap };
  } catch {
    return { tension: 0, interest: 0, snapshot: null };
  }
}

function getStepIntervalMs(state) {
  const speed = state.speed || 1;
  if (state.mode === "year") {
    return 2000 / speed;
  }
  if (state.mode === "story" && state.pacing === "skipping") {
    return 1000 / speed;
  }
  return (MONTH_SECONDS * 1000) / speed;
}

function scheduleNextTick(store) {
  clearTimer();
  const state = store.getState();
  if (!state.playing) return;
  const ms = getStepIntervalMs(state);
  timerId = setTimeout(() => {
    const cur = store.getState();
    if (!cur.playing) return;
    if (cur.mode === "year") {
      cur.leap(1);
    } else {
      cur.stepMonth(1);
    }
    if (store.getState().playing) {
      scheduleNextTick(store);
    }
  }, ms);
}

function applyPlayheadUpdate(set, get, year, month, extra = {}) {
  const s = get();
  const cityId = extra.cityA ?? s.cityA;
  const mode = extra.mode ?? s.mode;
  const scenario = extra.scenario ?? s.scenario;
  const futureEnabled = extra.futureEnabled ?? s.futureEnabled;
  const activeScenario = futureEnabled ? scenario : undefined;

  const { tension, interest } = safeMetrics(cityId, year, month, scenario, futureEnabled);
  const nextPacing = computePacing(mode, cityId, year, month, activeScenario);
  const prevPacing = s.pacing;

  set({
    ...extra,
    year,
    month,
    tension,
    interest,
    pacing: nextPacing,
  });

  if (prevPacing !== nextPacing) {
    emitClockEvent("pacing", { pacing: nextPacing, year, month });
  }

  const calmInfo = getCalmStreak(cityId, year, month, activeScenario);
  if (calmInfo.streakEndingHere >= 2) {
    emitClockEvent("calm", {
      year,
      month,
      streak: calmInfo.streakEndingHere,
      ghostEligible: isGhostCalmEligible(cityId, year, month, activeScenario),
    });
  }

  emitClockEvent("tick", { year, month, mode, tension, interest, pacing: nextPacing });
}

export const useClock = create((set, get) => {
  const store = {
    // --- STATE ---
    year: 1981,
    month: 0, // 0-11
    mode: "month", // "month" | "year" | "story"
    playing: false,
    speed: 1, // 1 | 2 | 4
    pacing: "normal", // "normal" | "skipping"
    tension: 0,
    interest: 0,
    cityA: "karachi",
    cityB: null,
    scenario: "ssp245",
    futureEnabled: false,
    layers: [...LAYER_IDS],

    // --- ACTIONS ---
    play: () => {
      if (get().playing) return;
      set({ playing: true });
      scheduleNextTick({ getState: get });
    },

    pause: () => {
      clearTimer();
      set({ playing: false });
    },

    toggle: () => {
      if (get().playing) get().pause();
      else get().play();
    },

    stepMonth: (dir = 1) => {
      const s = get();
      const { startYear, endYear } = safeRange(s.cityA, s.scenario, s.futureEnabled);
      let totalMonths = s.year * 12 + s.month + dir;
      const minMonths = startYear * 12;
      const maxMonths = endYear * 12 + 11;

      if (totalMonths >= maxMonths) {
        totalMonths = maxMonths;
        if (s.playing && dir > 0) {
          clearTimer();
          set({ playing: false });
        }
      } else if (totalMonths < minMonths) {
        totalMonths = minMonths;
      }

      const year = Math.floor(totalMonths / 12);
      const month = ((totalMonths % 12) + 12) % 12;
      applyPlayheadUpdate(set, get, year, month);
    },

    setYear: (y) => {
      const s = get();
      const { startYear, endYear } = safeRange(s.cityA, s.scenario, s.futureEnabled);
      const year = Math.min(endYear, Math.max(startYear, Number(y)));
      applyPlayheadUpdate(set, get, year, s.month);
    },

    setMonth: (m) => {
      const s = get();
      const month = Math.min(11, Math.max(0, Number(m)));
      applyPlayheadUpdate(set, get, s.year, month);
    },

    seek: (y, m = 0) => {
      const s = get();
      const { startYear, endYear } = safeRange(s.cityA, s.scenario, s.futureEnabled);
      const year = Math.min(endYear, Math.max(startYear, Number(y)));
      const month = Math.min(11, Math.max(0, Number(m)));
      applyPlayheadUpdate(set, get, year, month);
    },

    leap: (years) => {
      const s = get();
      const { startYear, endYear } = safeRange(s.cityA, s.scenario, s.futureEnabled);
      let targetYear = s.year + Number(years);
      if (targetYear >= endYear) {
        targetYear = endYear;
        if (s.playing && years > 0) {
          clearTimer();
          set({ playing: false });
        }
      } else if (targetYear < startYear) {
        targetYear = startYear;
      }
      applyPlayheadUpdate(set, get, targetYear, s.month);
    },

    setMode: (mode) => {
      if (!["month", "year", "story"].includes(mode)) return;
      const s = get();
      const prev = s.mode;
      const activeScenario = s.futureEnabled ? s.scenario : undefined;
      const nextPacing = computePacing(mode, s.cityA, s.year, s.month, activeScenario);
      const prevPacing = s.pacing;
      set({ mode, pacing: nextPacing });
      if (prevPacing !== nextPacing) {
        emitClockEvent("pacing", { pacing: nextPacing, year: s.year, month: s.month });
      }
      if (prev !== mode && get().playing) {
        scheduleNextTick({ getState: get });
      }
    },

    setSpeed: (speed) => {
      if (![1, 2, 4].includes(speed)) return;
      set({ speed });
      if (get().playing) {
        scheduleNextTick({ getState: get });
      }
    },

    selectCity: async (id, slot = "A") => {
      const key = slot === "B" ? "cityB" : "cityA";
      if (!id) {
        if (key === "cityB") {
          set({ cityB: null });
          emitClockEvent("cityChange", { slot: "B", cityId: null });
        }
        return;
      }
      await loadCity(id);
      const s = get();
      if (key === "cityA") {
        const { startYear, endYear } = safeRange(id, s.scenario, s.futureEnabled);
        const year = Math.min(endYear, Math.max(startYear, s.year));
        applyPlayheadUpdate(set, get, year, s.month, { cityA: id });
      } else {
        set({ cityB: id });
      }
      emitClockEvent("cityChange", { slot, cityId: id });
    },

    setLayers: (layers) => {
      const valid = Array.isArray(layers) ? layers.filter((l) => LAYER_IDS.includes(l)) : [];
      set({ layers: valid });
    },

    setScenario: (scenario) => {
      const s = get();
      applyPlayheadUpdate(set, get, s.year, s.month, { scenario });
    },

    setFutureEnabled: (futureEnabled) => {
      const s = get();
      const enabled = !!futureEnabled;
      const { startYear, endYear } = safeRange(s.cityA, s.scenario, enabled);
      const year = Math.min(endYear, Math.max(startYear, s.year));
      applyPlayheadUpdate(set, get, year, s.month, { futureEnabled: enabled });
    },

    setPacing: (pacing) => {
      if (!["normal", "skipping"].includes(pacing)) return;
      const prev = get().pacing;
      if (prev === pacing) return;
      set({ pacing });
      emitClockEvent("pacing", { pacing, year: get().year, month: get().month });
      if (get().playing) {
        scheduleNextTick({ getState: get });
      }
    },
  };

  return store;
});

useClock.on = onClockEvent;
useClock.emit = emitClockEvent;
useClock.clearListeners = clearClockListeners;

export default useClock;
