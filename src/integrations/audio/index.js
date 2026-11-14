/**
 * EARTH JUKEBOX — Music Engine (Contract-compliant factory)
 * =========================================================
 * Interstellar-style climate sonification in A minor, 96 BPM (2.5 s per bar = 1 month).
 * Zero external library dependencies (uses native Web Audio API directly so it works
 * offline and in Vite/Electron without needing extra npm packages).
 *
 * Implements the Audio Contract (`createAudioEngine()`):
 *   Required: start, stop, setMonth, setLayers, setMode, setPacing, setMuted
 *   Optional: setCity, setCompare, setTension, dispose
 *
 * Fixes applied:
 *  1. Fixed invalid note `'G3#'` -> `'G#3'` in E major tense chord
 *  2. `stop()` properly stops the bar scheduler and continuous oscillators/noise (on pause & screen exit)
 *  3. Eliminated double-triggering between the bar loop and `setMonth()`
 *  4. Real stereo compare mode: City A panned left (-0.75) and City B panned right (+0.75)
 *  5. Safe headless/JSDOM fallback when `AudioContext` is absent
 */

const BAR_MS = 2500; // 96 BPM, 4/4 -> 1 bar = 2.5s = 1 month

const CHORDS = {
  Am: ["A3", "C4", "E4"],
  F: ["F3", "A3", "C4"],
  C: ["C3", "E3", "G3"],
  G: ["G3", "B3", "D4"],
  Dm: ["D3", "F3", "A3"],
  E: ["E3", "G#3", "B3"], // Fixed from 'G3#' to valid 'G#3'
};

const CALM_LOOP = ["Am", "F", "C", "G"];
const TENSE_LOOP = ["Am", "F", "Dm", "E"];

const NOTE_SEMITONES = {
  C: 0, "C#": 1, D: 2, "D#": 3, E: 4, F: 5,
  "F#": 6, G: 7, "G#": 8, A: 9, "A#": 10, B: 11,
};

export function noteToFreq(note) {
  const m = String(note).match(/^([A-G]#?)(\d+)$/);
  if (!m) return 220;
  const semi = NOTE_SEMITONES[m[1]] ?? 9;
  const oct = parseInt(m[2], 10);
  const midi = (oct + 1) * 12 + semi;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function chordForMonth(month, tense) {
  const m = Math.max(0, Math.min(11, Number(month) || 0));
  const loop = tense ? TENSE_LOOP : CALM_LOOP;
  return CHORDS[loop[Math.floor(m / 3) % 4]];
}

export function transposeOctave(note, n) {
  const match = String(note).match(/^([A-G]#?)(\d+)$/);
  if (!match) return note;
  const octave = parseInt(match[2], 10) + n;
  if (octave < 0 || octave > 8) return note;
  return `${match[1]}${octave}`;
}

function lerp(a, b, t) {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

function getAudioContextClass() {
  if (typeof window === "undefined") return null;
  return window.AudioContext || window.webkitAudioContext || null;
}

export default function createAudioEngine() {
  let ctx = null;
  let started = false;
  let muted = false;
  let mode = "month";
  let pacing = "normal";
  let enabledLayers = new Set(["temperature", "rainfall", "drought", "quakes", "air"]);

  let currentYear = 1981;
  let currentMonth = 0;
  let currentTension = 0;
  let currentInterest = 0;
  let snapshotA = null;
  let snapshotB = null;
  let prevQuakeKeyA = null;
  let prevQuakeKeyB = null;
  let barIntervalId = null;

  // Persistent Web Audio graph nodes
  let graph = null;

  function createNoiseBuffer(audioCtx, pink = false) {
    const bufferSize = audioCtx.sampleRate * 2;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const out = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (pink) {
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        out[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.05;
        b6 = white * 0.115926;
      } else {
        out[i] = white * 0.25;
      }
    }
    return buffer;
  }

  function ensureGraph() {
    if (graph && ctx) return graph;
    const AudioCtx = getAudioContextClass();
    if (!AudioCtx) return null;

    try {
      ctx = new AudioCtx();
    } catch {
      return null;
    }

    const masterGain = ctx.createGain();
    masterGain.gain.value = muted ? 0 : 0.45;
    masterGain.connect(ctx.destination);

    // Stereo panners: panA (City A: left -0.75 in compare mode, 0 otherwise), panB (City B: right +0.75)
    const panA = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain();
    const panB = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain();
    if (panA.pan) panA.pan.value = 0;
    if (panB.pan) panB.pan.value = 0.75;
    panA.connect(masterGain);
    panB.connect(masterGain);

    // 1. Continuous Drone (A2 / A1)
    const droneOsc = ctx.createOscillator();
    droneOsc.type = "sine";
    droneOsc.frequency.value = noteToFreq("A2");
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.08;
    droneOsc.connect(droneGain);
    droneGain.connect(panA);
    droneOsc.start();

    // 2. Continuous Drought Sub-Rumble (A1)
    const droughtOsc = ctx.createOscillator();
    droughtOsc.type = "triangle";
    droughtOsc.frequency.value = noteToFreq("A1");
    const droughtFilter = ctx.createBiquadFilter();
    droughtFilter.type = "lowpass";
    droughtFilter.frequency.value = 85;
    const droughtGain = ctx.createGain();
    droughtGain.gain.value = 0;
    droughtOsc.connect(droughtFilter);
    droughtFilter.connect(droughtGain);
    droughtGain.connect(panA);
    droughtOsc.start();

    // 3. Continuous Rain Noise (A & B)
    const whiteBuf = createNoiseBuffer(ctx, false);
    const rainSourceA = ctx.createBufferSource();
    rainSourceA.buffer = whiteBuf;
    rainSourceA.loop = true;
    const rainFilterA = ctx.createBiquadFilter();
    rainFilterA.type = "bandpass";
    rainFilterA.frequency.value = 600;
    const rainGainA = ctx.createGain();
    rainGainA.gain.value = 0;
    rainSourceA.connect(rainFilterA);
    rainFilterA.connect(rainGainA);
    rainGainA.connect(panA);
    rainSourceA.start();

    const rainSourceB = ctx.createBufferSource();
    rainSourceB.buffer = whiteBuf;
    rainSourceB.loop = true;
    const rainFilterB = ctx.createBiquadFilter();
    rainFilterB.type = "bandpass";
    rainFilterB.frequency.value = 700;
    const rainGainB = ctx.createGain();
    rainGainB.gain.value = 0;
    rainSourceB.connect(rainFilterB);
    rainFilterB.connect(rainGainB);
    rainGainB.connect(panB);
    rainSourceB.start();

    // 4. Continuous Air Haze Pink Noise
    const pinkBuf = createNoiseBuffer(ctx, true);
    const airSource = ctx.createBufferSource();
    airSource.buffer = pinkBuf;
    airSource.loop = true;
    const airFilter = ctx.createBiquadFilter();
    airFilter.type = "bandpass";
    airFilter.frequency.value = 550;
    const airGain = ctx.createGain();
    airGain.gain.value = 0;
    airSource.connect(airFilter);
    airFilter.connect(airGain);
    airGain.connect(panA);
    airSource.start();

    graph = {
      masterGain,
      panA,
      panB,
      droneOsc,
      droneGain,
      droughtOsc,
      droughtFilter,
      droughtGain,
      rainFilterA,
      rainGainA,
      rainFilterB,
      rainGainB,
      airFilter,
      airGain,
    };
    return graph;
  }

  function playVoice({ freq, type = "triangle", dest, startTime, duration, peakGain = 0.06, cutoff = 1600 }) {
    if (!ctx || !dest) return;
    try {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(cutoff, startTime);

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(peakGain, startTime + Math.min(0.08, duration * 0.25));
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.02);
    } catch {}
  }

  function playQuakeBoom(mag = 6.0, dest) {
    if (!ctx || !dest) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      const startFreq = lerp(95, 55, Math.min(1, (mag - 4.5) / 3.5));
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(24, now + 1.4);

      const peak = lerp(0.12, 0.35, Math.min(1, (mag - 4.5) / 3.5));
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(peak, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 1.65);
    } catch {}
  }

  function onBar() {
    if (!started || !ctx || !graph) return;
    const now = ctx.currentTime;
    const t = currentTension;
    const tense = t >= 0.6;
    const chord = chordForMonth(currentMonth, tense);
    const skipping = pacing === "skipping";
    const isComparing = Boolean(snapshotB);

    if (graph.panA.pan) graph.panA.pan.setTargetAtTime(isComparing ? -0.75 : 0, now, 0.15);
    if (graph.panB.pan) graph.panB.pan.setTargetAtTime(0.75, now, 0.15);

    // 1. Drone pitch & level
    const droneNote = skipping ? "A3" : tense ? "A1" : "A2";
    graph.droneOsc.frequency.setTargetAtTime(noteToFreq(droneNote), now, 0.5);
    graph.droneGain.gain.setTargetAtTime(lerp(0.05, 0.16, t), now, 0.4);

    if (skipping) return;

    const tempA = snapshotA?.layers?.temperature?.anomaly ?? 0;
    const cutoffA = lerp(700, 2600, Math.max(0, Math.min(1, (tempA + 1) / 3.5)));

    // 2. Organ Pad Chords (tension >= 0.2)
    if (t >= 0.2 && enabledLayers.has("temperature")) {
      const padPeak = lerp(0.02, 0.065, (t - 0.2) / 0.8);
      chord.forEach((note) => {
        playVoice({
          freq: noteToFreq(note),
          type: "triangle",
          dest: graph.panA,
          startTime: now + 0.02,
          duration: 2.2,
          peakGain: padPeak,
          cutoff: cutoffA,
        });
      });
    }

    // 3. Plucked Arpeggio (City A on panA, and City B on panB if comparing)
    if (t >= 0.2) {
      const notesPerBar = t >= 0.6 ? 16 : 8;
      const stepSec = (BAR_MS / 1000) / notesPerBar;
      const octA = tempA >= 0.8 ? 1 : 0;
      const arpNotesA = [...chord, ...chord.map((n) => transposeOctave(n, octA))];
      const arpPeakA = lerp(0.025, 0.08, (t - 0.2) / 0.8);

      for (let i = 0; i < notesPerBar; i++) {
        const note = arpNotesA[i % arpNotesA.length];
        playVoice({
          freq: noteToFreq(note),
          type: "triangle",
          dest: graph.panA,
          startTime: now + i * stepSec,
          duration: stepSec * 0.85,
          peakGain: arpPeakA,
          cutoff: cutoffA,
        });
      }

      if (isComparing && snapshotB) {
        const tB = snapshotB.tension ?? t;
        const tempB = snapshotB?.layers?.temperature?.anomaly ?? 0;
        const octB = tempB >= 0.8 ? 1 : 0;
        const cutoffB = lerp(700, 2600, Math.max(0, Math.min(1, (tempB + 1) / 3.5)));
        const arpNotesB = [...chord.map((n) => transposeOctave(n, octB))].reverse();
        const arpPeakB = lerp(0.025, 0.08, Math.max(0, (tB - 0.15) / 0.85));

        for (let i = 0; i < notesPerBar; i++) {
          const note = arpNotesB[i % arpNotesB.length];
          playVoice({
            freq: noteToFreq(note),
            type: "sine",
            dest: graph.panB,
            startTime: now + i * stepSec + stepSec * 0.5,
            duration: stepSec * 0.85,
            peakGain: arpPeakB,
            cutoff: cutoffB,
          });
        }
      }
    }

    // 4. Strings Swell (tension >= 0.6)
    if (t >= 0.6) {
      const strPeak = lerp(0.015, 0.05, (t - 0.6) / 0.4);
      chord.forEach((note) => {
        playVoice({
          freq: noteToFreq(transposeOctave(note, -1)),
          type: "sawtooth",
          dest: graph.panA,
          startTime: now + 0.05,
          duration: 2.35,
          peakGain: strPeak,
          cutoff: 1100,
        });
      });
    }

    // 5. Timpani Pulses (tension >= 0.8)
    if (t >= 0.8) {
      playQuakeBoom(5.2, graph.masterGain);
    }
  }

  function updateContinuousInstruments() {
    if (!started || !ctx || !graph) return;
    const now = ctx.currentTime;
    const isComparing = Boolean(snapshotB);

    if (graph.panA.pan) graph.panA.pan.setTargetAtTime(isComparing ? -0.75 : 0, now, 0.15);
    if (graph.panB.pan) graph.panB.pan.setTargetAtTime(0.75, now, 0.15);

    const LA = snapshotA?.layers ?? {};
    const LB = snapshotB?.layers ?? {};

    // Rain noise A
    if (enabledLayers.has("rainfall") && LA.rainfall?.available && LA.rainfall.percentile != null) {
      const pct = LA.rainfall.percentile;
      const gain = pct > 55 ? lerp(0.01, 0.12, (pct - 55) / 45) : 0;
      graph.rainGainA.gain.setTargetAtTime(gain, now, 0.3);
      graph.rainFilterA.frequency.setTargetAtTime(lerp(450, 1400, pct / 100), now, 0.3);
    } else {
      graph.rainGainA.gain.setTargetAtTime(0, now, 0.3);
    }

    // Rain noise B (stereo compare)
    if (isComparing && enabledLayers.has("rainfall") && LB.rainfall?.available && LB.rainfall.percentile != null) {
      const pctB = LB.rainfall.percentile;
      const gainB = pctB > 55 ? lerp(0.01, 0.12, (pctB - 55) / 45) : 0;
      graph.rainGainB.gain.setTargetAtTime(gainB, now, 0.3);
      graph.rainFilterB.frequency.setTargetAtTime(lerp(500, 1500, pctB / 100), now, 0.3);
    } else {
      graph.rainGainB.gain.setTargetAtTime(0, now, 0.3);
    }

    // Drought sub-rumble
    if (enabledLayers.has("drought") && LA.drought?.available && LA.drought.spi != null) {
      const severity = Math.max(0, -LA.drought.spi);
      const gain = severity > 0.3 ? lerp(0.02, 0.14, Math.min(1, severity / 2)) : 0;
      graph.droughtGain.gain.setTargetAtTime(gain, now, 0.4);
    } else {
      graph.droughtGain.gain.setTargetAtTime(0, now, 0.3);
    }

    // Air haze
    if (enabledLayers.has("air") && LA.air?.available && LA.air.aod != null) {
      const aod = LA.air.aod;
      const gain = aod > 0.3 ? lerp(0.01, 0.09, Math.min(1, (aod - 0.3) / 0.7)) : 0;
      graph.airGain.gain.setTargetAtTime(gain, now, 0.4);
    } else {
      graph.airGain.gain.setTargetAtTime(0, now, 0.3);
    }

    // Earthquake booms
    if (enabledLayers.has("quakes")) {
      const quakesA = LA.quakes ?? [];
      if (quakesA.length > 0) {
        const q = quakesA.reduce((best, cur) => (cur.magnitude > best.magnitude ? cur : best), quakesA[0]);
        const key = `A-${currentYear}-${currentMonth}-${q.magnitude}`;
        if (prevQuakeKeyA !== key) {
          prevQuakeKeyA = key;
          playQuakeBoom(q.magnitude ?? 6.0, graph.panA);
        }
      }
      const quakesB = LB.quakes ?? [];
      if (isComparing && quakesB.length > 0) {
        const q = quakesB.reduce((best, cur) => (cur.magnitude > best.magnitude ? cur : best), quakesB[0]);
        const key = `B-${currentYear}-${currentMonth}-${q.magnitude}`;
        if (prevQuakeKeyB !== key) {
          prevQuakeKeyB = key;
          playQuakeBoom(q.magnitude ?? 6.0, graph.panB);
        }
      }
    }
  }

  return {
    async start() {
      if (started) return;
      started = true;
      const g = ensureGraph();
      if (!g || !ctx) return;
      try {
        if (ctx.state === "suspended") await ctx.resume();
        g.masterGain.gain.setTargetAtTime(muted ? 0 : 0.45, ctx.currentTime, 0.1);
        onBar();
        if (barIntervalId) clearInterval(barIntervalId);
        barIntervalId = setInterval(() => onBar(), BAR_MS);
      } catch {}
    },

    stop() {
      if (barIntervalId) {
        clearInterval(barIntervalId);
        barIntervalId = null;
      }
      if (!started) return;
      started = false;
      if (ctx && graph) {
        try {
          const now = ctx.currentTime;
          graph.masterGain.gain.setTargetAtTime(0, now, 0.1);
          graph.rainGainA.gain.setTargetAtTime(0, now, 0.1);
          graph.rainGainB.gain.setTargetAtTime(0, now, 0.1);
          graph.droughtGain.gain.setTargetAtTime(0, now, 0.1);
          graph.airGain.gain.setTargetAtTime(0, now, 0.1);
        } catch {}
      }
    },

    setMonth(payload = {}) {
      currentYear = payload.year ?? currentYear;
      currentMonth = payload.month ?? currentMonth;
      mode = payload.mode ?? mode;
      currentTension = Math.max(0, Math.min(1, payload.tension ?? 0));
      currentInterest = Math.max(0, Math.min(1, payload.interest ?? 0));
      snapshotA = payload.snapshotA ?? null;
      snapshotB = payload.snapshotB ?? null;
      updateContinuousInstruments();
    },

    setLayers(layers = []) {
      if (Array.isArray(layers)) {
        enabledLayers = new Set(layers);
      } else if (layers && typeof layers === "object") {
        enabledLayers = new Set(
          Object.entries(layers)
            .filter(([, v]) => v !== false)
            .map(([k]) => (k === "earthquakes" ? "quakes" : k))
        );
      }
      updateContinuousInstruments();
    },

    setMode(nextMode) {
      mode = nextMode || "month";
    },

    setPacing(nextPacing) {
      pacing = nextPacing || "normal";
      if (started && ctx && graph && pacing === "skipping") {
        graph.droneOsc.frequency.setTargetAtTime(noteToFreq("A3"), ctx.currentTime, 0.5);
      }
    },

    setMuted(isMuted) {
      muted = Boolean(isMuted);
      if (ctx && graph) {
        graph.masterGain.gain.setTargetAtTime(muted ? 0 : 0.45, ctx.currentTime, 0.1);
      }
    },

    setTension(x) {
      currentTension = Math.max(0, Math.min(1, Number(x) || 0));
    },

    setCity() {},

    setCompare(secondCity) {
      if (!secondCity) snapshotB = null;
      updateContinuousInstruments();
    },

    dispose() {
      this.stop();
      if (ctx) {
        try {
          ctx.close();
        } catch {}
        ctx = null;
        graph = null;
      }
    },
  };
}
