// Checks the music rules without audio. Run: npm run check-scale
import { quantize, inScale, chordMidi, CALM_LOOP, TENSE_LOOP, chordForBar } from "../src/audio/scale.js";

let bad = 0;
const ok = (cond, msg) => { if (!cond) { bad++; console.error("FAIL", msg); } };

for (let m = 20; m < 110; m++) ok(inScale(quantize(m)), `quantize(${m}) not in scale`);
ok(quantize(69) === 69, "A4 stays A4");
ok(quantize(70) !== 70, "A# must move onto the scale");
for (const name of [...CALM_LOOP, ...TENSE_LOOP])
  for (const base of [45, 57, 69]) chordMidi(name, base).forEach((n) => ok(inScale(n), `${name}@${base}: ${n} not in scale`));
ok(chordForBar(0, false) === "Am" && chordForBar(3, false) === "F" && chordForBar(9, false) === "G", "calm loop order");
ok(chordForBar(6, true) === "Dm" && chordForBar(9, true) === "E" && chordForBar(12, true) === "Am", "tense loop order");
console.log(bad ? `${bad} problem(s)` : "OK scale and chord rules");
process.exit(bad ? 1 : 0);
