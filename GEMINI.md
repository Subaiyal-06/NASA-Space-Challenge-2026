# Earth Jukebox: Pakistan (rules for Antigravity)

This file is for **Member 2 (experience track)**, who uses Antigravity. It is read automatically at the start of each session. Keep your answers short and your work focused.

## What we are building
A desktop app (Electron + React + Vite) where a user picks a Pakistani city and hears its climate history, month by month, as music, with a globe intro, weather animations, ambient edge glow, charts, a tension meter, story cards and record badges. The data comes from pre-processed JSON files. Product details are in `README.md`. Your scope and steps are in `MEMBER2_EXPERIENCE.md`.

## Reading rules (save usage)
- **Do not read all of README.md and DEVELOPMENT_PLAN.txt each session.** Read only the section for the current step: the step's block in `DEVELOPMENT_PLAN.txt` (Part 3), the README section it points to, and `MEMBER2_EXPERIENCE.md`.
- Never read `LEARNING_GUIDE.txt`, `BUILD_LOG.txt` or `CLAUDE.md` (they are for other people and tools).
- Do not re-read files you just wrote. Do not paste whole files into replies.

## Priority: a finished, working app comes first
The developers have a limited usage quota and a hackathon deadline. **Learning is postponed until the app is finished.**

**Default mode: BUILD ONLY**
- No lessons, no tutorials, no teach-back questions, no long explanations.
- Before each step: a plan in 3 lines (what, which files, any new library). Then go ahead. In Planning mode keep the implementation plan short.
- Stop and ask only for: a new library outside our stack, deleting files, changing a contract (data format, clock API, audio API), or touching Member 1's folders.
- After each step: append ONE line to `logs/DEV2_BUILD.txt` in this format, and suggest a commit message:
  `S9 | weather components + glow | CSS + canvas | src/weather/* | works, tested with sliders`
- Keep replies short: what was done, how to run it, what to see.

**LEARN PHASE:** only when the developer says "LEARN PHASE" or "deep dive <step>" after the app is done. Then read the build log, the git history and the code of that step, and write a clear lesson (the problem, the thinking, the real code explained line by line with the reasons, an alternative, and common mistakes). One step per request.

Small bug fixes (under about 20 lines) need no log entry beyond one line.

## Ownership (Member 2)
- You own: `src/state/clock.js`, `src/map/`, `src/weather/`, `src/ui/`, layout and styling in `src/App.jsx`.
- Do not edit: `src/audio/`, `pipeline/`, `data/`, `src/data/`, `electron/`. Ask Member 1 first.

## Contracts (change only with both members' agreement)
1. City JSON format: README Section 7.
2. Clock API (`useClock` in `src/state/clock.js`): fields `year`, `month` (0-11), `mode`, `playing`, `speed`, `tension`, `interest`, `cityA`, `cityB`; actions `play`, `pause`, `toggle`, `stepMonth`, `setYear`, `setMonth`, `leap`, `setMode`, `setSpeed`, `selectCity`. One month = 2.5 seconds in Month Mode.
3. Audio API (`src/audio/index.js`, built by Member 1): `start`, `stop`, `setCity`, `setCompare`, `setMonth`, `setLayers`, `setTension`, `setMode`. Never import from deeper inside `src/audio/`.

## Stack
Electron, React, Vite, Zustand (clock), MapLibre GL JS (globe/map), D3 or Chart.js (charts), Tailwind CSS. Audio is Member 1's job (Tone.js). Explain any new package in one line before installing it.

## Engineering rules
- **Use fake sample data first.** Never block on real NASA data.
- **Never invent data.** Every number on screen shows its source. Label projections as "Projection", earthquakes as "USGS (non-NASA)", and the tension index as "our own index". Word records as "in our data".
- **Weather and glow use values compared to normal (anomalies), not raw values.**
- **Ghost weather:** faint dashed copy of the 1981-1990 average for that month. Show only in calm stretches (2+ calm months) with a visible difference. Hide it in eventful months. Provide a "Show the 1980s" toggle.
- **Accessibility from the start:** keyboard access, visible focus, labels, high contrast option, a Reduce Motion toggle. Safe lightning: at most 1 flash every 4 seconds, no rapid flashing. Never rely on color alone.
- **Offline:** the app must work without internet. Keep a local Pakistan outline as a map fallback.
- **Performance:** full weather animation only for the selected city; other cities show a small icon.
- **Audio start:** audio begins only after a user click (the globe Start button calls `audio.start()`).
- **Kid-friendly:** big buttons, short words, clear colors.

## Git
Branch `dev2-experience`. Commit after every finished step (`S9: weather components and glow`). Never push broken code to `main`. Do not commit secrets.

## Antigravity usage tips
- Planning mode for multi-file work (globe, weather set, compare view). Fast mode for small fixes.
- One conversation per step. Do not run several agents on the same files at once.
- If a task will use a lot of quota (large refactor, many files), say so first and offer a cheaper option.
