# MEMBER 2: EXPERIENCE TRACK (everything people see and touch)

**Tool:** Google Antigravity. **Rules file:** `GEMINI.md` (Antigravity loads it automatically). **Branch:** `dev2-experience`.
**Mode:** BUILD ONLY (no lessons until the app is finished; see GEMINI.md).

Open this file when starting a task ("Read MEMBER2_EXPERIENCE.md, we are on <step>"). Read README.md and DEVELOPMENT_PLAN.txt only for the section of the current step.

---

## 1. Mission
Make the app **look alive and be easy to use**: the globe that zooms into Pakistan, the timeline player, weather animations, ambient edge glow, charts, tension meter, compare view, story cards, badges, and accessibility. Member 1 builds the music engine, the data and the installer. You two meet only at three contracts (below).

## 2. What you own (and what you do not touch)

| You own | Do NOT edit (ask Member 1 first) |
|---|---|
| `src/state/clock.js` (the global clock) | `src/audio/` |
| `src/map/` | `pipeline/` |
| `src/weather/` | `data/` (JSON files) |
| `src/ui/` | `src/data/` (loader and checks) |
| `src/App.jsx` styling and layout | `electron/` |

## 3. The three contracts (do not change alone)

1. **Data format:** README Section 7. You read it; Member 1 produces it. Until real data arrives, use `karachi.sample.json`.
2. **Clock API** (you build it in S3, everyone reads it). A Zustand store `useClock` in `src/state/clock.js` with:
   - fields: `year`, `month` (0-11), `mode` ("month" | "year" | "story"), `playing`, `speed` (1, 2, 4), `tension` (0-1), `interest` (0-1), `cityA`, `cityB`
   - actions: `play()`, `pause()`, `toggle()`, `stepMonth(direction)`, `setYear(y)`, `setMonth(m)`, `leap(years)`, `setMode(m)`, `setSpeed(s)`, `selectCity(id, "A" | "B")`
   - `tension` and `interest` are read from the current city data for the current month.
   - One month = **2.5 seconds** in Month Mode.
3. **Audio API** (Member 1 builds it; you only call it). `src/audio/index.js` exposes: `start()` (call from a click), `stop()`, `setCity(cityData)`, `setCompare(cityDataOrNull)`, `setMonth(year, month)`, `setLayers([...])`, `setTension(x)`, `setMode(mode)`. A stub that only logs will exist early. Never import from deeper inside `src/audio/`.

## 4. Your steps, in priority order

Shared first (about 3 hours, both of you, one person drives): **S1** scaffold, **S2** data contract + sample data (Member 1 leads), **S3** global clock (you lead).

Then, in this order:

| Order | Step | What | Done when |
|---|---|---|---|
| 1 | S4 | Timeline player: play/pause, step, scrubber, mode switch, speed, leap 5/10 years, keyboard (Space, arrows, up/down) | Dragging the scrubber changes the year; Space toggles play |
| 2 | S8 | Globe intro: MapLibre globe, slow rotation, Start button (also calls `audio.start()`), fly-in to Pakistan, markers pop up one by one, click loads the city; local Pakistan outline fallback | Earth zooms in; clicking Karachi loads the sample city; works with Wi-Fi off |
| 3 | S9 | Weather components, ambient edge glow, ghost versions, Reduce Motion toggle | A test page with sliders shows every effect at several intensities |
| 4 | S10 | Charts that follow the clock, quake bars, tension meter, legend, "What am I hearing?" | Cursors move in step with the clock |
| 5 | S11 (UI) | Compare view: two cities side by side, "Change Since" summary, left/right glow | Two cities shown; summary sentence is correct |
| 6 | S13 (UI) | Story markers and cards, record badges, Smart Pacing in the clock, ghost trigger from `interest` | Story Mode skips a calm stretch and slows at a story marker |
| 7 | S14 (UI) | Future years (2050, 2100), scenario switch, "Projection, not measurement" styling | Label always visible in future years |
| 8 | S15 | Accessibility: keyboard everywhere, labels, focus, high contrast, voice announcer, screen reader test | The whole app works without a mouse |

If you run short of time, cut from the bottom (see README Section 8). **Never cut:** S3/S4, S8, S9 (basic), S10, S11 (UI).

## 5. Weather component spec (build once, reuse for ghost versions)

Each component takes one value and a `ghost` flag. Values are **compared to normal**, never raw.

| Component | Props | Looks like |
|---|---|---|
| `Sun` | `anomaly` (degrees C vs normal), `ghost` | Bigger, redder, shimmering when hotter; pale blue-tinted when cooler |
| `Rain` | `rainPercentile` (0-100 for that month), `ghost` | None under about 20; light clouds near normal; dark clouds and heavy rain above 80; soft lightning above 95 |
| `Drought` | `spi` (negative = dry), `ghost` | Brown cracked-ground tint when SPI is low |
| `Haze` | `aod` (0-1), `ghost` | Grey-brown overlay, opacity follows `aod` |
| `QuakeRipple` | `magnitude`, `lat`, `lon` | Rings from the epicenter, plus a tiny screen shake |
| `AmbientGlow` | `states` (list of conditions with strengths), `side` ("both" | "left" | "right") | Soft screen-edge glow, colors blend by strength, pulses once per bar (2.5 s) |

**Ghost mode:** low opacity, dashed outline, desaturated. Show it only when the month is calm (`interest` below about 0.25 for 2+ months in a row) and there is a visible difference from the 1981-1990 baseline. Hide it in eventful months. Add a "Show the 1980s" toggle that keeps it visible.

**Glow colors (starting point):** heavy rain dark grey-blue; light rain pale blue-grey; hot bright yellow-orange; cooler pale blue; drought dusty brown; haze grey-brown; quake one short amber pulse.

**Safe lightning:** at most 1 flash every 4 seconds, never rapid flashing. A "Reduce motion" toggle and the system setting turn animation down.

**Performance:** full animation only for the selected city; other cities show a small icon. Use CSS for glow and sun, a small canvas for rain.

## 6. UI rules
- Kid-friendly: big buttons, short words, clear colors.
- Every number on screen has its source visible (a small label or tooltip). Label projections as "Projection" and earthquakes as "USGS (non-NASA)". Call the tension index "our own index".
- Never rely on color alone: always add a text label (for example "Rainy month").
- The app must work **offline**: use the local Pakistan outline when map tiles are unavailable.
- Keyboard access and visible focus from the start (do not postpone to S15).

## 7. What you need from Member 1 and what they need from you

| You need | From Member 1 | When |
|---|---|---|
| Sample city JSON | S2 | Hour 1-2 |
| Audio API stub | S5 | Hour 4 |
| Real data for 2 cities | S12 | Hour 10 |
| Final data for all cities | S12 | Hour 24 |

| Member 1 needs | From you | When |
|---|---|---|
| Clock store (`useClock`) | S3 | Hour 3 |
| A test page or slider for tension | any | Hour 4 |

## 8. Git and logging
- Branch `dev2-experience`. Commit after every finished step: `S9: weather components and glow`.
- Merge into `main` only at checkpoints (hours 12, 24, 36), after running the app.
- After every step add ONE line to `logs/DEV2_BUILD.txt`:
  `S9 | weather components + glow | CSS + canvas | src/weather/* | works, tested with sliders`

## 9. Usage tips (Antigravity)
- Open the repo folder as the workspace so `GEMINI.md` loads.
- Use **Planning mode** for multi-file work (globe, weather set, compare view) and review the implementation plan before it runs. Use **Fast mode** for small fixes and tweaks.
- One conversation per step. Do not run several agents on the same files at once.
- Keep terminal command approval on a setting you are comfortable with (review before running installs).
- Antigravity is still evolving, so if a menu or setting looks different, check its Customizations/Settings panel.
- Keep about 30 percent of your quota for hours 36-48.

## 10. First prompt to paste
> Read GEMINI.md and MEMBER2_EXPERIENCE.md. I am Member 2 (experience). Mode: BUILD ONLY. We are on S1 (shared scaffold with Member 1). Give a 3-line plan, then build it.
