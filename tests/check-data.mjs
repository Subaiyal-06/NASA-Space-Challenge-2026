// Fails loudly if any data/cities/*.json breaks the data contract.
// Run: npm run check-data
import { readdirSync, readFileSync } from "node:fs";
import { validateCity } from "../src/data/validate.js";

const dir = new URL("../data/cities/", import.meta.url);
const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
let bad = 0;
for (const f of files) {
  const errs = validateCity(JSON.parse(readFileSync(new URL(f, dir), "utf8")));
  if (errs.length) { bad++; console.error(`FAIL ${f}`); errs.slice(0, 10).forEach((e) => console.error("  -", e)); }
  else console.log(`OK   ${f}`);
}
if (!files.length) { console.error("No city files found"); process.exit(1); }
process.exit(bad ? 1 : 0);
