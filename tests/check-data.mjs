// Fails loudly if data/index.json or any city file breaks the data contract.
// Run: npm run check-data      (warnings are shown but do not fail the check)
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { checkCity } from "../src/data/validate.js";
import { applyAdapters } from "../src/data/adapters/index.js";

const root = new URL("../data/", import.meta.url);
let bad = 0;
const fail = (msg) => { bad++; console.error("  - ERROR", msg); };

// 1. index.json: every entry must have the fields and point to a real file
const index = JSON.parse(readFileSync(new URL("index.json", root), "utf8"));
console.log("index.json");
for (const c of index) {
  for (const k of ["id", "name", "lat", "lon", "file"]) if (c[k] == null) fail(`city "${c.id ?? "?"}": missing "${k}"`);
  if (c.file && !existsSync(new URL(c.file, root))) fail(`city "${c.id}": file "${c.file}" does not exist`);
}
if (!index.length) fail("index.json is empty");

// 2. every city file in data/cities/ (after the adapters, exactly as the app loads it)
const dir = new URL("cities/", root);
for (const f of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
  const { city, notes } = applyAdapters(JSON.parse(readFileSync(new URL(f, dir), "utf8")));
  const { errors, warnings } = checkCity(city);
  console.log(errors.length ? `FAIL ${f}` : `OK   ${f}`);
  errors.slice(0, 10).forEach(fail);
  warnings.forEach((w) => console.log("  - warning", w));
  notes.forEach((n) => console.log("  - note   ", n));
}
console.log(bad ? `${bad} problem(s)` : "OK all data");
process.exit(bad ? 1 : 0);
