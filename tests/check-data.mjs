// Fails loudly if data/index.json or any city file breaks the data contract.
// Run: npm run check-data
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { validateCity } from "../src/data/validate.js";

const root = new URL("../data/", import.meta.url);
let bad = 0;
const fail = (msg) => { bad++; console.error("  -", msg); };

// 1. index.json: every entry must have the fields and point to a real file
const index = JSON.parse(readFileSync(new URL("index.json", root), "utf8"));
console.log("index.json");
for (const c of index) {
  for (const k of ["id", "name", "lat", "lon", "file"]) if (c[k] == null) fail(`city "${c.id ?? "?"}": missing "${k}"`);
  if (c.file && !existsSync(new URL(c.file, root))) fail(`city "${c.id}": file "${c.file}" does not exist`);
}

// 2. every city file in data/cities/ follows the format
const dir = new URL("cities/", root);
const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
for (const f of files) {
  const errs = validateCity(JSON.parse(readFileSync(new URL(f, dir), "utf8")));
  if (errs.length) { console.error(`FAIL ${f}`); errs.slice(0, 10).forEach(fail); } else console.log(`OK   ${f}`);
}
if (!index.length) fail("index.json is empty");
console.log(bad ? `${bad} problem(s)` : "OK all data");
process.exit(bad ? 1 : 0);
