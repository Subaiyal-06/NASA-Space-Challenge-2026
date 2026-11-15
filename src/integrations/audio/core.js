// The sound itself (Tone.js). Built only when the listener presses Start, so Tone is not even loaded before that.
//   one bar = 4 beats at 96 BPM = 2.5 seconds = one month
//   signal chain: layers + instruments -> reverb -> master low-pass (drought, haze) -> limiter -> speakers
import * as Tone from "tone";
import { buildLayers } from "./layers.js";
import { buildInstruments } from "./instruments.js";

export const BPM = 96;
export const BEATS_PER_BAR = 4;
export const BAR_SECONDS = (60 / BPM) * BEATS_PER_BAR; // 2.5
export const FFT_BINS = 64;
export const WAVE_POINTS = 128;

/** Builds every sound node. Returns the controls. Call after a user click. */
export async function buildCore() {
  const limiter = new Tone.Limiter(-3).toDestination(); // never harshly loud
  const fft = new Tone.Analyser({ type: "fft", size: FFT_BINS, smoothing: 0.75 });
  const wave = new Tone.Analyser({ type: "waveform", size: WAVE_POINTS });
  limiter.connect(fft);
  limiter.connect(wave);
  const master = new Tone.Filter(16000, "lowpass").connect(limiter); // closes with drought and haze
  const reverb = new Tone.Reverb({ decay: 7, wet: 0.45 }).connect(master);
  await reverb.ready; // the reverb builds its echo tail asynchronously
  const droneFilter = new Tone.Filter(400, "lowpass").connect(reverb);
  const drone = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "fatsawtooth", count: 3, spread: 18 },
    envelope: { attack: 4, decay: 0, sustain: 1, release: 4 },
    volume: -16,
  }).connect(droneFilter);

  Tone.Transport.bpm.value = BPM;
  Tone.Transport.timeSignature = BEATS_PER_BAR;

  const layers = buildLayers(reverb, reverb); // pad, arpeggio, strings, pulse
  const instruments = buildInstruments(reverb, master, layers); // rain, quake, drought, haze, heat

  let running = false;
  let token = 0; // so a quick stop-then-start is never undone by the old stop's timer
  const destination = Tone.getDestination();

  return {
    get running() { return running; },

    start() {
      token++;
      destination.volume.cancelScheduledValues(Tone.now());
      destination.volume.value = 0;
      if (running) return;
      drone.triggerAttack(["A1", "E2"]); // A and its fifth: both in the A minor scale
      Tone.Transport.start();
      running = true;
    },

    // Fade out quickly, then silence everything
    stop() {
      if (!running) return;
      running = false;
      const mine = ++token;
      destination.volume.rampTo(-60, 0.4);
      setTimeout(() => {
        if (mine !== token) return; // started again in the meantime
        drone.releaseAll();
        Tone.Transport.stop();
        layers.reset();
        instruments.silence();
        destination.volume.value = 0;
      }, 450);
    },

    setTension(x) {
      const t = Math.min(1, Math.max(0, x));
      layers.setTension(t);
      droneFilter.frequency.rampTo(350 + 900 * t, BAR_SECONDS); // the drone gets brighter too
    },
    // values come from mapping.js; fire = a new month started, so play the one-off sounds (rain notes, quake boom)
    applyMonth(values, fire) { instruments.apply(values, fire && running); },
    setSkipping(on) { layers.setSkipping(on); },
    setMuted(muted) { destination.mute = !!muted; },

    /** { frequency: 0..1 per bin (low to high), waveform: -1..1 } for the visualizer. */
    getLevels() {
      const f = fft.getValue();
      const frequency = Array.from(f, (db) => Math.min(1, Math.max(0, (db + 92) / 62))); // -92 dB (silent) .. -30 dB (loud)
      const waveform = Array.from(wave.getValue());
      return { frequency, waveform };
    },

    dispose() {
      this.stop();
      [limiter, fft, wave, master, reverb, droneFilter, drone].forEach((n) => n.dispose?.());
    },
  };
}
