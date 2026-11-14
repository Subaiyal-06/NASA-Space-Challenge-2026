# MEMBER 1: ENGINE TRACK (data, sound, packaging)

**Tool:** Claude Code. **Rules file:** `CLAUDE.md` (loaded automatically). **Branch:** `dev1-engine`.
**Mode:** BUILD ONLY (no lessons until the app is finished; see CLAUDE.md).

Read this file when starting a session ("Read MEMBER1_ENGINE.md, we are on <step>"). Read README.md and DEVELOPMENT_PLAN.txt only for the section of the current step.

---

## 1. Mission
Make the app **sound right and have real data**: a music engine driven by the tension index, data instruments, a Python pipeline that produces the city JSON files, and an installable desktop build. Member 2 builds everything people see and touch. You two meet only at three contracts (below).

## 2. What you own (and what you do not touch)

| You own | Do NOT edit (ask Member 2 first) |
|---|---|
| `pipeline/` (Python data scripts) | `src/map/` |
| `data/cities/*.json`, `data/stories.json` | `src/weather/` |
| `src/audio/` (music engine) | `src/ui/` |
| `src/data/` (loader and checks) | `src/state/clock.js` (Member 2 owns it after S3) |
| `tests/` | |
| `electron/` and installer build (S16) | |

## 3. The three contracts (do not change alone)

1. **Data format:** README Section 7. You produce it, Member 2 reads it.
2. **Clock API** (Member 2 builds it in S3, you only read from it): fields `year`, `month` (0-11), `mode` ("month" | "year" | "story"), `playing`, `speed`, `tension`, `interest`; actions `play`, `pause`, `stepMonth`, `setYear`, `leap`, `setMode`, `selectCity`.
3. **Audio API** (you build it, Member 2 calls it). Put it in `src/audio/index.js`:
   - `start()` (async; must be called from a click), `stop()`
   - `setCity(cityData)` and `setCompare(cityDataOrNull)` (second city, panned right)
   - `setMonth(year, month)`
   - `setLayers(["temperature","rainfall","drought","quakes","air"])`
   - `setTension(x)` (0 to 1)
   - `setMode("month" | "year" | "story")`
   - **Create a stub version in your first audio step** (functions that only `console.log`) so Member 2 can wire the UI without waiting. Replace the internals later; do not change the function names.

## 4. Your steps, in priority order

**Startup sequence (prevents conflicting files):** you go first, alone, for about 1-1.5 hours.
1. **S1:** scaffold the project, install ALL planned dependencies in one go (react, vite, electron, electron-builder, zustand, tone, maplibre-gl, d3 or chart.js, tailwind), create every folder with placeholder files, add `.gitignore` (node_modules, `.env`, `pipeline/raw/`, build output), create `logs/`. Commit and **push to `main`**.
2. **S2 minimum:** add the sample city JSON (`data/cities/karachi.sample.json`) and the data loader. Commit and **push to `main`**. Tell Member 2 they can start.
3. Member 2 now starts S3 (clock) and S4 (timeline) on their branch. You carry on with the S2 check script, then S5 audio.
4. Conflict rules: only Member 2 edits `src/App.jsx` (you test audio on your own page, `src/dev/AudioTest.jsx`). If you need a new package, commit `package.json` and the lock file on their own, merge to `main` straight away, and tell Member 2. Before every step run `git pull origin main`.

Then, in this order:

| Order | Step | What | Done when |
|---|---|---|---|
| 1 | S5 | Audio foundation: Start button, Tone.js, Transport at 96 BPM, drone, reverb, limiter, **audio API stub** | Press Start, hear a steady drone; stop silences it |
| 2 | S6 | Music layers and tension: A minor scale quantizer, chord loops (Am F C G / Am F Dm E), arpeggio, pad, strings, pulse; `setTension(x)` | A temporary 0-1 slider makes the music build smoothly |
| 3 | S12 (minimal) | Data pipeline for **Karachi and Lahore** using **NASA POWER only** first (temperature, rainfall), monthly, plus normals; write JSON; check script | Check script passes; 2022 rain spike visible in Karachi data |
| 4 | S7 | Data instruments: rain notes and noise, quake boom, drought filter, haze noise, temperature brightness; `setMonth` reads city data; layers start at their `startYear` | With real data, 1981 vs 2022 sound clearly different |
| 5 | S16 (first build) | electron-builder installer, ZIP, bundled data, audio autoplay flag; **first working installer by hour 24** | Installed on another laptop and runs with Wi-Fi off |
| 6 | S12 (grow) | Add GISTEMP (long temperature), USGS earthquakes, drought index (SPI), tension index, interest score, 1981-1990 baseline, records; then more cities (Islamabad, Peshawar, Quetta) | JSON matches README Section 7; check script passes |
| 7 | S11 (audio) | Second city voice panned right, first city panned left | Headphone test works |
| 8 | S13 (logic) | Smart Pacing music behavior: for skipped quiet months keep the drone, play a soft riser, restart on the bar line; tempo never changes | Story Mode skips a calm stretch without a rhythm break |
| 9 | S14 (data) | NEX-GDDP-CMIP6 projections per city, two scenarios | `projection` section in the JSON; tension rises in future years |
| 10 | S16 (final) | Final installers, offline test, web backup build | Full demo runs from the installer |

If you run short of time, cut from the bottom (see README Section 8). **Never cut:** S5, S6, S12 minimal, S7, first installer.

## 5. Music rules (summary; full rules in README Section 6)
- A minor only (A B C D E F G); quantize every note to the scale.
- 96 BPM, 4 beats per bar, **one bar = one month = 2.5 seconds**.
- One chord per 3 months. Calm loop Am-F-C-G; tense loop Am-F-Dm-E.
- Tension layers: 0-0.2 drone and soft pad; 0.2-0.4 slow arpeggio; 0.4-0.6 organ-like pad and higher arpeggio; 0.6-0.8 strings and faster arpeggio and tense loop; 0.8-1.0 low pulse, brightest, most reverb.
- Fade layers over about one bar. Always a limiter at the end.
- No copying of any melody, recording or sample from existing songs or films. Record the license of any sample.

## 6. Data rules
- Every number comes from a named source and goes into the JSON `source` field.
- Weather and glow use values **compared to normal** (anomalies), so include monthly `normals` and the 1981-1990 `baseline`.
- Be honest about start years: no NASA rainfall before 1980; temperature (GISTEMP) from 1880 is coarse. Earthquakes are USGS (non-NASA).
- Never invent data. If a dataset cannot be downloaded in time, leave that layer out and set no `startYear` for it.
- Keep the NASA Earthdata login in an ignored `.env` file, never in Git.

## 7. What you need from Member 2 and what they need from you

| You need | From Member 2 | When |
|---|---|---|
| Clock store (so audio follows `year`/`month`) | S3 | Hour 3 |
| A place for the temporary tension slider (or add it yourself in a test page) | any | Hour 4 |

| Member 2 needs | From you | When |
|---|---|---|
| Sample city JSON | S2 | Hour 1-2 |
| Audio API stub | S5 | Hour 4 |
| Real data for 2 cities | S12 | Hour 10 |
| Final data for all cities | S12 | Hour 24 |
| First working installer | S16 | Hour 24 |

## 8. Git and logging
- Branch `dev1-engine`. Commit after every finished step: `S6: tension layers`.
- Merge into `main` only at checkpoints (hours 12, 24, 36), after running the app.
- After every step add ONE line to `logs/DEV1_BUILD.txt`:
  `S6 | tension layers | Tone.js | src/audio/layers.js | works, tested with slider`

## 9. Usage tips (Claude Code)
- Start a **fresh session per step or phase**. CLAUDE.md reloads automatically.
- Ask for the cheapest working version first.
- Keep about 30 percent of usage for hours 36-48.
- Long data downloads: ask Claude Code to write the script, then run it yourself and paste only the error if one appears.

## 10. First prompt to paste
> Read CLAUDE.md and MEMBER1_ENGINE.md. I am Member 1 (engine). Mode: BUILD ONLY. We are on S1 (shared scaffold with Member 2). Give a 3-line plan, then build it.
