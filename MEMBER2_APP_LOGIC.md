# MEMBER 2: CLOCK, APP LOGIC AND CONNECTORS

**Tool:** Google Antigravity. **Rules file:** `GEMINI.md` (Antigravity loads it automatically). **Branch:** `dev2-app-logic`.
**Mode:** BUILD ONLY (no lessons until the app is finished).

Open this file when starting a task ("Read MEMBER2_APP_LOGIC.md, we are on <step>"). Read DEVELOPMENT_PLAN.txt and README.md only for the section of the current step.

---

## 1. Scope (important)
The project has 6 members. **You and Member 1 build only the app core.** You do NOT build music, UI/UX components, data files or designs. Your teammates deliver those as standalone modules, and the app plugs them in through contracts. Your job is the logic that drives everything: the clock, pacing, events, compare logic, app flow, and the connectors that feed data to whatever UI components and audio engine get plugged in.

## 2. What you own

| You own | Member 1 owns (ask first before editing) |
|---|---|
| `src/state/` (clock, pacing, events) | `electron/`, `src/main.jsx`, packaging |
| `src/app/` (connectors, flow, compare, keyboard, announcer) | `src/contracts/`, `src/integrations/`, `src/slots/` |
| `src/App.jsx` | `src/data/`, `src/settings/`, `src/dev/` |
| `tests/` for your code | `data/`, `docs/` |

## 3. Your steps (full detail in DEVELOPMENT_PLAN.txt Part 4)

**Start order:** Member 1 goes first for about 1-1.5 hours (repo cleanup, scaffold, sample data), then pushes to `main` and tells you. **Wait for that message.** Then pull `main`, create branch `dev2-app-logic`, and start C4. While waiting: install Git, Node.js (current LTS) and make sure Antigravity opens; read README Sections 2, 4 and 7 and the plan.

| Order | Step | What | Done when |
|---|---|---|---|
| 1 | C4 | Global clock (Zustand): `year`, `month`, `mode`, `playing`, `speed`, `tension`, `interest`, cities; ticking at 2.5 s per month; play, pause, step, seek, leap, modes, speed; unit tests | Console shows the month advancing every 2.5 s; pause works; tests pass |
| 2 | C6 | Smart pacing (Story Mode compresses calm stretches of 3+ months to about 1 s per month), Year Mode, layer start-year gating, future years and scenario, calm detection (2+ calm months) for ghost | Tests pass; Story Mode skips a calm stretch |
| 3 | C7 | Events (story, badge, quake) when the playhead reaches them; prop builders for WeatherLayer (conditions + ghost), AmbientGlow (blended states), TensionMeter, Legend; "What am I hearing" text | Tests pass; dev panel shows events and prop objects |
| 4 | C8 | Connectors (one per slot, wrapped in `SlotHost`) and `App.jsx` composition with placeholders: intro, player, compare | Whole app runs end to end with placeholders; audio calls follow the clock |
| 5 | C9 | App flow (intro -> city -> player -> compare), compare logic (change since, summary sentence, left/right flags), keyboard shortcuts, voice announcer, reduce-motion handling | App is usable with the keyboard; compare text is correct on sample data |
| 6 | C12 (UI part) | Plug in the UI/UX components the teammates deliver, one slot at a time, following DEVELOPMENT_PLAN.txt Part 6 | Slot passes the contract test and works in the real flow |

If short of time, see the cutting plan. **Never cut:** C4, C8, C6 (basic pacing is part of the demo).

## 4. Contracts you use (details in DEVELOPMENT_PLAN.txt Part 3)
- **Data API** (built by Member 1, `src/data/api.js`): `getCityList`, `loadCity`, `getRange`, `getSnapshot`, `getBaselineSnapshot`, `getSeries`, `getMarkers`. **Never read the JSON files directly.**
- **Clock API** (you build it): state `year`, `month` (0-11), `mode` ("month" | "year" | "story"), `playing`, `speed`, `pacing`, `tension`, `interest`, `cityA`, `cityB`, `scenario`, `futureEnabled`, `layers`; actions `play`, `pause`, `toggle`, `stepMonth`, `setYear`, `setMonth`, `seek`, `leap`, `setMode`, `setSpeed`, `selectCity`, `setLayers`; events `tick`, `story`, `badge`, `quake`, `pacing`, `calm`, `cityChange`.
- **Audio contract:** the audio engine only receives plain data: `setMonth({ year, month, mode, tension, interest, snapshotA, snapshotB })`, `setLayers`, `setMode`, `setPacing`, `setMuted`, plus `start`/`stop`. Until the music module arrives you talk to `NullAudio`.
- **UI slot contract:** pure components that receive only props (GlobeIntro, Timeline, WeatherLayer, AmbientGlow, Charts, TensionMeter, LayerToggles, StoryCard, BadgeToast, CompareView, Legend). Your connectors read the clock, data and settings and pass the props.

## 5. Logic rules (from README Feature 6B and the plan)
- **Interest score:** calm month = interest below about 0.25; eventful above about 0.5. Ghost weather needs 2+ calm months in a row; skipping needs 3+.
- **Ghost props:** show only in calm stretches **and** when the baseline difference is visible; hide it in eventful months; `showGhostAlways` setting keeps it visible. Baseline = 1981-1990 average for that month (`getBaselineSnapshot`).
- **Smart pacing:** only in Story Mode. Compress calm stretches to about 1 s per month, emit `pacing` events (`skipping` and `normal`). Month Mode never skips. The music tempo never changes; the audio engine decides what to play while `skipping`.
- **Layer gating:** a layer is `available: false` before its start year, with a short reason ("NASA rainfall data starts in 1980").
- **Weather and glow props use values compared to normal** (anomalies, percentiles), never raw values.
- **Labels:** projection years are flagged `isProjection`; earthquakes are labeled USGS (non-NASA); the tension index is "our own index"; badge texts say "in our data".
- **Accessibility logic:** keyboard shortcuts (Space, arrows, up/down), a voice announcer that builds a plain-language sentence for each month (on/off setting), and reduce-motion state (system setting plus toggle) passed to every slot.
- **Compare logic:** "Change Since" computes the difference between a start year and now for each city and layer; the summary sentence is built from those numbers (for example "Since 1981, Karachi warmed faster than Lahore"). Default start year is 1981.

## 6. Handoffs with Member 1

| You need from Member 1 | When |
|---|---|
| Scaffold and sample data on `main` (C1, C2) | Hour 1.5 |
| Contracts, registry and placeholders (C3) | Hour 4 |
| Data tooling: baseline, series, markers (C5) | Hour 6 |

| Member 1 needs from you | When |
|---|---|
| Clock store (C4), for the dev panel controls | Hour 4 |
| Connectors and `App.jsx` composition (C8) | Hour 8 |

## 7. Conflict rules
- Only you edit `App.jsx`. If you need a new package, commit `package.json` and the lock file on their own, merge to `main` straight away, and tell Member 1.
- Before every step run `git pull origin main`.
- Never edit a teammate's data or component to fix a mismatch. Ask Member 1 for an adapter, or report it to the teammate.

## 8. Git and logging
- Branch `dev2-app-logic`. Commit after every finished step: `C4: global clock`.
- Merge into `main` at checkpoints (hours 12, 24, 36), after running the app.
- After every step add ONE line to `logs/DEV2_BUILD.txt`:
  `C4 | global clock | Zustand | src/state/clock.js | month ticks every 2.5s, tests pass`

## 9. Usage tips (Antigravity)
- Open the repo folder as the workspace so `GEMINI.md` loads.
- Use **Planning mode** for multi-file steps (clock, connectors) and review the implementation plan before it runs. Use **Fast mode** for small fixes.
- One conversation per step. Do not run several agents on the same files.
- Antigravity is evolving; if a menu looks different, check its Customizations/Settings panel.
- Keep about 30 percent of your quota for hours 36-48.

## 10. First prompt to paste
> Read GEMINI.md and MEMBER2_APP_LOGIC.md. I am Member 2. Mode: BUILD ONLY. Member 1 has pushed C1 and C2. Pull main, create branch dev2-app-logic, and start C4 (the global clock). Give a 3-line plan, then build it with unit tests.
