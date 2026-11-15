// "How it sounds": what each sound means, where the data comes from, and why we made these choices.
// Written for visitors and judges; every claim here matches what the app really does.
import React, { useEffect, useRef, useState } from "react";

export const SOUND_ROWS = [
  { name: "Heat", sound: "Glass chimes", how: "Cooler than normal: fewer, lower, softer chimes and a darker mix. Hotter: more, higher, brighter chimes.", color: "--heat" },
  { name: "Rain", sound: "Rain drops", how: "A drop of piano-like notes for each wet month. The wetter the month compared with a normal one, the more notes, plus a soft hiss.", color: "--rain" },
  { name: "Dry spells", sound: "Dry wind", how: "A whistling wind and a low rumble. The drier it is, the stronger they get, and the whole music turns dull and muffled.", color: "--dry" },
  { name: "Earthquakes", sound: "Deep boom", how: "One boom and a rumbling crack in the month it happened. A bigger magnitude is deeper and louder.", color: "--quake" },
  { name: "Greenery", sound: "No sound", how: "Shown as green or brown on the ground. It starts in 2001, when the satellite record begins.", color: "--green" },
];

export const TENSION_STEPS = [
  ["Calm", "A low drone and a soft pad."],
  ["Building", "A slow arpeggio joins."],
  ["Tense", "A bigger organ-like pad; the arpeggio moves up an octave."],
  ["Very tense", "Strings swell and the arpeggio speeds up."],
  ["Peak", "Low pulsing beats, the brightest sound and the biggest echo."],
];

export const DATA_SOURCES = [
  ["Temperature and rainfall", "NASA POWER monthly data, from 1981."],
  ["Dry spells", "Computed by us from the NASA rainfall with the standard SPI method, from 1982."],
  ["Greenery", "NASA MODIS vegetation index (NDVI), from 2001."],
  ["Earthquakes", "USGS earthquake catalogue (not NASA). Each city shows quakes that are notable for where it is."],
  ["Map pictures", "NASA GIBS Blue Marble and Landsat imagery, stored on this computer so the app works offline."],
  ["Climate stress", "Our own index (0 to 100%) that blends heat, rain, dry spells and earthquakes. It is not a NASA product."],
];

export default function AboutSound() {
  const [open, setOpen] = useState(false);
  const opener = useRef(null);
  const closer = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    closer.current?.focus();
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); opener.current?.focus(); };
  }, [open]);

  return (
    <>
      <button type="button" ref={opener} className="a11y__btn about__btn" onClick={() => setOpen(true)}>How it sounds</button>
      {open && (
        <div className="about" role="presentation" onPointerDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="about__panel" role="dialog" aria-modal="true" aria-labelledby="about-title">
            <header>
              <h2 id="about-title">How it sounds</h2>
              <button type="button" ref={closer} className="about__close" onClick={() => setOpen(false)}>Close</button>
            </header>

            <p className="about__lead">
              Every sound you hear is made live from NASA Earth data for the place and month on screen. The map and weather show the same numbers,
              so you can see what you hear and hear what you see. We turn the data behind NASA Earth science visualizations into sound,
              and the animated map is the picture that goes with it.
            </p>

            <h3>What each sound means</h3>
            <ul className="about__rows">
              {SOUND_ROWS.map((r) => (
                <li key={r.name} style={{ "--c": `var(${r.color})` }}>
                  <b>{r.name}</b><strong>{r.sound}</strong><span>{r.how}</span>
                </li>
              ))}
            </ul>

            <h3>The music underneath: calm to intense</h3>
            <p>As the climate stress rises the music builds, like a film score, and it never jumps: layers fade in over one bar.</p>
            <ol className="about__steps">
              {TENSION_STEPS.map(([n, d]) => (<li key={n}><b>{n}</b> {d}</li>))}
            </ol>

            <h3>Why it sounds musical</h3>
            <p>
              Raw numbers turned straight into pitch would sound like noise. So every note is forced onto the A minor scale, the tempo is steady at 96 beats a minute,
              and one bar of music is one month of data (2.5 seconds). Ordinary months stay gentle. Extreme months stand out.
            </p>

            <h3>Where the data comes from</h3>
            <dl className="about__sources">
              {DATA_SOURCES.map(([k, v]) => (<div key={k}><dt>{k}</dt><dd>{v}</dd></div>))}
            </dl>

            <h3>Made for everyone</h3>
            <p>
              The Accessibility menu can speak each month, keep a text description for screen readers, switch to high contrast and list the keyboard shortcuts.
              Every colour on screen also has a word beside it, and the Animations switch turns the motion off.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
