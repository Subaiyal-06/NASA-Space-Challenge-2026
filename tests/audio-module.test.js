import { describe, it, expect, beforeAll } from "vitest";
import { quantize, inScale, chordMidi, CALM_LOOP, TENSE_LOOP, chordForBar } from "../src/integrations/audio/scale.js";
import { computeMonthValues, rainLevel, ALL_LAYERS } from "../src/integrations/audio/mapping.js";
import createAudioEngine from "../src/integrations/audio/index.js";
import { validateAudioEngine, SAMPLE_AUDIO_PAYLOAD } from "../src/contracts/audio.js";
import { loadCity, getSnapshot } from "../src/data/api.js";

describe("the music stays in A minor", () => {
  it("every note is forced onto the scale", () => {
    for (let m = 20; m < 110; m++) expect(inScale(quantize(m))).toBe(true);
    expect(quantize(69)).toBe(69); // A4 stays A4
    expect(quantize(70)).not.toBe(70); // A# moves onto the scale
  });

  it("every chord in both loops uses only scale notes (the tense E chord is voiced E-G-B)", () => {
    for (const name of [...CALM_LOOP, ...TENSE_LOOP]) for (const base of [45, 57, 69]) chordMidi(name, base).forEach((n) => expect(inScale(n)).toBe(true));
  });

  it("one chord per three months, four chords a year", () => {
    expect([0, 3, 6, 9, 12].map((b) => chordForBar(b, false))).toEqual(["Am", "F", "C", "G", "Am"]);
    expect([0, 3, 6, 9, 12].map((b) => chordForBar(b, true))).toEqual(["Am", "F", "Dm", "E", "Am"]);
  });
});

describe("data becomes sound (compared to normal, never raw values)", () => {
  let karachi;
  beforeAll(async () => { karachi = await loadCity("karachi"); });

  it("rain level: normal is gentle, very wet is full, under 1 mm is silent", () => {
    expect(rainLevel(50, 40)).toBeCloseTo(0.3, 5);
    expect(rainLevel(99, 300)).toBe(1);
    expect(rainLevel(80, 0.4)).toBe(0); // a dry month stays quiet
    expect(rainLevel(5, 10)).toBe(0.0); // much drier than normal
    expect(rainLevel(null, 10)).toBe(0);
  });

  it("the July 2022 flood sounds very different from a dry July", () => {
    const flood = computeMonthValues(getSnapshot(karachi, 2022, 6));
    const dry = computeMonthValues(getSnapshot(karachi, 1987, 6));
    expect(flood.rainLevel).toBeGreaterThan(0.9);
    expect(flood.rainNotes).toBeGreaterThanOrEqual(11);
    expect(flood.rainNotes).toBeGreaterThan(dry.rainNotes + 4);
  });

  it("layers that have not started, or are switched off, stay silent (the orchestra grows)", () => {
    const early = computeMonthValues(getSnapshot(karachi, 1981, 6));
    expect(early.drought).toBe(0); // drought data starts in 1982
    expect(computeMonthValues(getSnapshot(karachi, 2022, 6), ["temperature"]).rainNotes).toBe(0);
    expect(computeMonthValues(getSnapshot(karachi, 2022, 6), []).brightness).toBe(0);
    expect(computeMonthValues(null)).toMatchObject({ rainLevel: 0, drought: 0, haze: 0, quake: null });
  });

  it("drought darkens the sound, heat brightens it, and a real earthquake booms", async () => {
    const quetta = await loadCity("quetta");
    const dry = computeMonthValues(getSnapshot(quetta, 2000, 3)); // Quetta's drought years
    expect(dry.drought).toBeGreaterThan(0.3);
    const hot = computeMonthValues({ layers: { temperature: { available: true, anomaly: 2.4 } } });
    const cold = computeMonthValues({ layers: { temperature: { available: true, anomaly: -2.4 } } });
    expect(hot.brightness).toBe(1);
    expect(cold.brightness).toBe(-1);
    const islamabad = await loadCity("islamabad");
    const quake = computeMonthValues(getSnapshot(islamabad, 2005, 9)); // the 2005 Kashmir earthquake
    expect(quake.quake.magnitude).toBe(7.6);
    expect(computeMonthValues(getSnapshot(islamabad, 2005, 9), ALL_LAYERS.filter((l) => l !== "quakes")).quake).toBeNull();
  });
});

describe("the music module follows the audio contract", () => {
  it("has every required method and is safe to call before any sound has started", () => {
    const engine = createAudioEngine();
    expect(validateAudioEngine(engine)).toEqual([]);
    expect(() => {
      engine.setMonth(SAMPLE_AUDIO_PAYLOAD);
      engine.setLayers(ALL_LAYERS);
      engine.setMode("story");
      engine.setPacing("skipping");
      engine.setMuted(true);
      engine.setTension(0.6);
      engine.setCity({ city: "x" });
      engine.setCompare(null);
      engine.stop();
      engine.dispose();
    }).not.toThrow();
    expect(engine.getLevels()).toBeNull(); // no sound yet, so nothing for the visualizer
  });

  it("start() never throws on a computer that cannot play audio (it warns and stays silent)", async () => {
    const engine = createAudioEngine();
    const quiet = console.warn; console.warn = () => {};
    const result = await Promise.race([engine.start().then(() => "done"), new Promise((r) => setTimeout(() => r("hung"), 8000))]);
    console.warn = quiet;
    expect(result).toBe("done");
    expect(engine.getLevels()).toBeNull();
  }, 15000);
});
