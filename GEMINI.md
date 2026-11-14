# Earth Jukebox: Pakistan (rules for Antigravity)

This file is for **Member 2 (clock, app logic and connectors)**, who uses Antigravity. It is read automatically at the start of each session. Keep your answers short and your work focused.

## What we are building (scope)
A desktop app (Electron + React + Vite) where a user picks a Pakistani city and explores its climate history month by month. The project has 6 team members. **You and Member 1 build only the APP CORE:** project setup, Electron shell, packaging, the data layer, the global clock and modes, app logic, and a **plug-in system** (contracts, registry, placeholders, connectors, dev panel). Your scope and steps are in `MEMBER2_APP_LOGIC.md`.

**Do NOT build:** music or sound code, UI/UX components or styling, designs, city data files, stories, slides, or anything belonging to the other teammates. They deliver standalone modules that follow our contracts and we plug them in. If a task seems to need one of these, build a placeholder or a connector instead and say so.

## Reading rules (save usage)
- **Do not read all of README.md and DEVELOPMENT_PLAN.txt each session.** Read only the section for the current step: the step's block in `DEVELOPMENT_PLAN.txt` Part 4, the contracts in Part 3, and `MEMBER2_APP_LOGIC.md`.
- Never read `LEARNING_GUIDE.txt`, `BUILD_LOG.txt` or `CLAUDE.md`.
- Do not re-read files you just wrote. Do not paste whole files into replies.

## Priority: a finished, working app comes first
The developers have a limited usage quota and a hackathon deadline. **Learning is postponed until the app is finished.**

**Default mode: BUILD ONLY**
- No lessons, no tutorials, no teach-back questions, no long explanations.
- Before each step: a plan in 3 lines (what, which files, any new library). Then go ahead. In Planning mode keep the implementation plan short.
- Stop and ask only for: a new library outside our stack, deleting files, changing a contract (data format, data API, clock API, audio contract, UI slot contract), or touching Member 1's folders.
- After each step: append ONE line to `logs/DEV2_BUILD.txt` and suggest a commit message, for example:
  `C4 | global clock | Zustand | src/state/clock.js | month ticks every 2.5s, tests pass`
- Keep replies short: what was done, how to run it, what to see.

**LEARN PHASE:** only when the developer says "LEARN PHASE" or "deep dive <step>" after the app is done. Then read the build log, the git history and the code of that step, and write a clear lesson (the problem, the thinking, the real code explained line by line with the reasons, an alternative, and common mistakes). One step per request. Keep lesson files outside the repo (or in the ignored `notes/` folder).

Small bug fixes (under about 20 lines) need only a one-line log entry.

## Ownership (Member 2)
- You own: `src/App.jsx`, `src/state/` (clock, pacing, events), `src/app/` (connectors, flow, compare, keyboard, announcer), and tests for your code.
- Do not edit (ask Member 1 first): `electron/`, `src/main.jsx`, `src/contracts/`, `src/integrations/`, `src/slots/`, `src/data/`, `src/settings/`, `src/dev/`, `data/`, `docs/`.

## Contracts (change only with both members' agreement; details in `DEVELOPMENT_PLAN.txt` Part 3)
1. Data API (`src/data/api.js`, built by Member 1): `getCityList`, `loadCity`, `getRange`, `getSnapshot`, `getBaselineSnapshot`, `getSeries`, `getMarkers`. **Never read the city JSON files directly.**
2. Clock API (you build it in `src/state/clock.js`): state `year`, `month` (0-11), `mode`, `playing`, `speed`, `pacing`, `tension`, `interest`, `cityA`, `cityB`, `scenario`, `futureEnabled`, `layers`; actions `play`, `pause`, `toggle`, `stepMonth`, `setYear`, `setMonth`, `seek`, `leap`, `setMode`, `setSpeed`, `selectCity`, `setLayers`; events `tick`, `story`, `badge`, `quake`, `pacing`, `calm`, `cityChange`. One month = 2.5 seconds in Month Mode.
3. Audio contract: the audio engine only receives plain data (`setMonth({ year, month, mode, tension, interest, snapshotA, snapshotB })`, `setLayers`, `setMode`, `setPacing`, `setMuted`, `start`, `stop`). Until the music module arrives you talk to `NullAudio`.
4. UI slot contract: UI components are pure and receive only props. Your connectors read the clock, data and settings and pass the props.

## Engineering rules
- **Stack:** Electron, React, Vite, Zustand, a test runner. Install only core dependencies; extra libraries come with a teammate's module at integration time. Explain any new package in one line before installing.
- **Plug-in rule:** teammates' modules are plugged in only through `src/integrations/index.js`. Every slot and the audio engine have placeholders so the app always runs. Wrap every slot in `SlotHost` (error boundary).
- **Never edit a teammate's data or components to fix a mismatch.** Ask Member 1 for an adapter or report the exact difference.
- **Logic rules:** calm month = interest below about 0.25, eventful above about 0.5. Ghost weather needs 2+ calm months in a row and a visible difference from the 1981-1990 baseline, and is hidden in eventful months. Smart pacing only in Story Mode: compress calm stretches of 3+ months to about 1 s per month; Month Mode never skips; emit `pacing` events. Layers are `available: false` before their start year, with a short reason.
- **Weather and glow props use values compared to normal** (anomalies, percentiles), never raw values.
- **Labels:** flag projection years with `isProjection`; earthquakes are labeled USGS (non-NASA); the tension index is "our own index"; badge texts say "in our data".
- **Accessibility logic:** keyboard shortcuts, a voice announcer (on/off setting), and a reduce-motion state passed to every slot.
- **Never invent data.** **Offline:** the app must run without internet.
- **Repo hygiene:** only code and development files in the repo. No slides, videos, designs, raw data, installers or personal notes. Never commit secrets.
- **Testing:** write unit tests for the clock, pacing, events, prop builders and compare logic.

## Git
Branch `dev2-app-logic`. Commit after every finished step (`C4: global clock`). Run `git pull origin main` before each step. Never push broken code to `main`. Package changes are committed on their own and merged to `main` straight away.

## Antigravity usage tips
- Planning mode for multi-file work (clock, connectors). Fast mode for small fixes.
- One conversation per step. Do not run several agents on the same files at once.
- If a task will use a lot of quota, say so first and offer a cheaper option.
