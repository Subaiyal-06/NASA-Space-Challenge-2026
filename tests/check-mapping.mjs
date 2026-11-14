// Checks the data -> sound rules with the real city files. Run: npm run check-mapping
import { readFileSync } from "node:fs";
import { computeMonthValues, rainLevel } from "../src/audio/mapping.js";

const load = (f) => JSON.parse(readFileSync(new URL(`../data/cities/${f}.json`, import.meta.url), "utf8"));
const karachi = load("karachi");
const sample = load("karachi.sample");
let bad = 0;
const ok = (c, m) => { if (!c) { bad++; console.error("FAIL", m); } };

// July (month index 6): 1987 was dry, 2022 was the flood
const dry = computeMonthValues(karachi, 1987, 6);
const flood = computeMonthValues(karachi, 2022, 6);
console.log("Karachi Jul 1987:", dry, "\nKarachi Jul 2022:", flood);
ok(flood.rainNotes > dry.rainNotes + 4, "2022 flood must have clearly more rain notes than 1987");
ok(flood.rainLevel > 0.9, "flood rain level should be near 1");
ok(rainLevel(0.3, 40) === 0, "under 1 mm is silent");

// Orchestra grows: sample file has temperature from 1900 but rain only from 1981
const early = computeMonthValues(sample, 1950, 6);
ok(early.rainLevel === 0 && early.rainNotes === 0, "rain silent before startYear");
ok(computeMonthValues(sample, 1950, 6).brightness !== 0, "temperature still sounds before 1981 (starts 1900)");
ok(computeMonthValues(sample, 1990, 6).haze === 0, "air silent before 2000");

// Layer switch off
ok(computeMonthValues(karachi, 2022, 6, ["temperature"]).rainNotes === 0, "rainfall switched off = silent");

// Earthquake and others from the sample file
ok(computeMonthValues(sample, 2005, 9).quake?.mag === 7.6, "2005 quake found (month index 9)");
ok(computeMonthValues(sample, 2005, 8).quake === null, "no quake in September 2005");
ok(computeMonthValues(sample, 2001, 3).drought >= 0.48, "2001 is a drought year in the sample (SPI <= -1.2)");
ok(computeMonthValues(sample, 2022, 7).drought === 0, "wet 2022 has no drought");

console.log(bad ? `${bad} problem(s)` : "OK data to sound rules");
process.exit(bad ? 1 : 0);
