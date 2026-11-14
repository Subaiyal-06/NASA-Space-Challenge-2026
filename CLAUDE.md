# Earth Jukebox: Pakistan (instructions for Claude Code)

Read this file at the start of every session. **Do not read all of README.md and DEVELOPMENT_PLAN.txt every time** (reading costs usage). Read only the section that matches the current step: the step's block in `DEVELOPMENT_PLAN.txt` Part 4, the contracts in Part 3, and the README sections it points to.

## What we are building (scope)
A desktop app (Electron + React + Vite) where a user picks a Pakistani city and explores its climate history month by month. The project has 6 team members. **You work with Member 1, who builds only the APP CORE with Member 2.** The app core is: project setup, Electron shell, packaging and offline behavior, the data layer, the global clock and modes, app logic, and a **plug-in system** (contracts, registry, placeholders, connectors, dev panel).

**Do NOT build:** music or sound code, UI/UX components or styling, designs, city data files, stories, slides, or anything else belonging to the other teammates. They deliver those as standalone modules that follow our contracts and we plug them in. If a task seems to need one of these, build a placeholder or a contract instead and say so.

## Who you are working with
You work with **Member 1 (platform, data layer, integration)**. Read `MEMBER1_PLATFORM.md` for scope, owned folders, step order and handoffs. Member 2 (clock, app logic, connectors) uses Antigravity with `GEMINI.md`. Work only in Member 1's folders. Do not edit Member 2's files (`src/App.jsx`, `src/state/`, `src/app/`) without saying so and asking first.

## PRIORITY AND USAGE BUDGET
**Priority 1: a working, finished app. Priority 2: learning.** The developers have a limited usage budget and a hackathon deadline. Never let explanations or lessons use up the budget or delay a working feature.

**Learning is postponed until the app is finished. BUILD ONLY is the default mode.**

- **BUILD ONLY (default):**
  - No lessons, no learning files, no teach-back questions, no exercises, no long explanations.
  - Before each step give a plan in 3 lines (what, which files, any new library), then **go ahead without waiting for approval**. Stop and ask only for: a new library outside our stack, deleting files, changing a contract (data format, data API, clock API, audio contract, UI slot contract), or touching Member 2's folders.
  - After each step append ONE line to `logs/DEV1_BUILD.txt`, for example: `C3 | contracts + registry + placeholders | JSDoc, React | src/contracts, src/integrations, src/slots | app runs with placeholders`. Then suggest the commit message. Nothing else.
  - Keep replies short: what was done, how to run it, what to expect to see.
- **LEARN PHASE** (after the app is finished): the developer says "LEARN PHASE" or "deep dive <step>". Read the build log, the git history and the code of that step, then write a lesson: the problem, the thinking in plain steps, the real code explained line by line with the reasons, one other way to do it, and common mistakes. One step per request. Keep lesson files outside the repo (or in the ignored `notes/` folder). Sizes: LEAN (about 15-20 lines per step, key logic only), FAST (one paragraph), DEEP (full walkthrough with exercises, only when asked).

Other rules that save usage:
- Bug fixes and small changes (under about 20 lines) need no lesson and only a one-line log entry.
- Do not paste whole files into replies. Do not re-read files you just wrote. Do not re-run long installs or builds without a reason.
- Never read `LEARNING_GUIDE.txt` or `BUILD_LOG.txt` if they exist (they are the developer's personal notes).
- If a task will use a lot of usage, say so first and offer a cheaper option.
- You cannot see the developer's remaining usage; suggest keeping it short when asked.

## Engineering rules
- **Stack:** Electron, React, Vite, Zustand, electron-builder, a test runner (Vitest or similar). **Install only core dependencies.** Libraries needed by a teammate's module (for example for sound, maps or charts) are installed at integration time, from the DEPENDENCIES.txt that comes with the module. Explain any new package in one line before installing.
- **Contracts** (details in `DEVELOPMENT_PLAN.txt` Part 3) must not change without both developers agreeing: the data contract, the data API (`src/data/api.js`), the clock API, the audio contract, and the UI slot contract. Write contracts as JSDoc types plus validator functions with clear error messages.
- **Plug-in rule:** teammates' modules (audio, UI components, data) are plugged in **only** through `src/integrations/index.js`. Never import their code anywhere else. Every slot and the audio engine have placeholders (grey boxes printing their props as JSON; `NullAudio` logging calls) so the app always runs. Wrap every slot in an error boundary (`SlotHost`) that falls back to the placeholder and reports a warning.
- **Never edit a teammate's data or components to fix a mismatch.** Use an adapter in `src/data/adapters/` or report the exact difference.
- **Nobody reads the city JSON files directly.** Everything goes through the data API. If optional fields (tension, interest, baseline, records) are missing, compute fallbacks in `src/data/derived.js`; the data team's values win when present.
- **Never invent data.** The sample city file is clearly marked as sample data. Every real number comes from a named source in the JSON.
- **Offline:** the app must run without internet.
- **Repo hygiene:** the repo contains only code and development files (see `DEVELOPMENT_PLAN.txt` Part 1). Never add slides, videos, design files, raw data, unused samples, installers or personal notes. Never commit secrets; keep them in an ignored `.env`.
- **Git:** commit after every finished step (`C3: contracts and placeholders`). Branch `dev1-platform`. Never push broken code to `main`. Run `git pull origin main` before each step. Package changes are committed on their own and merged to `main` straight away.
- **Testing:** unit tests for the data layer, validators and anything with logic. The dev panel (`/dev`) has contract tests for plugged-in modules.

## Tone
Friendly, clear, patient, simple English. Short replies. No jargon without a one-line explanation. If the developer says they do not understand, explain again in a different way with an example.
