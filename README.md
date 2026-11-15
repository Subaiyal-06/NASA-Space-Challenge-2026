# Earth Jukebox: Pakistan

**Listen to Pakistan's climate, month by month.**

Earth Jukebox turns NASA Earth data into music. Start from space, watch the globe swoop into Pakistan, choose a city, and press play. Every month of climate history from 1981 to 2025 lasts about 2.5 seconds and is **heard** as music and **seen** as weather on a 3D map. You can compare two cities (one in each ear) and listen to NASA-based climate projections out to 2090.

Made for the **NASA Space Apps Challenge 2026: "Earth Jukebox"**.

**Try it in your browser (no install):** https://subaiyal-06.github.io/NASA-Space-Challenge-2026/

> Charts are for eyes. Climate change is something you can also hear, and in Pakistan you can hear it getting louder.

---

## What you can do

- **Fly in.** A spinning offline globe zooms into Pakistan. Five city pins pop up from south to north: Karachi, Quetta, Lahore, Islamabad, Peshawar.
- **Pick a city.** Its ground rises out of the map in its own outline, with a red rim, and the weather plays over it.
- **Press play.** One bar of music is one month. Watch the date, the weather, the numbers and the sound change together.
- **Choose what you hear.** Switch Heat, Rain, Dry spells, Earthquakes and Greenery on or off.
- **Jump around.** Use the scrubber (stars mark record months), the **Jump to a time** panel with big moments, the 5-year leaps, three speeds, and Month / Year / Story modes.
- **Compare two cities.** The screen splits into two globes. The first city plays in your left ear, the second in your right.
- **Hear the future.** The **Future** button adds temperature projections to 2090 for two scenarios.
- **Read the history.** The **History** chart shows the whole record for any category. Click anywhere on it to jump there.

## What you see

| On screen | What it shows |
|---|---|
| **3D city ground** | The selected city, raised from the map, drawn from its own traced outline. |
| **Weather** | Clouds drift in and out, rain falls, storms flash lightning (never more than once every 4 seconds), earthquakes crack the ground and shake the picture, droughts show cracked dry ground and drifting dust, heat shows a sun, cooler months a cool tint, greenery tints the ground. |
| **Right now card** | One plain sentence for the month, a gauge for every category compared with normal, and a **climate stress** meter (our own index). |
| **Sound of the data** | One scrolling lane per instrument that rises when that instrument really sounds, plus a thin spectrum of the whole mix. |
| **Edge glow** | A soft colour around the screen edges that matches the weather and pulses with the music. |
| **Record toasts** | A short message when the playhead reaches a record month, such as "One of the wettest months in our data". |

Every colour also has a word beside it. Nothing relies on colour alone.

## What you hear

The music is an original, film-score style piece in **A minor at 96 beats a minute**. One bar is one month. As the **climate stress** index rises, the music builds from calm to intense: a drone and pad, then an arpeggio, a bigger organ-like pad, swelling strings, and finally low pulsing beats with the brightest sound and the biggest echo. Layers fade in over one bar and never jump.

On top of that, every climate category has its **own instrument**:

| Category | Sound | How the data changes it |
|---|---|---|
| **Heat** | Glass chimes | Cooler than normal: fewer, lower, softer chimes and a darker mix. Hotter: more, higher, brighter chimes. |
| **Rain** | Rain drops (piano-like notes) and a soft hiss | The wetter the month compared with a normal one, the more notes. |
| **Dry spells** | Dry wind and a low rumble | The drier, the stronger the wind, and the whole mix turns dull and muffled. |
| **Earthquakes** | Deep boom, a low string hit and a rumbling crack | A bigger magnitude is deeper and louder. |
| **Greenery** | No sound | Shown only as green or brown on the ground. |

Every note is forced onto the A minor scale, so raw numbers never turn into noise. Ordinary months stay gentle and extreme months stand out. The in-app **How it sounds** page explains all of this.

## Accessibility

- **Accessibility menu**: speak each month aloud, a plain-text description of the month for screen readers, high contrast, and a shortcut list.
- **Text description**: the app keeps a live description up to date ("Karachi, July 2022. A storm month: 401 mm of rain..."). While music plays it announces only notable months, and it announces the month you land on when you pause or jump.
- **Calm motion**: the **Animations** switch turns off movement. It also follows your computer's "reduce motion" setting and says so on screen.
- **Keyboard**: playback, time and speed can be controlled from the keyboard, and the buttons and menus can be reached with Tab.

| Key | Action |
|---|---|
| Space | Play or pause |
| Left / Right arrow | Back or forward one month |
| Shift + Left / Right | Back or forward five years |
| Up / Down arrow | Faster or slower |

## Data

Every number comes from a named source. The app never invents data.

| Category | Source | Starts |
|---|---|---|
| Temperature (as change from the 1981-2010 average) | NASA POWER monthly, air temperature at 2 m | 1981 |
| Rainfall | NASA POWER monthly, corrected precipitation | 1981 |
| Dry spells | Computed by us from the NASA rainfall with the standard SPI-3 method | 1982 |
| Greenery | NASA MODIS vegetation index (NDVI), MOD13A3, via AppEEARS | 2001 |
| Earthquakes | USGS earthquake catalogue (not NASA), magnitude 4.5 and up within 300 km of each city | 1900s |
| Future temperature | World Bank Climate Change Knowledge Portal, CMIP6 median, scenarios SSP2-4.5 and SSP5-8.5 | to 2090 |
| Map pictures | NASA GIBS Blue Marble and Landsat, stored in the app so it works offline | n/a |
| Climate stress | Our own index (0 to 100%) blending heat, rain, dry spells and earthquakes. Not a NASA product. | n/a |

**Honest limits**
- Each layer starts when its measurements begin. The orchestra "grows": a layer is silent and says so until its data starts.
- Each city shows the earthquakes that are *notable for where it is* (the magnitude cut-off is chosen per city so no city shakes more than about one month in eight). Smaller quakes stay in the data files.
- **Projections are temperature only** and are always labelled "Projection, not a measurement". The portal's values are changes from its recent-past baseline (believed 1995-2014); we add each city's measured 1995-2014 average to express them against our 1981-2010 baseline, and place each 20-year window mean at its middle year (2030, 2050, 2070, 2090).
- City shapes were traced from outline pictures and scaled to a common size. They show each place's shape, not its true area.
- Air quality and night lights are not included yet. The data layer is ready for them (see below).

## Run it

**Easiest:** open the [website](https://subaiyal-06.github.io/NASA-Space-Challenge-2026/) in Chrome or Edge, or use the Windows installer or zip if your team shares one.

**From the code** (Node.js 20 or newer):

```bash
git clone https://github.com/Subaiyal-06/NASA-Space-Challenge-2026.git
cd NASA-Space-Challenge-2026
npm install
npm run studio
```

| Command | What it does |
|---|---|
| `npm run studio` | Desktop app (Electron) with live reload |
| `npm run web` | The same interface in your browser (http://localhost:5173) |
| `npm test` | Runs all the tests |
| `npm run build` | Builds the web version into `dist/` |
| `npm run dist` | Builds the Windows installer and zip into `release/` |

The first interface we built is still available at `#/classic` on the address (or `CLASSIC=1` for the desktop app). A developer panel is at `#/dev`.

## How it is built

React, Vite, Zustand, Electron, MapLibre GL (the globe), Tone.js (the music) and Vitest. There are no chart libraries; the charts and visualiser are drawn by hand.

```
src/studio/             The interface: globe, weather, bar, cards, charts, accessibility
src/integrations/audio/ The music engine (Tone.js), loaded only after you press Start
src/data/               The data layer: one API, derived values, validation
src/state/ src/app/     The clock (play, pause, speed, modes) and app logic
src/contracts/          The agreed shapes of data, clock, audio and UI plug-ins
data/cities/            One JSON file per city, every layer with a named source
scripts/                Tools that build the data files, shapes and docs
tests/                  Unit and component tests
```

**Plug-in design.** The data, the music and the interface only meet through small contracts (`src/contracts`) and one registry (`src/integrations/index.js`). New data (for example air quality or night lights) is added by putting the layer into a city file, and the app picks up any extra layer automatically. See [docs/INTEGRATION.md](docs/INTEGRATION.md).

## How this answers the challenge

The challenge asks for an "Earth Jukebox" that pairs Earth visuals with real-time sonification, and highlights accessibility and telling the story of the data. Our approach:

- **Sight and sound together.** The animated map, weather and gauges show the same data you hear. We sonify the data behind NASA Earth science visualizations, and the map is the paired picture.
- **Musical, not noisy.** Artistic rules (a musical scale, a steady tempo, a calm-to-intense build) make the data pleasant to listen to while keeping real differences audible.
- **Accessible.** A screen-reader description, spoken updates, high contrast, calm motion and full keyboard control.
- **Documented.** The **How it sounds** page explains every choice inside the app, and this README explains the data and its limits.

## Project documents

- [docs/PROJECT_BRIEF.md](docs/PROJECT_BRIEF.md): the original team plan and brief
- [docs/INTEGRATION.md](docs/INTEGRATION.md): how data, music and interface plug together
- [DEVELOPMENT_PLAN.txt](DEVELOPMENT_PLAN.txt): the build plan and contracts

## Credits

Built for the NASA Space Apps Challenge 2026. Data and imagery: NASA POWER, NASA MODIS, NASA GIBS, the USGS earthquake catalogue and the World Bank Climate Change Knowledge Portal (CMIP6). Music and visuals are original to this project.
