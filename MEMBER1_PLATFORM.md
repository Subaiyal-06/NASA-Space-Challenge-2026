# MEMBER 1: PLATFORM, DATA LAYER AND INTEGRATION

**Tool:** Claude Code. **Rules file:** `CLAUDE.md` (loaded automatically). **Branch:** `dev1-platform`.
**Mode:** BUILD ONLY (no lessons until the app is finished).

Read this file when starting a session ("Read MEMBER1_PLATFORM.md, we are on <step>"). Read DEVELOPMENT_PLAN.txt and README.md only for the section of the current step.

---

## 1. Scope (important)
The project has 6 members. **You and Member 2 build only the app core.** You do NOT build music, UI/UX components, data files or designs. Your teammates deliver those, and you plug them in through contracts. Your job is to make the app run end to end with placeholders from day one, and to make plugging things in easy and safe.

## 2. What you own

| You own | Member 2 owns (ask first before editing) |
|---|---|
| `electron/` (desktop shell) | `src/App.jsx` |
| `src/main.jsx`, build config, packaging | `src/state/` (clock, pacing, events) |
| `src/contracts/` | `src/app/` (connectors, flow, compare, keyboard, announcer) |
| `src/integrations/` (registry and delivered modules) | |
| `src/slots/` (placeholders, error boundary) | |
| `src/data/` (API, loader, adapters, derived, validator) | |
| `src/settings/` | |
| `src/dev/` (dev panel, contract tests) | |
| `data/` samples, `docs/INTEGRATION.md`, `tests/` for your code | |

## 3. Your steps (full detail in DEVELOPMENT_PLAN.txt Part 4)

| Order | Step | What | Done when |
|---|---|---|---|
| 1 | C0 | Repo hygiene: remove unrelated files, `.gitignore`, trim README | Repo has only keep-list files |
| 2 | C1 | Scaffold: Vite + React + Electron, **core dependencies only** (react, vite, electron, electron-builder, zustand, test tooling), folders, scripts, logs/ | `npm run dev` opens a desktop window. **Push to main** |
| 3 | C2 | Sample data (`data/index.json`, `karachi.sample.json`), loader, `getCityList`, `loadCity`, `getSnapshot` | `getSnapshot("karachi", 1981, 5)` returns the agreed shape. **Push to main, tell Member 2** |
| 4 | C3 | Contracts (types and validators), registry (`src/integrations/index.js`), placeholders for every UI slot, `NullAudio`, `SlotHost` error boundary, settings store | App renders every slot as a placeholder; audio calls show in a log. **Push to main** |
| 5 | C5 | Data tooling: validator and `npm run check-data`, adapters, derived fallbacks (tension, interest, baseline, records), `getBaselineSnapshot`, `getSeries`, `getMarkers`, `getRange` | Broken files fail with clear messages; a file without `tension` still works |
| 6 | C10 | Dev panel (`/dev`) and contract tests | Reports pass for the placeholders |
| 7 | C11 | Generate `docs/INTEGRATION.md` for teammates and share it | Teammates know exactly what to deliver |
| 8 | C13 | Packaging and offline: installers, ZIP, bundled data, autoplay flag, Wi-Fi-off test. **First test build by hour 24** | Installed on another laptop, runs offline |
| 9 | C12 | Integrate delivered **data** and **audio** (Member 2 does UI) following DEVELOPMENT_PLAN.txt Part 6 | Real data and music run through the app |
| 10 | C14 | Web backup build (optional) | Hosted link works |

If short of time, see the cutting plan. **Never cut:** C1, C2, C3, C5, C10, C13.

## 4. The contracts you create (details in DEVELOPMENT_PLAN.txt Part 3)
- **Data API** (`src/data/api.js`): `getCityList`, `loadCity`, `getRange`, `getSnapshot`, `getBaselineSnapshot`, `getSeries`, `getMarkers`. Nobody else reads the JSON directly.
- **Audio contract:** factory `createAudioEngine()`; required methods `start`, `stop`, `setMonth(payload)`, `setLayers`, `setMode`, `setPacing`, `setMuted`; optional `setCity`, `setCompare`, `setTension`, `dispose`.
- **UI slot contract:** pure React components receiving only props (GlobeIntro, Timeline, WeatherLayer, AmbientGlow, Charts, TensionMeter, LayerToggles, StoryCard, BadgeToast, CompareView, Legend).
- Write each as JSDoc types plus a validator function that gives clear error messages.

## 5. Design rules for flexibility
- **Everything a teammate delivers goes through the registry.** Never import their code anywhere except `src/integrations/index.js`.
- **Placeholders for everything.** Each slot has a grey-box placeholder that prints its name and props as JSON (this shows the UI team the exact props). Audio has `NullAudio`, which logs every call.
- **Failure must not crash the app.** `SlotHost` catches errors and falls back to the placeholder, with a warning in the dev panel.
- **Do not edit teammates' data or components to fix a mismatch.** Add an adapter in `src/data/adapters/` or report it to them with the exact error.
- **Derived fallbacks:** if the data lacks `tension`, `interest`, `baseline` or `records`, compute them in `src/data/derived.js`. The data team's values always win.
- **Libraries:** install only what the core needs. When a teammate's module lists extra libraries in `DEPENDENCIES.txt`, install them at integration time.
- **No invented data.** The sample file is clearly marked as sample data.

## 6. Handoffs with Member 2

| Member 2 needs from you | When |
|---|---|
| C1 scaffold on `main` | Hour 1 |
| C2 sample data and `getSnapshot` | Hour 1.5 |
| C3 contracts, registry, placeholders (for connectors) | Hour 4 |
| C5 data tooling (baseline, series, markers) | Hour 6 |

| You need from Member 2 | When |
|---|---|
| Clock store (C4) for the dev panel controls | Hour 4 |
| Connectors and `App.jsx` composition (C8) | Hour 8 |

## 7. Git and logging
- Branch `dev1-platform`. Commit after every finished step: `C3: contracts and placeholders`.
- Merge into `main` at checkpoints (hours 12, 24, 36) and after each integration, after running the app.
- After every step add ONE line to `logs/DEV1_BUILD.txt`:
  `C3 | contracts + registry + placeholders | JSDoc, React | src/contracts, src/integrations, src/slots | app runs with placeholders`

## 8. Usage tips (Claude Code)
- Start a fresh session per step or phase. `CLAUDE.md` reloads automatically.
- Ask for the cheapest working version first.
- Keep about 30 percent of your usage for hours 36-48.

## 9. First prompt to paste
> Read CLAUDE.md and MEMBER1_PLATFORM.md. I am Member 1. Mode: BUILD ONLY. We are on C0, C1 and C2. Give a 3-line plan, then do them: repo hygiene (I will give you the list of files to remove), scaffold Electron + React + Vite with core dependencies only (react, vite, electron, electron-builder, zustand, test tooling), create the folder structure with placeholder files from DEVELOPMENT_PLAN.txt Part 5, add .gitignore (node_modules, dist, release, .env, notes, raw), create logs/, then add data/index.json, a sample city file and a data loader with getCityList, loadCity and getSnapshot. I will push to main after C1 and after C2.
