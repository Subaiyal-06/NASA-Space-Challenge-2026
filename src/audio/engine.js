// Music engine core (S5): musical clock + drone -> reverb -> limiter -> speakers.
// One bar = 4 beats at 96 BPM = 2.5 seconds = one month in the app.
import * as Tone from "tone";
import { buildLayers } from "./layers.js";
import { buildInstruments } from "./instruments.js";

export const BPM = 96;
export const BEATS_PER_BAR = 4;
export const BAR_SECONDS = (60 / BPM) * BEATS_PER_BAR; // 2.5

let built = false;
let running = false;
let nodes = {}; // reverb, limiter, drone ...
let layers = null;
let instruments = null;
let pending = null; // latest month values, applied when the engine is (re)started
let tension = 0;
const barListeners = new Set();

async function build() {
  if (built) return;
  // Signal chain (right to left): drone -> filter -> reverb -> limiter -> destination
  const limiter = new Tone.Limiter(-3).toDestination(); // never harshly loud
  // Master low-pass: closes with drought and haze (dry, muffled sound). Sits after the reverb.
  const master = new Tone.Filter(16000, "lowpass").connect(limiter);
  const reverb = new Tone.Reverb({ decay: 7, wet: 0.45 }).connect(master);
  await reverb.ready; // reverb builds its echo tail asynchronously
  const droneFilter = new Tone.Filter(400, "lowpass").connect(reverb);
  const drone = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "fatsawtooth", count: 3, spread: 18 },
    envelope: { attack: 4, decay: 0, sustain: 1, release: 4 },
    volume: -16,
  }).connect(droneFilter);

  Tone.Transport.bpm.value = BPM;
  Tone.Transport.timeSignature = BEATS_PER_BAR;
  // Fires once per bar (= once per month). Later steps hook music changes in here.
  Tone.Transport.scheduleRepeat((time) => {
    barListeners.forEach((fn) => fn(time));
  }, "1m");

  layers = buildLayers(reverb, reverb); // pad, arpeggio, strings, pulse (S6)
  layers.setTension(tension);
  instruments = buildInstruments(reverb, master, layers); // data instruments (S7)
  if (pending) instruments.apply(pending, false);

  nodes = { limiter, reverb, master, droneFilter, drone };
  built = true;
}

// Tension 0..1. Safe to call before start(); it is applied when the engine is built.
export function setEngineTension(x) {
  tension = Math.min(1, Math.max(0, x));
  layers?.setTension(tension);
  nodes.droneFilter?.frequency.rampTo(350 + 900 * tension, BAR_SECONDS); // drone gets brighter too
}

// Data for the current month (from mapping.js). fire = a new month started: play one-off sounds
// (rain notes, quake boom). Safe before start(): the latest values are applied when the engine starts.
export function applyMonthValues(v, fire = false) {
  pending = v;
  instruments?.apply(v, fire && running);
}

// Must be called from a user click (browsers block audio until then).
export async function startEngine() {
  await Tone.start();
  await build();
  if (running) return;
  nodes.drone.triggerAttack(["A1", "E2"]); // A and its fifth: both in the A minor scale
  Tone.Transport.start();
  running = true;
  if (pending) instruments?.apply(pending, false);
}

export function stopEngine() {
  if (!built || !running) return;
  nodes.drone.releaseAll();
  Tone.Transport.stop();
  layers?.reset();
  instruments?.silence();
  running = false;
}

export const isRunning = () => running;
export const getNodes = () => nodes;
// Subscribe to the "new bar" beat. Returns an unsubscribe function.
export function onBar(fn) {
  barListeners.add(fn);
  return () => barListeners.delete(fn);
}
export const getBar = () => Math.floor(Tone.Transport.seconds / BAR_SECONDS);
