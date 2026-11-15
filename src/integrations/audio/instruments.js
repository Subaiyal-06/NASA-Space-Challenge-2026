// Data instruments: every climate category has its OWN sound, so you can pick each one out by ear.
//   Heat       glassy FM bells (the "sun chimes"): cooler = fewer, lower, softer chimes; hotter = more, higher, brighter
//   Rain       soft sine "drops" (random scale notes) plus a gentle hiss
//   Drought    a dry, whistling wind plus a low rumble, and the whole mix closes in (dull and dry)
//   Earthquake a deep boom with a low string hit and a rumbling crack that small speakers can play
//   Haze       breathy white noise
// Each instrument also reports how active it is right now (activity()), for the visualiser.
import * as Tone from "tone";
import { quantize, midiToHz, inScale } from "./scale.js";

const BAR = (60 / 96) * 4;
const clamp01 = (x) => Math.min(1, Math.max(0, x));

// In-scale notes for the rain "drops": A minor between MIDI 72 and 88
const RAIN_NOTES = Array.from({ length: 17 }, (_, i) => 72 + i).filter(inScale);

export function buildInstruments(out, master, layers, { pan = 0, dry = null } = {}) {
  // everything goes through one stereo panner: city A sits in the middle, or on the left while comparing
  const bus = new Tone.Panner(pan).connect(out);
  // While comparing, a little of each city also goes straight to the speakers (not through the shared reverb),
  // so left and right stay clearly apart. Off (silent) when only one city is playing.
  const dryGain = new Tone.Gain(0);
  if (dry) { bus.connect(dryGain); dryGain.connect(dry); }

  // Heat: glassy FM bells
  const chime = new Tone.FMSynth({
    harmonicity: 3.01, modulationIndex: 9,
    oscillator: { type: "sine" }, modulation: { type: "sine" },
    envelope: { attack: 0.004, decay: 1.3, sustain: 0, release: 1.6 },
    modulationEnvelope: { attack: 0.002, decay: 0.5, sustain: 0, release: 0.5 },
    volume: -7,
  }).connect(bus);

  // Rain: random scale notes (soft sine "plucks") + a gentle hiss
  const rainSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "sine" },
    envelope: { attack: 0.005, decay: 0.6, sustain: 0, release: 1.2 },
    volume: -14,
  }).connect(bus);
  const rainNoiseGain = new Tone.Gain(0).connect(new Tone.Filter(4500, "bandpass").connect(bus));
  new Tone.Noise("pink").connect(rainNoiseGain).start();

  // Drought: a dry whistling wind (the filter slowly sweeps) plus a low rumble
  const windGain = new Tone.Gain(0).connect(bus);
  const wind = new Tone.AutoFilter({ frequency: 0.13, baseFrequency: 350, octaves: 2.2, filter: { type: "bandpass", Q: 3 } }).connect(windGain).start();
  new Tone.Noise("pink").connect(wind).start();
  const rumbleGain = new Tone.Gain(0).connect(new Tone.Filter(140, "lowpass").connect(bus));
  new Tone.Noise("brown").connect(rumbleGain).start();

  // Air / haze: breathy noise (white noise, band-passed)
  const hazeGain = new Tone.Gain(0).connect(new Tone.Filter(3000, "bandpass", -12).connect(bus));
  new Tone.Noise("white").connect(hazeGain).start();

  // Earthquake: deep boom + low string hit + a rumbling crack (mid-low noise, audible on small speakers)
  const boom = new Tone.MembraneSynth({
    pitchDecay: 0.12, octaves: 4,
    envelope: { attack: 0.001, decay: 1.6, sustain: 0, release: 1.5 },
    volume: -4,
  }).connect(bus);
  const lowString = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "fatsawtooth", count: 3, spread: 20 },
    envelope: { attack: 0.03, decay: 1.5, sustain: 0.2, release: 3 },
    volume: -12,
  }).connect(new Tone.Filter(350, "lowpass").connect(bus));
  const crack = new Tone.NoiseSynth({ noise: { type: "brown" }, envelope: { attack: 0.005, decay: 1.5, sustain: 0, release: 0.6 }, volume: -8 })
    .connect(new Tone.Filter(650, "lowpass").connect(bus));

  const ramp = (param, v) => param.rampTo(v, BAR);

  // ---- activity, for the visualiser: 0..1 per instrument ----
  const level = { rain: 0, drought: 0, haze: 0 }; // steady ones follow the data
  const hits = { heat: [], rain: [], quakes: [] }; // { t, v } one-off sounds, in audio-clock time
  const note = (kind, t, v) => { hits[kind].push({ t, v }); };
  function activity() {
    const now = Tone.now();
    const decayOf = { heat: 0.9, rain: 0.35, quakes: 2.2 };
    const res = { heat: 0, rain: level.rain * 0.25, drought: level.drought, quakes: 0, haze: level.haze };
    for (const kind of Object.keys(hits)) {
      hits[kind] = hits[kind].filter((h) => now - h.t < decayOf[kind] * 3);
      for (const h of hits[kind]) {
        const age = now - h.t;
        if (age >= 0) res[kind] = Math.max(res[kind], h.v * Math.exp(-age / decayOf[kind]));
      }
    }
    return res;
  }

  // values = output of computeMonthValues(); fire = true only when a new month starts
  function apply(v, fire) {
    ramp(rainNoiseGain.gain, v.rainLevel * 0.1); // quiet hiss: should sit under the notes, not sound like haze
    ramp(rumbleGain.gain, v.drought * 0.7);
    ramp(windGain.gain, v.drought * 0.16);
    ramp(hazeGain.gain, v.haze * 0.25);
    // drought and haze make the whole mix drier and darker (master low-pass closes)
    ramp(master.frequency, 16000 * (1 - 0.8 * v.drought) * (1 - 0.4 * v.haze));
    layers?.setBrightness(v.brightness);
    level.rain = v.rainLevel; level.drought = v.drought; level.haze = v.haze;

    if (!fire) return;
    const now = Tone.now() + 0.05;

    // Heat: chimes on the beat. Normal = one low chime; much hotter = three high bright ones; cooler = soft and low.
    if (v.heatOn) {
      const count = 1 + Math.round(clamp01(v.heat) * 2);
      const beats = [0, 1, 2, 3].sort(() => Math.random() - 0.5).slice(0, count).sort((a, b) => a - b);
      const base = quantize(74 + Math.round(v.heat * 9)); // cooler -> lower chimes, hotter -> higher
      beats.forEach((b, i) => {
        const t = now + (b * BAR) / 4;
        const midi = quantize(base + [0, 4, 7][i % 3] - (v.heat < -0.25 ? 12 : 0));
        const vel = 0.3 + 0.45 * Math.abs(v.heat);
        chime.triggerAttackRelease(midiToHz(midi), "8n", t, vel);
        note("heat", t, 0.5 + 0.5 * Math.abs(v.heat));
      });
    }

    // Rain notes: pick random free slots (16 per bar) so notes spread over the month
    const slots = [...Array(16).keys()].sort(() => Math.random() - 0.5).slice(0, Math.min(v.rainNotes, 16)).sort((a, b) => a - b);
    for (const s of slots) {
      const n = RAIN_NOTES[Math.floor(Math.random() * RAIN_NOTES.length)];
      const t = now + (s * BAR) / 16;
      rainSynth.triggerAttackRelease(midiToHz(n), "8n", t, 0.35 + 0.4 * v.rainLevel);
      note("rain", t, 0.4 + 0.6 * v.rainLevel);
    }

    if (v.quake) {
      const vel = clamp01((v.quake.magnitude - 4.5) / 3.5); // magnitude 4.5 -> quiet, 8 -> full
      const midi = quantize(36 - Math.round(vel * 12)); // bigger quake = deeper boom
      boom.triggerAttackRelease(midiToHz(midi), "2n", now, 0.4 + 0.6 * vel);
      lowString.triggerAttackRelease([midiToHz(quantize(33)), midiToHz(quantize(40))], "2n", now, 0.3 + 0.5 * vel);
      crack.triggerAttackRelease("2n", now, 0.4 + 0.6 * vel);
      note("quakes", now, 0.35 + 0.65 * vel);
    }
  }

  function silence() {
    [rainNoiseGain, rumbleGain, windGain, hazeGain].forEach((g) => g.gain.rampTo(0, 0.3));
    master.frequency.rampTo(16000, 0.3);
    level.rain = 0; level.drought = 0; level.haze = 0;
    hits.heat = []; hits.rain = []; hits.quakes = [];
  }

  return { apply, silence, activity, setPan(p) { bus.pan.rampTo(p, 0.6); }, setDry(v) { dryGain.gain.rampTo(v, 0.6); } };
}
