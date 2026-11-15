# Integration guide for teammates

_Generated from the contracts in `src/contracts/` by `npm run docs`. Do not edit by hand._

We (Member 1 and Member 2) build the **app core**. You deliver one of three parts as a **standalone module**, and we plug it in through the registry. You never need to touch our code, and we never edit your files. If something does not fit, we add a small adapter on our side or send you the exact error message.

| You are the | You deliver | Section |
|---|---|---|
| Music teammate | One audio module | [Music](#1-music-module) |
| Data teammate | City JSON files (and story texts) | [Data](#2-data-files) |
| UI/UX teammate | React components, one per slot | [UI/UX](#3-uiux-components) |

## What NOT to send
Slides, videos, drafts, screenshots, design files, raw downloads, notebooks, unused samples, passwords or tokens. Send **only the final files** the app needs. If your module needs extra libraries, list them in a `DEPENDENCIES.txt` next to it (one package per line).

## How to test your piece on its own
Every contract ships with sample data and placeholders, so you can build without waiting for anyone:
- **UI:** render your component with the example props below. They are also exported as `SAMPLE_PROPS` from `src/contracts/ui.js`.
- **Music:** call your engine's methods with the example payload below.
- **Data:** run `npm run check-data`. It prints OK or the exact problem.

When your piece is ready, we run **contract tests** in the app's dev panel and tell you PASS or the exact error. You can run them too: `npm run web`, then open `http://localhost:5173/#/dev` and click "Run contract tests".

---

## 1. Music module

**Where it goes:** `src/integrations/audio/`. The entry file **default-exports a factory** `createAudioEngine()` that returns an engine object.

**Rules**
- The engine never reads our store or the JSON files. It only uses the data it is given.
- Audio may only start after a user click: `start()` is called from the Start button.
- Never play a note outside your scale, and always end with a limiter so sound never gets harshly loud.
- Do not copy any melody, recording or sample from existing songs or films. Record the licence of every sample.
- Tempo never changes. During skipping, hold the drone and play a soft riser; restart on the bar line.

**Required methods:** `start`, `stop`, `setMonth`, `setLayers`, `setMode`, `setPacing`, `setMuted`
**Optional methods:** `setCity`, `setCompare`, `setTension`, `dispose`, `getLevels`

| Method | Arguments | Meaning |
|---|---|---|
| `start()` | none (async) | Begin audio. Called from a user click. |
| `stop()` | none | Silence everything. |
| `setMonth(payload)` | payload below | Called every time the clock moves to a new month. |
| `setLayers(ids)` | ids from `temperature`, `rainfall`, `drought`, `quakes`, `air` | Which categories are switched on. |
| `setMode(mode)` | `"month"`, `"year"` or `"story"` | Playback mode. |
| `setPacing(state)` | `"normal"` or `"skipping"` | Skipping = a quiet stretch is being skipped. |
| `setMuted(bool)` | boolean | Mute or unmute. |
| `setTension(x)` | 0 to 1 | Optional: lets a test slider set the tension. |
| `getLevels()` | none | Optional: what is coming out right now, for the visualizer: `{ frequency: [0..1, low to high], waveform: [-1..1] }`. Return `null` if there is no sound yet. |

**`setMonth` payload** (`month` is 0-11, 0 = January):
```json
{
  "year": 1981,
  "month": 5,
  "mode": "month",
  "tension": 0.3,
  "interest": 0.2,
  "snapshotA": {
    "year": 1981,
    "month": 5,
    "isProjection": false,
    "layers": {},
    "tension": 0.3,
    "interest": 0.2
  },
  "snapshotB": null
}
```

**What a snapshot contains** (`snapshotA` and `snapshotB`; `snapshotB` is `null` unless two cities are being compared, then play city A in the left ear and city B in the right):
```js
{
  year, month, isProjection,
  layers: {
    temperature: { available, anomaly, value },   // anomaly = degrees C compared to normal
    rainfall:    { available, percentile, value }, // percentile 0-100 for that calendar month, value in mm
    drought:     { available, spi },               // negative = drier than normal
    air:         { available, aod },               // 0-1 haze level
    quakes: [ { magnitude, depth, lat, lon } ]
  },
  tension,   // 0-1, our own index
  interest   // 0-1, how unusual the month is
}
```
If `available` is false, that layer must be **silent** (its data starts later: the orchestra grows as real measurements begin). Use anomalies and percentiles, not raw values.

---

## 2. Data files

**Where they go:** `data/cities/<id>.json`, listed in `data/index.json`:
```json
[ { "id": "karachi", "name": "Karachi", "lat": 24.86, "lon": 67.0, "file": "cities/karachi.json" } ]
```

**City file shape** (full explanation: README, Section 7):
```js
{
  "city": "Karachi", "lat": 24.86, "lon": 67.0,
  "layers": {
    "temperature": { "source": "NASA POWER ...", "unit": "C anomaly vs 1981-2010", "startYear": 1981,
                     "monthly": { "1981": [ 12 numbers, January first ] } },
    "rainfall":    { "source": "...", "unit": "mm/month", "startYear": 1981,
                     "normals": [ 12 monthly averages ], "monthly": { "1981": [ 12 numbers ] } },
    "drought":     { "source": "...", "startYear": 1981, "monthly": { } },
    "air":         { "source": "...", "startYear": 2000, "monthly": { } },
    "earthquakes": { "source": "USGS ComCat", "events": [ { "year": 2005, "month": 10, "mag": 7.6, "depth": 26, "lat": 34.5, "lon": 73.6 } ] }
  },
  "tension": { "1981": [ 12 numbers 0-1 ] },     // optional
  "interest": { "1981": [ 12 numbers 0-1 ] },    // optional
  "baseline": { "temperature": [ 12 ], "rainfall": [ 12 ] },   // optional, 1981-1990 average
  "records": [ { "year": 2015, "month": 6, "layer": "temperature", "text": "Hottest June in our data" } ],  // optional
  "projection": { "source": "NASA NEX-GDDP-CMIP6", "scenarios": ["ssp245","ssp585"],
                  "temperature": { "ssp245": { "2050": 1.8 } } }     // optional
}
```

**Rules**
- Every layer is **optional**. If you do not have a layer, leave it out. Never fill it with made-up numbers.
- Every layer needs a `source` (the real dataset name), a `startYear` and a `unit`.
- Monthly arrays have exactly 12 numbers (January first). Earthquake `month` is 1-12.
- Weather values are **compared to normal** (anomalies), so include `normals` for rainfall.
- **Extra layers are welcome** (for example `vegetation` = greenery, `aqi`, `nightlights`). Add them to the `layers` object with a `source`, `unit` and `startYear`, plus either `monthly` (`{ "2001": [12 numbers] }`) or `yearly` (`{ "2012": 41.5 }`, for annual data such as night lights). No code change is needed: the app reads them through `getExtras(city, year, month)` and `getSeries(city, "vegetation", from, to)`.
- Earthquakes of any size may stay in the file, but the app only reports magnitude **5.5 and above** (a setting in `src/data/config.js`), so a very active region does not shake every month.
- A `projection` **must name its source**, and the numbers must be real model output **for that city**. A projection without a source is ignored by the app.
- Record texts always say "in our data". Label earthquakes as USGS (non-NASA).
- Optional parts (`tension`, `interest`, `baseline`, `records`) are calculated by the app if missing. **Your values win** when present.
- Stories (optional): `data/stories.json`, a list of `{ "id", "year", "month", "title", "text", "source", "cities": ["karachi"] }`. Each story needs a real source link.

**Check before you send:** run `npm run check-data`.

---

## 3. UI/UX components

**Where they go:** `src/integrations/ui/`, **one file per slot**, default-exported, named after the slot (for example `Timeline.jsx`).

**Rules**
- A component is a **pure React component**: it receives only props. No global state, no imports from our code, no data fetching.
- Every slot also receives `reduceMotion`. When true, turn animation down (no shaking, no flashing, no fast motion).
- Never rely on colour alone: always add a text label.
- Kid-friendly: big buttons, short words, clear colours. Keyboard access and visible focus.
- Label things honestly: projections as "Projection, not measurement", earthquakes as "USGS (non-NASA)", the tension index as "our own index".
- Styling and animation are entirely your job. We only check that the component fits the contract.

The 11 slots and their exact props:

### GlobeIntro

The opening screen: Earth zooms into Pakistan and city markers appear. Call `onStart()` when the user presses Start (this is the click that lets audio begin), and `onSelectCity(id)` when a city is chosen. Must work offline: use a local Pakistan outline when map tiles are unavailable.

Required props: `cities`, `onStart`, `onSelectCity` (and always `reduceMotion`).

Example props:
```json
{
  "cities": [
    {
      "id": "karachi",
      "name": "Karachi",
      "lat": 24.86,
      "lon": 67
    }
  ],
  "onStart": "[function]",
  "onSelectCity": "[function]",
  "reduceMotion": false
}
```

### Timeline

Play, pause, step, scrubber, mode switch, speed and leap buttons. `markers` = `{ stories, badges }` to show as pins and stars. `pacing` is `"skipping"` while quiet months are being skipped (show a small "Skipping quiet months" label).

Required props: `year`, `month`, `startYear`, `endYear`, `mode`, `playing`, `speed`, `pacing`, `markers`, `onToggle`, `onStep`, `onSeek`, `onLeap`, `onModeChange`, `onSpeedChange` (and always `reduceMotion`).

Example props:
```json
{
  "year": 1981,
  "month": 5,
  "startYear": 1900,
  "endYear": 2025,
  "mode": "month",
  "playing": false,
  "speed": 1,
  "pacing": "normal",
  "markers": {
    "stories": [],
    "badges": []
  },
  "onToggle": "[function]",
  "onStep": "[function]",
  "onSeek": "[function]",
  "onLeap": "[function]",
  "onModeChange": "[function]",
  "onSpeedChange": "[function]",
  "reduceMotion": false
}
```

### WeatherLayer

Weather animation for one city. All values are compared to normal (anomalies and percentiles), never raw values. `ghost` is `null` or the 1981-1990 average to draw faintly (dashed, low opacity). Only the `selected` city gets the full animation; others show a small icon.

Required props: `cityId`, `selected`, `year`, `month`, `conditions`, `ghost` (and always `reduceMotion`).

Example props:
```json
{
  "cityId": "karachi",
  "selected": true,
  "year": 1981,
  "month": 5,
  "conditions": {
    "heatAnomaly": 0.8,
    "rainPercentile": 55,
    "spi": -0.4,
    "aod": 0.2,
    "quake": null
  },
  "ghost": null,
  "reduceMotion": false
}
```

### AmbientGlow

Soft glow around the screen edges. `states` are blended by `strength` (0-1). Pulse once per bar using `beatPhase` (0-1). Safe lightning only: at most one flash every 4 seconds.

Required props: `states`, `side`, `beatPhase` (and always `reduceMotion`).

Example props:
```json
{
  "states": [
    {
      "type": "hot",
      "strength": 0.6
    }
  ],
  "side": "both",
  "beatPhase": 0,
  "reduceMotion": false
}
```

### Charts

Line charts with a moving cursor, plus earthquake bars. `series` holds arrays of `{ year, month, value }` per layer.

Required props: `series`, `year`, `month`, `layers`, `mode` (and always `reduceMotion`).

Example props:
```json
{
  "series": {
    "temperature": [
      {
        "year": 1981,
        "month": 5,
        "value": 0.4
      }
    ]
  },
  "year": 1981,
  "month": 5,
  "layers": [
    "temperature"
  ],
  "mode": "month",
  "reduceMotion": false
}
```

### TensionMeter

Shows `tension` (0-1). Label it "our own index". `interest` (0-1) is how unusual the month is.

Required props: `tension`, `interest` (and always `reduceMotion`).

Example props:
```json
{
  "tension": 0.3,
  "interest": 0.2,
  "reduceMotion": false
}
```

### LayerToggles

One switch per layer. When `available` is false show `reason` (for example "NASA rainfall data starts in 1980") and disable the switch.

Required props: `layers`, `onToggle` (and always `reduceMotion`).

Example props:
```json
{
  "layers": [
    {
      "id": "temperature",
      "label": "temperature",
      "available": true,
      "reason": null,
      "enabled": true
    },
    {
      "id": "rainfall",
      "label": "rainfall",
      "available": true,
      "reason": null,
      "enabled": true
    },
    {
      "id": "drought",
      "label": "drought",
      "available": true,
      "reason": null,
      "enabled": true
    },
    {
      "id": "quakes",
      "label": "quakes",
      "available": true,
      "reason": null,
      "enabled": true
    },
    {
      "id": "air",
      "label": "air",
      "available": true,
      "reason": null,
      "enabled": true
    }
  ],
  "onToggle": "[function]",
  "reduceMotion": false
}
```

### StoryCard

A short story about a real event. `story` is `null` when nothing should show. Show the source link.

Required props: `story`, `onClose` (and always `reduceMotion`).

Example props:
```json
{
  "story": null,
  "onClose": "[function]",
  "reduceMotion": false
}
```

### BadgeToast

A short record badge, for example "Hottest June in our data". `badge` is `null` when nothing should show.

Required props: `badge` (and always `reduceMotion`).

Example props:
```json
{
  "badge": null,
  "reduceMotion": false
}
```

### CompareView

Two cities side by side with a "Change Since" summary and a start-year control. `summary` is a ready-made sentence.

Required props: `cityA`, `cityB`, `summary`, `changeSince`, `startYear`, `onStartYearChange` (and always `reduceMotion`).

Example props:
```json
{
  "cityA": "karachi",
  "cityB": "lahore",
  "summary": "",
  "changeSince": {},
  "startYear": 1981,
  "onStartYearChange": "[function]",
  "reduceMotion": false
}
```

### Legend

Explains what each sound or picture means. `explanation` is a plain sentence for the "What am I hearing?" button.

Required props: `layers`, `explanation` (and always `reduceMotion`).

Example props:
```json
{
  "layers": [
    {
      "id": "temperature",
      "label": "temperature",
      "available": true,
      "reason": null,
      "enabled": true
    },
    {
      "id": "rainfall",
      "label": "rainfall",
      "available": true,
      "reason": null,
      "enabled": true
    },
    {
      "id": "drought",
      "label": "drought",
      "available": true,
      "reason": null,
      "enabled": true
    },
    {
      "id": "quakes",
      "label": "quakes",
      "available": true,
      "reason": null,
      "enabled": true
    },
    {
      "id": "air",
      "label": "air",
      "available": true,
      "reason": null,
      "enabled": true
    }
  ],
  "explanation": "",
  "reduceMotion": false
}
```

---

## What happens next
1. Send your final files to Member 1 (a zip is fine, or a GitHub pull request).
2. We plug them in one at a time through `src/integrations/index.js`, run the contract test, and check them in the real flow.
3. If something breaks, we remove that one line and the app works again, and we send you the exact error text.
