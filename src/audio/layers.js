// Tension layers (S6). tension 0..1 decides which instruments are audible (README 6.4):
//   0.0-0.2 drone + soft pad | 0.2 slow arpeggio | 0.4 organ-like pad, arp one octave up
//   0.6 strings, faster arpeggio, tense chord loop | 0.8 low pulse, brightest, most reverb
// Layers fade over one bar (2.5 s), never jump.
import * as Tone from "tone";
import { chordMidi, chordForBar, midiToHz, quantize } from "./scale.js";

const BAR = (60 / 96) * 4;
const clamp01 = (x) => Math.min(1, Math.max(0, x));
// 0 below `at`, rises smoothly to 1 over `width` above it
const gate = (t, at, width = 0.1) => clamp01((t - at) / width);

export function buildLayers(out, reverb) {
  // ---- instruments (all go into `out`, the reverb input) ----
  const padFilter = new Tone.Filter(500, "lowpass").connect(out);
  const padGain = new Tone.Gain(0).connect(padFilter);
  const pad = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "fattriangle", count: 2, spread: 10 },
    envelope: { attack: 1.5, decay: 0, sustain: 1, release: 3 },
    volume: -14,
  }).connect(padGain);

  const arpFilter = new Tone.Filter(1200, "lowpass").connect(out);
  const arpGain = new Tone.Gain(0).connect(arpFilter);
  const arp = new Tone.Synth({
    oscillator: { type: "triangle" },
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.4 },
    volume: -12,
  }).connect(arpGain);

  const stringsFilter = new Tone.Filter(1500, "lowpass").connect(out);
  const stringsGain = new Tone.Gain(0).connect(stringsFilter);
  const strings = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "fatsawtooth", count: 3, spread: 25 },
    envelope: { attack: 2.5, decay: 0, sustain: 1, release: 3 },
    volume: -20,
  }).connect(stringsGain);

  const pulseGain = new Tone.Gain(0).connect(out);
  const pulse = new Tone.MembraneSynth({
    pitchDecay: 0.05, octaves: 2,
    envelope: { attack: 0.001, decay: 0.5, sustain: 0, release: 0.5 },
    volume: -8,
  }).connect(pulseGain);

  // ---- state ----
  let tension = 0;
  let bar = 0;
  let step = 0;
  let chord = chordMidi("Am");
  const ids = [];

  // Apply tension: ramp every layer to its new level over one bar.
  function setTension(t) {
    tension = clamp01(t);
    const ramp = (param, v) => param.rampTo(v, BAR);
    ramp(padGain.gain, 0.35 + 0.35 * gate(tension, 0.4)); // soft pad always, louder "organ" from 0.4
    ramp(padFilter.frequency, 500 + 1200 * gate(tension, 0.4));
    ramp(arpGain.gain, 0.9 * gate(tension, 0.2));
    ramp(arpFilter.frequency, 900 + 5000 * tension); // brighter as tension grows
    ramp(stringsGain.gain, 0.8 * gate(tension, 0.6));
    ramp(stringsFilter.frequency, 800 + 3000 * tension);
    ramp(pulseGain.gain, 0.9 * gate(tension, 0.8));
    ramp(reverb.wet, 0.45 + 0.4 * gate(tension, 0.8, 0.2)); // biggest hall at the peak
  }

  const tense = () => tension >= 0.6;
  const arpOctave = () => (tension >= 0.4 ? 12 : 0);
  const arpEvery = () => (tension >= 0.6 ? 1 : 2); // 16 notes per bar vs 8 (steps are 16ths)

  // ---- schedule on the Transport (one bar = one month) ----
  ids.push(Tone.Transport.scheduleRepeat((time) => {
    if (bar % 3 === 0) { // new chord every 3 bars
      chord = chordMidi(chordForBar(bar, tense()));
      const len = BAR * 3 + 0.5;
      pad.triggerAttackRelease(chord.map((m) => midiToHz(m)), len, time);
      if (stringsGain.gain.value > 0.01) {
        strings.triggerAttackRelease(chord.map((m) => midiToHz(quantize(m + 12))), len, time);
      }
    }
    bar++;
  }, "1m"));

  ids.push(Tone.Transport.scheduleRepeat((time) => {
    const i = step++;
    if (arpGain.gain.value > 0.01 && i % arpEvery() === 0) {
      const pattern = [0, 1, 2, 1]; // up and back down through the chord
      const note = chord[pattern[Math.floor(i / arpEvery()) % 4] % chord.length];
      arp.triggerAttackRelease(midiToHz(quantize(note + arpOctave())), "16n", time);
    }
  }, "16n"));

  // pulse: low hit on every beat once tension is high (gain does the fading)
  ids.push(Tone.Transport.scheduleRepeat((time) => {
    if (pulseGain.gain.value > 0.01) pulse.triggerAttackRelease(midiToHz(quantize(33)), "8n", time); // A1
  }, "4n"));

  setTension(tension);

  return {
    setTension,
    reset() { // called on stop so the next start begins at bar 0
      bar = 0; step = 0; chord = chordMidi("Am");
      pad.releaseAll(); strings.releaseAll();
    },
  };
}
