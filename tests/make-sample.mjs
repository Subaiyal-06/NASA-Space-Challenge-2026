// Generates data/cities/karachi.sample.json (FAKE sample data, fixed seed, so it is repeatable).
// Run: node tests/make-sample.mjs
// Purpose: lets Member 2 build the UI before the real NASA pipeline (S12) exists.
// Numbers here are NOT real measurements, except the two real earthquake events.
import { writeFileSync } from "node:fs";

let seed = 42;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(2 * Math.PI * rnd());
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const r2 = (x) => Math.round(x * 100) / 100;

const normals = [6, 8, 8, 3, 1, 8, 70, 50, 20, 1, 2, 5]; // mm/month, rough Karachi-like shape
const T0 = 1900, T1 = 2025, R0 = 1981;

const temp = {}, rain = {}, spi = {}, air = {};
for (let y = T0; y <= T1; y++) {
  const trend = -0.3 + ((y - T0) / (T1 - T0)) * 1.5; // sample warming trend
  temp[y] = Array.from({ length: 12 }, () => r2(trend + gauss() * 0.25));
}
for (let y = R0; y <= T1; y++) {
  rain[y] = normals.map((n) => r2(Math.max(0, n * Math.exp(gauss() * 0.5))));
  spi[y] = Array.from({ length: 12 }, () => r2(clamp(gauss() * 0.9, -2.5, 2.5)));
}
rain[2022][6] = 380; rain[2022][7] = 450; rain[2022][8] = 210; // sample flood spike
for (const m of [6, 7, 8]) spi[2022][m] = r2(2.2 + rnd() * 0.3);
for (const y of [2000, 2001, 2002]) spi[y] = spi[y].map((v) => r2(Math.min(v, -1.2)));
for (let y = 2000; y <= T1; y++) air[y] = Array.from({ length: 12 }, () => r2(clamp(0.2 + (y - 2000) * 0.006 + gauss() * 0.06, 0, 1)));

const events = [
  { year: 1945, month: 11, mag: 8.1, depth: 27, lat: 25.15, lon: 63.48 },
  { year: 2005, month: 10, mag: 7.6, depth: 26, lat: 34.5, lon: 73.6 },
];

// ---- derived values (the pipeline will compute these from real data in S12) ----
const baseline = {
  temperature: Array.from({ length: 12 }, (_, m) => r2(avg(range(1981, 1990).map((y) => temp[y][m])))),
  rainfall: Array.from({ length: 12 }, (_, m) => r2(avg(range(1981, 1990).map((y) => rain[y][m])))),
};
function range(a, b) { return Array.from({ length: b - a + 1 }, (_, i) => a + i); }
function avg(a) { return a.reduce((s, x) => s + x, 0) / a.length; }

const tension = {}, interest = {}, yearly = { temperature: {}, rainfall: {} };
for (let y = R0; y <= T1; y++) {
  tension[y] = []; interest[y] = [];
  for (let m = 0; m < 12; m++) {
    const tN = clamp((temp[y][m] - 0) / 1.5, 0, 1);
    const dN = clamp(-spi[y][m] / 2.5, 0, 1);
    const aN = y >= 2000 ? clamp(air[y][m], 0, 1) : 0;
    const rN = clamp((rain[y][m] - normals[m] * 2) / 200, 0, 1);
    const qN = Math.max(0, ...events.filter((e) => e.year <= y).map((e) => {
      const months = (y - e.year) * 12 + (m + 1 - e.month);
      return months >= 0 && months < 6 ? (1 - months / 6) * clamp((e.mag - 5) / 3, 0, 1) : 0;
    }));
    tension[y].push(r2(0.35 * tN + 0.25 * dN + 0.2 * aN + 0.1 * rN + 0.1 * qN));
    interest[y].push(r2(Math.max(clamp(Math.abs(temp[y][m] - baseline.temperature[m]) / 2, 0, 1), clamp(Math.abs(rain[y][m] - normals[m]) / (normals[m] * 3 + 30), 0, 1), dN, qN, aN * 0.6)));
  }
  yearly.temperature[y] = r2(avg(temp[y]));
  yearly.rainfall[y] = r2(rain[y].reduce((s, x) => s + x, 0));
}

const city = {
  city: "Karachi", lat: 24.86, lon: 67.0,
  layers: {
    temperature: { source: "SAMPLE (fake) data. Real source will be NASA GISTEMP v4 + NASA POWER", unit: "C anomaly vs 1951-1980", startYear: T0, monthly: temp },
    rainfall: { source: "SAMPLE (fake) data. Real source will be NASA POWER", unit: "mm/month", startYear: R0, normals, monthly: rain },
    drought: { source: "SAMPLE (fake) data. Real source will be SPI computed from NASA rainfall", unit: "SPI", startYear: R0, monthly: spi },
    air: { source: "SAMPLE (fake) data. Real source will be NASA MERRA-2 / MODIS AOD", unit: "aerosol optical depth 0-1", startYear: 2000, monthly: air },
    earthquakes: { source: "USGS (non-NASA)", events },
  },
  tension, interest, baseline,
  records: [
    { year: 2022, month: 8, layer: "rainfall", text: "Wettest August in our data" },
    { year: 2005, month: 10, layer: "earthquakes", text: "Strongest quake in our data (1981-2025)" },
  ],
  yearly,
  projection: {
    source: "SAMPLE (fake) data. Real source will be NASA NEX-GDDP-CMIP6",
    scenarios: ["ssp245", "ssp585"],
    temperature: { ssp245: { 2050: 1.8, 2100: 2.4 }, ssp585: { 2050: 2.3, 2100: 4.1 } },
  },
};

writeFileSync(new URL("../data/cities/karachi.sample.json", import.meta.url), JSON.stringify(city));
console.log("wrote data/cities/karachi.sample.json");
