// Data instruments (S7): rain notes + rain noise, quake boom, drought rumble, haze noise.
// Temperature brightness and drought/haze muffling are applied through `layers` and `master`.
import * as Tone from "tone";
import { quantize, midiToHz, inScale } from "./scale.js";

const BAR = (60 / 96) * 4;
const clamp01 = (x) => Math.min(1, Math.max(0, x));

// In-scale notes for the rain "drops": A minor between MIDI 72 and 88
const RAIN_NOTES = Array.from({ length: 17 }, (_, i) => 72 + i).filter(inScale);

export function buildInstruments(out, master, layers) {
  // Rain: random scale notes (soft sine "plucks") + a gentle hiss
  const rainSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "sine" },
    envelope: { attack: 0.005, decay: 0.6, sustain: 0, release: 1.2 },
    volume: -14,
  }).connect(out);
  const rainNoiseGain = new Tone.Gain(0).connect(new Tone.Filter(4500, "bandpass").connect(out));
  new Tone.Noise("pink").connect(rainNoiseGain).start();

  // Drought: low rumble (brown noise, low-passed)
  const rumbleGain = new Tone.Gain(0).connect(new Tone.Filter(140, "lowpass").connect(out));
  new Tone.Noise("brown").connect(rumbleGain).start();

  // Air / haze: breathy noise (white noise, band-passed)
  const hazeGain = new Tone.Gain(0).connect(new Tone.Filter(3000, "bandpass", -12).connect(out));
  new Tone.Noise("white").connect(hazeGain).start();

  // Earthquake: deep boom + low string hit
  const boom = new Tone.MembraneSynth({
    pitchDecay: 0.12, octaves: 4,
    envelope: { attack: 0.001, decay: 1.6, sustain: 0, release: 1.5 },
    volume: -4,
  }).connect(out);
  const lowString = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "fatsawtooth", count: 3, spread: 20 },
    envelope: { attack: 0.03, decay: 1.5, sustain: 0.2, release: 3 },
    volume: -12,
  }).connect(new Tone.Filter(350, "lowpass").connect(out));

  const ramp = (param, v) => param.rampTo(v, BAR);

  // values = output of computeMonthValues(); fire = true only when a new month starts
  function apply(v, fire) {
    ramp(rainNoiseGain.gain, v.rainLevel * 0.1); // quiet hiss: should sit under the notes, not sound like haze
    ramp(rumbleGain.gain, v.drought * 0.7);
    ramp(hazeGain.gain, v.haze * 0.25);
    // drought and haze make the whole mix drier and darker (master low-pass closes)
    ramp(master.frequency, 16000 * (1 - 0.8 * v.drought) * (1 - 0.4 * v.haze));
    layers?.setBrightness(v.brightness);

    if (!fire) return;
    const now = Tone.now() + 0.05;
    // Rain notes: pick random free slots (16 per bar) so notes spread over the month
    const slots = [...Array(16).keys()].sort(() => Math.random() - 0.5).slice(0, Math.min(v.rainNotes, 16)).sort((a, b) => a - b);
    for (const s of slots) {
      const note = RAIN_NOTES[Math.floor(Math.random() * RAIN_NOTES.length)];
      rainSynth.triggerAttackRelease(midiToHz(note), "8n", now + (s * BAR) / 16, 0.35 + 0.4 * v.rainLevel);
    }
    if (v.quake) {
      const vel = clamp01((v.quake.mag - 4) / 4); // magnitude 4 -> quiet, 8 -> full
      const midi = quantize(36 - Math.round(vel * 12)); // bigger quake = deeper boom
      boom.triggerAttackRelease(midiToHz(midi), "2n", now, 0.4 + 0.6 * vel);
      lowString.triggerAttackRelease([midiToHz(quantize(33)), midiToHz(quantize(40))], "2n", now, 0.3 + 0.5 * vel);
    }
  }

  function silence() {
    [rainNoiseGain, rumbleGain, hazeGain].forEach((g) => g.gain.rampTo(0, 0.3));
    master.frequency.rampTo(16000, 0.3);
  }

  return { apply, silence };
}
