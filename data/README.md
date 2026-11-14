# How to add REAL data

The app reads every file in `data/cities/*.json` automatically. No code change is needed.

## Rules
1. Name the file `<city>.json` (lowercase), for example `karachi.json`, `lahore.json`.
2. A real file **replaces** the sample: `loadCity("karachi")` uses `karachi.json` first and only falls back to `karachi.sample.json`.
3. Follow the format in README.md, Section 7.
4. **Every layer is optional.** If you only have temperature and rainfall, include only those two. Missing layers stay silent and are hidden in the UI (the "orchestra grows" rule). Never fill a missing layer with made-up numbers.
5. Each layer needs a `source` (dataset name), a `startYear`, and `monthly` = `{ "1981": [12 numbers], ... }` (January first).
6. `tension` and `interest` (12 numbers between 0 and 1 per year) are optional. If they are missing, the app can compute them from the layers (planned in S12).

## Check your file
```bash
npm run check-data
```
It prints `OK` or lists what is wrong.

## What to send Claude
Any of these is fine. Say which dataset it is and what the columns mean:
- A ready city JSON in the format above, or
- CSV / NetCDF / text files (for example NASA POWER downloads). Put them in `pipeline/raw/` (not committed to Git) and ask for a converter. The converter script will live in `pipeline/` and write the JSON here.
