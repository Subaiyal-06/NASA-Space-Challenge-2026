// The scale and chords (pure functions, no audio). Every note played goes through quantize().
// MIDI numbers: 69 = A4 (440 Hz). Pitch class 0=C 1=C# ... 9=A 11=B.
export const SCALE_PCS = [9, 11, 0, 2, 4, 5, 7]; // A minor: A B C D E F G

export const inScale = (midi) => SCALE_PCS.includes(((midi % 12) + 12) % 12);

// Force any MIDI note onto the scale: try the note itself, then 1 below, 1 above, 2 below...
export function quantize(midi) {
  const m = Math.round(midi);
  for (let d = 0; d <= 6; d++) {
    if (inScale(m - d)) return m - d;
    if (inScale(m + d)) return m + d;
  }
  return m;
}

// Chords as pitch classes. The E chord has G# (8), which is not in A minor, so quantize()
// turns it into G: the "tense" E chord is voiced E-G-B. This keeps the "never leave the scale" rule.
const CHORDS = { Am: [9, 0, 4], F: [5, 9, 0], C: [0, 4, 7], G: [7, 11, 2], Dm: [2, 5, 9], E: [4, 8, 11] };
export const CALM_LOOP = ["Am", "F", "C", "G"];
export const TENSE_LOOP = ["Am", "F", "Dm", "E"];

// Chord notes as ascending MIDI numbers starting at or above baseMidi, all quantized to the scale.
export function chordMidi(name, baseMidi = 57) {
  return CHORDS[name]
    .map((pc) => baseMidi + ((pc - (baseMidi % 12) + 12) % 12))
    .sort((a, b) => a - b)
    .map(quantize);
}

export const midiToHz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

// Which chord plays in bar number `bar` (one chord per 3 bars = 3 months; 4 chords = 1 year).
export function chordForBar(bar, tense) {
  const loop = tense ? TENSE_LOOP : CALM_LOOP;
  return loop[Math.floor(bar / 3) % 4];
}
