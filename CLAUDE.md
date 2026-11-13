# Earth Jukebox: Pakistan (instructions for Claude Code)

Read this file at the start of every session. **Do not read all of README.md and DEVELOPMENT_PLAN.txt every time** (they are long and reading them costs usage). Read only the section that matches the current step: the step's block in DEVELOPMENT_PLAN.txt (Part 3) and the README sections it points to (for example the data format in Section 7, the music rules in Section 6, the feature in Section 4).

## What we are building
A desktop app (Electron + React + Vite) where a user picks a Pakistani city and hears its climate history, month by month, as music (Tone.js), with a globe intro, weather animations, ambient edge glow, charts, a tension meter, story cards and record badges. Data comes from pre-processed JSON files made by a Python pipeline from NASA and USGS data. Full details are in README.md.

## Who you are working with
Two members. **You work with Member 1 (Developer 1, engine track: data, sound, packaging).** Read `MEMBER1_ENGINE.md` for the scope, owned folders, contracts and step order. Member 2 (experience track) uses Antigravity with `GEMINI.md`. Work only in Member 1's area. Do not edit Member 2's files (`src/map/`, `src/weather/`, `src/ui/`, `src/state/clock.js`) without saying so and asking first. The developers want to learn from this project, but **learning happens after the app is finished** (see the budget section below).

## PRIORITY AND USAGE BUDGET (read this first; it overrides the teaching rules below)

**Priority 1: a working, finished app. Priority 2: learning.** The developers have a limited Claude usage budget and a hackathon deadline. An unfinished app with detailed lessons is a failure. Never let teaching use up the budget or delay a working feature.

**Learning is postponed until the app is finished.** Modes: the developer switches by saying the mode name. **BUILD ONLY is the default.**

- **BUILD ONLY (default, until the developer says "LEARN PHASE"):**
  - No lessons, no learning file, no teach-back questions, no exercises, no long explanations. Do not create or write `logs/DEV1_LEARNING.txt` during the build.
  - Before each step give a plan in 3 lines (what, which files, any new library), then **go ahead without waiting for approval** (this overrides teaching rule 2). Stop and ask only for: a new library outside our stack, deleting files, changing a contract (data format, clock API, audio API), or touching Member 2's folders.
  - After each step append ONE line to `logs/DEV1_BUILD.txt`, for example: `S6 | tension layers | Tone.js | src/audio/layers.js | works, tested with slider`. Then suggest the commit message. Nothing else.
  - Keep replies short: what was done, how to run it, what to expect to see.
- **LEARN PHASE** (after the app is finished): the developer says "LEARN PHASE" or "deep dive <step>". Read the build log, the git history and the code of that step, then write the lesson using the template below. One step per request, in the order of the build log.

The modes below (LEAN, FAST, DEEP) are lesson sizes for the LEARN PHASE or for when the developer asks for lessons during the build.

- **LEAN** (say "LEAN MODE"):
  - The plan before each step is short (about 8 lines).
  - After the step, write ONE lesson of about 15-20 lines. Cover only the **1-3 key pieces of logic** (for example the clock tick, the scale quantizer, the tension-to-layers mapping). **Do not explain boilerplate or config** (project setup, imports, styling, package files) beyond one line.
  - Use short code snippets, not whole files. One short build-log entry (5-6 lines).
  - Write the lesson and the build-log entry in the same file operation, once per step, not after each command.
- **FAST** (say "FAST MODE"; use in the crunch hours or when usage is running low):
  one paragraph for the lesson (what, why, the one key snippet) and a one-line build-log entry.
- **DEEP** (only when the developer says "deep dive <step>"): the full lesson template below, with a line-by-line walkthrough and exercises. Prefer doing this after the hackathon or when there is spare usage.

Other rules that save usage:
- **Bug fixes and small changes (under about 20 lines)** get one line in the build log and no lesson.
- **Lesson queue:** if time is tight, add one line to the developer's learning file under "LESSON QUEUE" (for example "S7 - rain notes: explain the rainfall to note-count mapping") and move on. The developer can ask for it later.
- Do not paste whole files into replies or logs. Refer to file names and line ranges.
- Do not re-read files you just wrote. Do not re-run long installs or builds without a reason.
- Never read LEARNING_GUIDE.txt or BUILD_LOG.txt (they are for the humans).
- If a task is going to take a lot of usage (large refactor, big data download, many files), say so first and offer a cheaper option.
- Never stop building to write long explanations. Build first, then the short lesson.
- If the developer asks "how much usage will this take?", answer honestly that you cannot see their remaining usage, and suggest FAST mode.

## TEACHING RULES (apply only in the LEARN PHASE or when the developer asks for lessons; in the default BUILD ONLY mode, skip them)

1. **One step at a time.** Work through the steps in DEVELOPMENT_PLAN.txt in order. Do not jump ahead.
2. **Explain before you build.** At the start of each step, tell the developer in plain English:
   - what the step does and why it is needed,
   - which files you will create or change,
   - which libraries you will add and why (never add a library without saying so),
   - what could go wrong.
   Then **wait for approval. Ask once per step, not once per command.** After approval, do the whole step without stopping to ask for confirmation between sequential operations.
3. **Keep it small and simple.** Prefer the smallest working version. Split changes bigger than about 200 lines into smaller steps. Use clear names. Add short comments only where they help a beginner understand why, not what.
4. **Make it checkable.** At the end of every step, give the exact command to run the app or test, and say what the developer should see.
5. **Teach after building.** When a step is finished, append a lesson to the developer's learning file and an entry to the developer's build log (templates below). Do this every time. Do not skip it.
6. **Teaching depth dial.** Before hour 24: full lessons. Hours 24-42: short lessons (5-10 lines) with a note "deep dive later". Never skip a lesson entirely. **The code walkthrough is never cut, even in short lessons.** Only extra background can be shortened.
7. **End every step** with one teach-back question and one "judge-style" question the developer should be able to answer.
8. **If asked "why" or "explain", explain simply.** Use everyday words, short sentences, small analogies. Assume the developer is new to the topic.
9. **Never hide problems.** If something fails or you are unsure, say so, explain the cause in plain words, and propose the smallest fix first. Record real problems in BUILD_LOG.txt Part D (or the developer's build log).
10. **Coding focus: the developers want to learn HOW the code works and WHY it is written that way.** The lessons are mainly about the code, not about the project story. For every important file or function:
   - Show the real code (short pieces, not whole files).
   - Explain it **line by line** in plain words: what each line does and **why it is written this way**.
   - Name the programming concepts used (variable, function, array, object, loop, import/export, async/await, component, props, state, hook, and so on). The first time a concept appears, give a tiny stand-alone example (3-6 lines) before using it in our code.
   - Show the **thinking process**: the problem in plain words, then the steps in plain words (pseudocode), then the code. This is how the developer learns to write it alone.
   - Mention one or two other ways to write it and why we did not use them.
   - Point out common mistakes beginners make with this kind of code, and how to read the error message when it goes wrong.
11. **Write-it-yourself exercises are optional.** Only when the developer says "challenge me", give one small piece of the step to write themselves (for example the function that turns a rainfall value into a number of notes), described in plain words with an example input and output. Do not offer more than once per phase of the build.
12. **Explain errors, don't just fix them.** When code fails, first explain what the error message says, where it comes from and why, then fix it with the smallest change. Add the lesson to the learning file.

## Files you maintain
- `logs/DEV1_LEARNING.txt` or `logs/DEV2_LEARNING.txt` (lessons for that developer)
- `logs/DEV1_BUILD.txt` or `logs/DEV2_BUILD.txt` (what was done, with which tech, and why)
- Create the `logs/` files in step S1 if they do not exist.
- Do NOT edit or read LEARNING_GUIDE.txt or BUILD_LOG.txt unless the developer asks (they are shared master files for the humans). If a new technology is chosen, suggest the line for the BUILD_LOG.txt table and let the developer add it.

### Lesson template (append to the learning file)
```
=== STEP <ID>: <title>   (Developer <1|2>, <date time>) ===
1. The problem in one sentence:
2. The idea in plain English (use an analogy):
3. What we built (each file and what it does):
4. CODE WALKTHROUGH (the heart of the lesson). For each key piece of code:
   a) the thinking: problem -> plain-language steps -> code,
   b) the real code (short),
   c) a line-by-line explanation: what it does and WHY it is written this way,
   d) the programming concepts used (with a tiny example if new),
   e) one other way to write it, and why we did not choose it.
5. Why this technology? (and two alternatives we did not choose):
6. How to run it and what you should see:
7. What could go wrong / common mistakes:
8. New coding concepts and words (each with a 3-line example):
9. Try it yourself (one safe experiment, for example change a number and watch the result):
10. Teach-back question:
11. Judge-style question:
(For "deep dive later" short lessons, write only items 1, 3, 4, 6, 10 and add: DEEP DIVE LATER. Item 4, the code walkthrough, is always kept, but it may be shorter.)
```

### Build log template (append to the build log)
```
STEP:            <ID and title>
DATE / TIME:
DEVELOPER:
PROBLEM:
TECH USED:
FILES CHANGED:
COMMANDS RUN:
RESULT:
DECISION (and alternatives):
OPEN ISSUES:
COMMIT MESSAGE SUGGESTION:
```

## Engineering rules
- **Stack:** Electron, React, Vite, Zustand (global clock), Tone.js (audio), MapLibre GL JS (globe/map), D3 or Chart.js (charts), Tailwind CSS (styling), Python 3 with xarray/pandas/numpy (data pipeline in `pipeline/`).
- **Contracts that must not change without both developers agreeing:** the city JSON format (README Section 7), the global clock API (`src/state/clock.js`), the audio API (`start()`, `stop()`, `setMonth(year, month)`, `setLayers([...])`, `setTension(x)`).
- **Use fake sample data first.** Never block a feature on real NASA data.
- **Never invent data.** Every number in the app must come from a named source. Always label sources on screen. Label projections as "Projection", USGS as non-NASA, and the tension index as "our own index". Word records as "in our data".
- **Weather and glow use values compared to normal (anomalies), not raw values.**
- **Music rules:** A minor only (A B C D E F G), 96 BPM, 4 beats per bar, one bar = one month, chord changes every 3 months, calm loop Am-F-C-G, tense loop Am-F-Dm-E. Quantize every note to the scale. Always put a limiter at the end. Do not copy any melody, recording or sample from existing films or songs. Record the license of any sound sample used.
- **Accessibility:** keyboard access, visible focus, labels, a Reduce Motion setting, and safe lightning (at most 1 flash per 4 seconds, no rapid flashing).
- **Offline:** the app must run without internet. Provide a local fallback for the map.
- **Audio start:** audio must begin only after a user action (Start button), and the Electron autoplay setting should be set as planned in S16.
- **Git:** commit after every finished step with a message like "S5: drone and transport". Developer 1 uses branch `dev1-engine`, Developer 2 uses `dev2-experience`. Never push broken code to `main`.
- **Security basics:** do not commit secrets or passwords (for example the NASA Earthdata login). Keep them in an ignored `.env` file and explain this to the developer when it first matters.
- **Dependencies:** explain every new package and why it is needed before installing it.

## Tone
Friendly, clear, patient, simple English. No jargon without explanation. Short paragraphs. If the developer says they do not understand, explain again in a different way, with an example.
