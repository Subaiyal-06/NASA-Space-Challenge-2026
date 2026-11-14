# Earth Jukebox: Pakistan
### "Listen to Pakistan's climate, month by month."

NASA Space Apps Challenge 2026 | Team Plan and Project Brief (Version 3)

**What changed from Version 1:**
- It is now a **desktop app** (not a website).
- New: **globe intro** that zooms into Pakistan, and **weather animations** on the map for kids.
- New: **month-by-month timeline** (about 2.5 seconds per month).
- Removed: old Feature 9 (uncertainty sound) and old Feature 12 (Urdu toggle).
- New: a **Music Guide for people with no music background** (Section 6), with an Interstellar-style build-up.
- Team roles updated (Section 9).
- **Version 3 adds:** an **ambient edge glow** (Feature 6A) and **quiet-month storytelling** (Feature 6B: ghost weather, smart pacing, record badges, plus optional extras).

---

> Trimmed for the code repo: only the sections the app core needs (1, 2, 4, 5, 7, 8). The rest lives outside the repo.

## 1. The Idea in One Paragraph

Earth Jukebox: Pakistan is a desktop app where you start from space, watch the Earth zoom into Pakistan, and tap a city. Then you press play and **hear that city's climate history as a piece of music**. Each month lasts about 2.5 seconds. Temperature, rainfall, drought, earthquakes and air quality each become an instrument. At the same time the map shows sun, clouds, rain, haze and earthquake ripples over the city, and graphs show the real numbers. You can compare two cities (one in each ear) and even listen to NASA's climate projections for 2050 and 2100. As the climate "stress" rises, the music slowly builds and becomes tense, like a film score.

**Pitch line:** *"Charts are for eyes. Climate change is something you can also hear, and in Pakistan you can hear it getting louder."*

---

## 2. Honest Reality Check About NASA Data (Read This First)

Judges check data use. This table shows what data actually exists, so we never claim something we cannot prove.

| Category | Best source | Starts | Notes |
|---|---|---|---|
| Temperature (long history) | NASA GISS GISTEMP v4 (gridded, monthly) | 1880 | Coarse grid (about 2 degrees). Gives *anomalies* (change vs. a baseline), not exact city temperature. Nearby cities can share one grid cell. |
| Temperature (detailed) | NASA POWER / MERRA-2 | 1980/81 | Monthly and daily, city level. |
| Rainfall | NASA POWER, MERRA-2, GPM IMERG | 1980 / 2000 | **No NASA rainfall before 1980.** |
| Drought / soil moisture | MERRA-2, GLDAS, GRACE | 1980 / 2000 / 2002 | We can also compute a drought index (SPI) from rainfall. |
| Air quality / smoke | MERRA-2 aerosols, MODIS AOD, TROPOMI | 1980 / 2000 / 2018 | Good for the "smoke and haze" comparison. |
| Earthquakes | USGS ComCat (not NASA, standard source) | about 1900 | Older records are complete only for bigger quakes. We say this on screen. |
| Future climate | NASA NEX-GDDP-CMIP6 | to 2100 | Model projections, not measurements. Label them clearly. |

**What this means:**
- A timeline from the 1900s works only for temperature and earthquakes. The other layers start later.
- That is fine. It becomes a feature: **the orchestra grows** as real measurements begin (Feature 3).
- Comparing cities **before 1980** is weak for temperature (coarse grid). Our compare mode defaults to 1981 onward.
- Always label non-NASA data ("USGS") and projections ("Projection, not measurement").

---

## 4. Feature List (Detailed)

Priority: **[MUST]** needed for the demo, **[SHOULD]** adds a lot, **[COULD]** only if time remains.

### Feature 1: Globe Intro and City Markers [MUST]
- App opens on a rotating Earth. A "Start" button makes the camera fly in to Pakistan.
- When it arrives, city markers **pop up one by one** with a small bounce (and a soft "pop" sound).
- **Starter cities (5):** Karachi, Lahore, Islamabad, Peshawar, Quetta. Add Multan, Hyderabad, Faisalabad, Gilgit if time allows.
- Tapping a marker selects the city and loads `data/cities/<city>.json`.
- **How:** MapLibre GL JS with globe view and `flyTo()` camera animation. Marker animation with simple CSS. Use NASA GIBS (Blue Marble) map tiles when online. Always keep a **local Pakistan outline file (GeoJSON)** as an offline fallback so the app never shows a blank map.

### Feature 2: Timeline Player (Month by Month) [MUST]
- Works like a video player: play, pause, skip forward and backward, replay, draggable scrubber.
- **Three playback modes:**

| Mode | Speed | Used for |
|---|---|---|
| Month Mode | about 2.5 seconds per month (30 seconds per year) | Detailed listening, story moments |
| Year Mode (overview) | about 2 seconds per year | Going through decades quickly |
| Leap buttons | jump 5 or 10 years, then continue | Skipping around |

- **Why three modes?** At 2.5 seconds per month, 1981 to 2025 takes about 22 minutes, and 1900 to 2025 takes over an hour. Too long for a demo. Month Mode is for "zooming into" years. Year Mode uses yearly averages and plays one chord per year.
- **Story Mode** (auto): plays in Year Mode and automatically slows to Month Mode at story markers. It also uses **Smart Pacing** (Feature 6B) to skip long quiet stretches. This is what we use for the 2-minute demo.
- Keyboard: Space = play/pause, Left/Right = step, Up/Down = speed.
- **How:** one global "clock" (year, month, playing, mode). Audio, charts, map animations and the tension meter all read this clock. **Build this first.**

### Feature 3: The Orchestra Grows [MUST]
- Each layer has a start year. Before it, the instrument is silent and its toggle shows a note ("NASA rainfall data starts in 1980").
- When the playhead reaches the start year, the instrument fades in with a label "New instrument: Rainfall".
- **How:** `startYear` per layer in the JSON.

### Feature 4: Music and Sonification Engine [MUST]
Full explanation is in **Section 6**. In short: a calm, Interstellar-style base (drone, slow arpeggio, organ-like pad, strings) whose layers increase with the Climate Tension index, plus data instruments (rain, quakes, air, drought) on top.
- Each month = one musical bar = 2.5 seconds.
- Every 3 months the chord changes, so one year = one loop of 4 chords (like 4 seasons).
- Layer toggles: user can enable one or more categories.

### Feature 5: Sound Meets Data Panel + Tension Meter [MUST]
- While a sound plays, its graph highlights live (moving cursor, quake bars, temperature gauge).
- A legend explains each sound ("higher pitch = warmer than normal").
- A "What am I hearing?" button gives one plain sentence.
- A **Tension Meter** (a simple bar or gauge) shows the current stress level. It rises as the music builds.
- **How:** D3.js or Chart.js, reading the global clock.

### Feature 6: Weather Animations on the Map [MUST for the kids' experience]
Each category is also **shown** over the city, not only heard.

| Condition | What the child sees | Rule (based on data) |
|---|---|---|
| Rain | Clouds and falling drops. Heavier rain gives darker clouds. Very heavy rain adds lightning. | Monthly rainfall compared with that city's normal for that month. |
| Heat | A sun that grows bigger, redder and shimmers. Cooler than normal gives a pale sun with a blue tint. | Temperature anomaly. |
| Drought | Dry, brown, cracked-ground tint on the city marker. | Low drought index (SPI). |
| Earthquake | Ripple rings spreading from the epicenter, plus a tiny screen shake. Bigger magnitude = bigger rings. | Quake magnitude. |
| Smoke / air | Grey-brown haze overlay. | Aerosol value. |

- **Important rule:** use values **compared to normal** (anomalies), not raw values. Otherwise Karachi would show a sun every summer and a child learns nothing. The animation should mean "hotter or wetter than usual".
- Selected city gets the full animation. Other cities show a small weather icon only (keeps the app fast).
- Animations are simple and light: CSS for sun glow, a small canvas for rain drops, optional Lottie files for clouds and lightning.

### Feature 6A: Ambient Edge Glow [SHOULD]
A soft, blurred glow around the screen edges that matches the weather, like the ambient light YouTube shows around its video. Colors blend smoothly (about 1.5 seconds) when conditions change.

| Condition | Edge glow |
|---|---|
| Heavy rain | Dark grey-blue, with an occasional soft lightning flash at the edges |
| Light rain | Pale blue-grey |
| Hot | Bright yellow-orange, stronger as the anomaly grows |
| Cooler than normal | Cool pale blue |
| Drought | Dusty brown |
| Smoke / haze | Grey-brown |
| Earthquake | One short amber pulse, together with the ripple and screen shake |

Rules:
- **Blend, don't switch.** If it is hot and smoky, mix the colors by their strength.
- **Breathe with the music.** The glow pulses slowly, once per bar (every 2.5 seconds), and faster when tension is high.
- **Compare mode:** the left edge shows City A and the right edge shows City B, matching the stereo audio.
- **Safe lightning.** Soft and rare: at most 1 flash every 4 seconds, never rapid flashing. Add a **"Reduce motion"** toggle and respect the system setting.
- **Never rely on color alone.** The text label ("Rainy month") and the sound still carry the information.
- **How:** one fixed full-screen layer behind the app (`pointer-events: none`) with CSS gradients. The clock sets CSS variables and the browser animates between them. Avoid heavy blur on large areas (performance). **Owner: Person 6.**

### Feature 6B: Quiet-Month Storytelling [SHOULD]
**Problem:** in places like Karachi, many months look the same (sunny, nothing new). The app must keep the audience interested without faking drama. The calm is real, and it makes the big events hit harder. So we give viewers *true* reasons to care.

**The Interest Score.** The data pipeline gives every month an "interest" value from 0 to 1: the biggest of these, each scaled 0-1: temperature distance from normal, rainfall distance from normal, drought severity, earthquake size (nearby), and haze level. The app uses it like this:
- **Calm month:** interest below about 0.25 (tunable).
- **Eventful month:** interest above about 0.5.
- A calm stretch only counts when there are **2 or more calm months in a row** (3 or more for skipping), so things do not flicker.

**Tool 1: Ghost Weather.**
- When the app detects a calm stretch, a faint **"ghost" of the 1980s weather** fades in next to the real weather. Example: a pale dashed sun (the 1981-1990 average for that month) sits beside the actual, bigger, redder sun. The caption says: *"Karachi, June: +1.8 C hotter than the 1980s."*
- It works for every layer: ghost sun (temperature), ghost cloud and rain (rainfall), ghost haze (air).
- **Hidden in eventful months.** When something big happens (a flood, a quake), the event is the story, so no ghost.
- **Hidden when there is no visible difference.** In the 1980s themselves, or when the month matches the old average, show a short caption instead (for example "Same as the 1980s").
- **Baseline:** the 1981-1990 average for each calendar month (for air quality, the first 10 years of that layer). No ghost before 1991.
- **Manual toggle** "Show the 1980s": keeps the ghost visible all the time for curious users. It is off by default.
- **How:** reuse the same weather components from Feature 6 with a `ghost` prop (low opacity, dashed outline, desaturated). Build once. **Owner: Person 6** (components), **Person 3** (baseline data).

**Tool 2: Smart Pacing (Story Mode only).**
- Calm stretches of 3 or more months are compressed to about 1 second per month with a small label "Skipping quiet months". Eventful months play at the full 2.5 seconds.
- **The music tempo never changes.** During a skipped stretch the music holds the low drone with a soft rising sweep, and the arpeggio pauses. When the next eventful month arrives, the arpeggio and chords restart on the bar line.
- Plain Month Mode never skips (always 2.5 seconds per month). A "Don't skip" toggle is available.
- **Owner: Person 5** (clock logic) and **Person 4** (music behavior).

**Tool 3: Record Badges.**
- Short badges appear when the playhead reaches a notable moment, for example "Hottest June in our data", "5th year in a row warmer than the 1980s", "Driest year in our data".
- Always say **"in our data"** (records only cover the years we have).
- The pipeline picks the top ~10-20 notable records per city and saves them in the JSON. Each shows for about 3 seconds and also appears as a small star on the timeline.
- **Owner: Person 3** (records), **Person 5** (display).

**Optional extras (COULD, cut first):**
- **Dry-season captions:** one-line explainers like "Dry season: normal for Karachi. Most rain comes in July-September."
- **Predict It! for kids:** before a month plays, ask "Will it rain in Karachi this August?" with two big buttons, then reveal the answer.
- **Sea breeze and wind** animation for coastal cities using NASA POWER wind data. (Cyclone tracks would come from NOAA IBTrACS, which is not NASA, so label it clearly.)

### Feature 7: Compare Two Cities [MUST]
- Pick City A and City B. Stereo: City A in the left ear, City B in the right ear.
- Side-by-side charts and weather animations, plus a **"Change Since" summary**: choose a start year and see how each city changed (for example "+1.4 C", "rainfall -12%", "smoke +30%").
- Auto sentence: "Since 1981, Karachi warmed faster than Lahore."
- Default start is 1981 because earlier city differences are not reliable (see Section 2).

### Feature 8: Story Markers [SHOULD]
- Pins on the timeline for major events. When the playhead reaches a pin, the music swells, the app switches to Month Mode, and a short story card appears (2-3 sentences plus a source link).
- About 8-10 stories, each with a real source.

### Feature 9: Listen to the Future (2050 and 2100) [SHOULD]
- The timeline continues into projected years using NASA NEX-GDDP-CMIP6.
- Two scenarios (lower and higher emissions) the user can switch between.
- Clear label and a different visual style: "Projection, not measurement". Tension naturally rises, so the music ends in a big, tense swell. Strong demo ending.

### Feature 10: Accessibility Mode [SHOULD, but we market it as a headline feature]
- Full keyboard use, clear labels, visible focus, high-contrast theme.
- **Voice announcer** using the built-in speech engine ("March 1985. Temperature is 0.4 degrees above normal. Rain is rising.").
- Test with a screen reader (NVDA on Windows, VoiceOver on Mac).

### Feature 11: Share "My City's Climate Song" [COULD]
- Button records 15-30 seconds of playback as an audio file and makes a share image (city, years, small chart).
- **How:** `MediaRecorder` on the audio output, plus an HTML canvas for the image.

### Feature 12: Learn Mode [COULD]
- "Did you know?" cards and a 3-question quiz after a story. Only if everything else is stable.

---

## 5. Tech Stack (Desktop App)

**Rule: keep it simple, local and offline-friendly.** No server. Data is pre-processed into small JSON files and bundled inside the app.

### App
- **Electron** (turns a web-tech app into a Windows/Mac/Linux desktop app). We choose it because the whole team can use normal JavaScript, and Tone.js works perfectly inside it.
- **React + Vite** for the user interface.
- **Tone.js** for music and sound.
- **MapLibre GL JS** (globe view, flyTo) for the map. Fallback idea: Globe.gl with a bundled Earth image if MapLibre globe gives trouble.
- **D3.js** or **Chart.js** for graphs.
- **Tailwind CSS** for styling.
- **Zustand** for the global clock state.
- **electron-builder** to create the installer.
- Electron tip: allow audio to start without a click by adding the switch `autoplay-policy = no-user-gesture-required` in the main process.

### Data pipeline (run once, before the demo)
- **Python 3** with **xarray, netCDF4, pandas, numpy, requests**, in Jupyter notebooks.
- Output: one JSON file per city plus `stories.json`, copied into the app's `data/` folder.

### Data access
- **NASA POWER API**: simple REST, no login. Start here.
- **NASA GISS GISTEMP**: downloadable gridded files for long temperature history.
- **NASA GES DISC (free Earthdata login)**: MERRA-2 and GPM IMERG.
- **NASA NEX-GDDP-CMIP6**: public AWS data. Files are large, so extract only our city cells.
- **USGS Earthquake API**: free, no key.

### Delivery
- Build installers with electron-builder, upload them to a GitHub Release, and also give a plain ZIP version.
- **Practical advice:** judges often do not install unknown apps, and Windows/Mac may show "unverified app" warnings. So also provide (a) a **demo video** and (b) a **hosted web build** of the same code as a backup link. The same React code runs in both, so this costs almost no extra work. The desktop app stays our main product.
- Build and test the installer by **hour 24**, not on the last day. Mac builds must be made on a Mac.

---

## 7. System Architecture

```
NASA / USGS data --> Python notebooks --> data/cities/*.json  (bundled in the app)
(raw files, APIs)    (clean, normalize,    data/stories.json
                      tension, export)          |
                                                v
                                   Electron app (React) loads JSON
                                                |
                              Global Clock (year, month, mode, playing)
                         /         |            |           \
                  Music Engine   Charts   Map + Weather   Tension Meter
                  (Tone.js)      (D3)     Animations      + Story cards
                                          (MapLibre)
```

### Data file format (agree on this in hour 1)

```json
{
  "city": "Karachi",
  "lat": 24.86,
  "lon": 67.00,
  "layers": {
    "temperature": {
      "source": "NASA GISTEMP v4 (long), NASA POWER (detail)",
      "unit": "C anomaly vs 1951-1980",
      "startYear": 1900,
      "monthly": { "1900": [0.1, 0.0, -0.2, 0.1, 0.2, 0.0, 0.1, 0.2, 0.1, 0.0, -0.1, 0.0] }
    },
    "rainfall": { "source": "NASA POWER", "unit": "mm/month", "startYear": 1981,
                  "normals": [ 12 monthly averages ], "monthly": { "1981": [ 12 values ] } },
    "drought":  { "source": "NASA MERRA-2 (SPI)", "startYear": 1981, "monthly": { } },
    "air":      { "source": "NASA MERRA-2 / MODIS AOD", "startYear": 2000, "monthly": { } },
    "earthquakes": { "source": "USGS",
                     "events": [ { "year": 2005, "month": 10, "mag": 7.6, "depth": 26, "lat": 34.5, "lon": 73.6 } ] }
  },
  "tension": { "1981": [ 12 values between 0 and 1 ] },
  "interest": { "1981": [ 12 values between 0 and 1 ] },
  "baseline": { "temperature": [ 12 monthly averages, 1981-1990 ], "rainfall": [ 12 monthly averages, 1981-1990 ] },
  "records": [ { "year": 2015, "month": 6, "layer": "temperature", "text": "Hottest June in our data" } ],
  "yearly":  { "temperature": { "1981": 0.3 } },
  "projection": {
    "scenarios": ["ssp245", "ssp585"],
    "temperature": { "ssp245": { "2050": 1.8 }, "ssp585": { "2050": 2.3 } }
  }
}
```

---

## 8. Cutting Plan (If Time Runs Short)

Cut in this order (first to cut at the top):
1. Quiet-month extras (dry-season captions, Predict It!, wind animation)
2. Feature 12 (Learn Mode)
3. Feature 11 (Share clip)
4. Extra cities (stay with 3)
5. Feature 9 (Future listening) - but we like it, so cut it last of these
6. Fancy weather effects (keep sun, cloud, rain, quake ripple)
7. Lightning in the edge glow (keep the color glow itself)

**Never cut:** globe intro, timeline, music with tension, one weather animation set, comparison, a basic ambient glow, ghost weather, and smart pacing.

---
