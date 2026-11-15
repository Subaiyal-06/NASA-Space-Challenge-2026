// The sound visualiser: it shows how the CLIMATE DATA becomes sound.
// One lane per instrument (heat chimes, rain drops, dry wind, earthquake boom, haze breath). Each lane scrolls
// right to left and rises whenever that instrument is really sounding, so you can see which part of the data
// you are hearing and when. Below the lanes, a thin spectrum shows the whole mix. Everything is drawn from the
// real sound coming out of the music engine (getLevels), never from fake movement.
import React, { useEffect, useRef, useState } from "react";
import { useClock } from "../../state/clock.js";
import { useSettings } from "../../settings/index.js";
import { getAudioEngine } from "../../app/flow.js";

const BARS = 40;
const BIN_FOR_BAR = (i, bins) => Math.min(bins - 1, Math.round(1 + Math.pow(i / (BARS - 1), 1.6) * (bins * 0.72)));

/** Where the 64 sound bins land on the bars: the low ones (most of the music) get more bars. Exported for tests. */
export const barBins = (bins = 64) => Array.from({ length: BARS }, (_, i) => BIN_FOR_BAR(i, bins));

/** The instruments, what they sound like, and which data layer plays each. Exported for tests. */
export const LANES = [
  { key: "heat", layer: "temperature", dataKey: "temperature", label: "Heat", sound: "glass chimes", color: "--heat" },
  { key: "rain", layer: "rainfall", dataKey: "rainfall", label: "Rain", sound: "rain drops", color: "--rain" },
  { key: "drought", layer: "drought", dataKey: "drought", label: "Dry spells", sound: "dry wind", color: "--dry" },
  { key: "quakes", layer: "quakes", dataKey: "earthquakes", label: "Earthquakes", sound: "deep boom", color: "--quake" },
  { key: "haze", layer: "air", dataKey: "air", label: "Haze", sound: "breathy hiss", color: "--haze" },
];
/** Lanes to show: only instruments whose data the city has and the listener has switched on. */
export const lanesFor = (city, layers) => LANES.filter((l) => city?.layers?.[l.dataKey] && layers.includes(l.layer));

const LANE_H = 30; const LABEL_W = 104; const HISTORY = 150; const SAMPLE_MS = 45;

export default function Visualizer({ reduce, city = null }) {
  const lanesCanvas = useRef(null);
  const canvas = useRef(null);
  const playing = useClock((s) => s.playing);
  const layers = useClock((s) => s.layers);
  const muted = useSettings((s) => s.muted);
  const [heard, setHeard] = useState(false);
  const lanes = lanesFor(city, layers);
  const laneKeys = lanes.map((l) => l.key).join(",");

  // ---- the lanes ----
  useEffect(() => {
    const el = lanesCanvas.current;
    const ctx = el?.getContext("2d");
    if (!ctx || !lanes.length) return undefined;
    const css = getComputedStyle(el.closest(".studio") ?? document.body);
    const colors = Object.fromEntries(lanes.map((l) => [l.key, css.getPropertyValue(l.color).trim() || "#EEF1FF"]));
    const history = Object.fromEntries(lanes.map((l) => [l.key, new Float32Array(HISTORY)]));
    let raf = 0; let timer = 0; let last = 0; let sampleAcc = 0;
    const fit = () => {
      const dpr = window.devicePixelRatio || 1;
      el.width = Math.round(el.clientWidth * dpr); el.height = Math.round(el.clientHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    fit();
    const ro = new ResizeObserver(fit); ro.observe(el);

    const draw = (now) => {
      const dt = last ? Math.min(0.2, (now - last) / 1000) : 0; last = now;
      const voices = muted ? null : getAudioEngine().getLevels?.()?.voices;
      sampleAcc += dt * 1000;
      while (sampleAcc >= SAMPLE_MS) {
        sampleAcc -= SAMPLE_MS;
        for (const l of lanes) { const h = history[l.key]; h.copyWithin(0, 1); h[HISTORY - 1] = voices ? Math.min(1, voices[l.key] ?? 0) : 0; }
      }
      const w = el.clientWidth; ctx.clearRect(0, 0, w, el.clientHeight);
      lanes.forEach((l, i) => {
        const y0 = i * LANE_H; const base = y0 + LANE_H - 4; const amp = LANE_H - 9; const h = history[l.key];
        ctx.fillStyle = "rgba(238,241,255,0.06)"; ctx.fillRect(LABEL_W, base, w - LABEL_W, 1); // the lane's resting line
        if (reduce) { // calm mode: no scrolling, just a bar showing how loud this instrument is now
          const bar = Math.max(2, h[HISTORY - 1] * amp);
          ctx.fillStyle = colors[l.key]; ctx.globalAlpha = 0.85; ctx.fillRect(LABEL_W, base - bar, (w - LABEL_W) * 0.5, bar); ctx.globalAlpha = 1; return;
        }
        ctx.beginPath(); ctx.moveTo(LABEL_W, base);
        for (let k = 0; k < HISTORY; k++) ctx.lineTo(LABEL_W + (k / (HISTORY - 1)) * (w - LABEL_W), base - Math.max(0.6, h[k] * amp));
        ctx.lineTo(w, base); ctx.closePath();
        ctx.fillStyle = colors[l.key]; ctx.globalAlpha = 0.28; ctx.fill();
        ctx.globalAlpha = 0.95; ctx.strokeStyle = colors[l.key]; ctx.lineWidth = 1.6; ctx.lineJoin = "round"; ctx.stroke(); ctx.globalAlpha = 1;
        const nowH = h[HISTORY - 1];
        if (nowH > 0.05) { ctx.fillStyle = colors[l.key]; ctx.beginPath(); ctx.arc(w - 2, base - nowH * amp, 3.2, 0, Math.PI * 2); ctx.fill(); }
      });
      if (reduce) timer = window.setTimeout(() => draw(performance.now()), 250);
      else raf = requestAnimationFrame(draw);
    };
    if (reduce) draw(performance.now()); else raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); clearTimeout(timer); ro.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce, muted, laneKeys]);

  // ---- the whole-mix spectrum (a thin strip) ----
  useEffect(() => {
    const el = canvas.current;
    const ctx = el.getContext("2d");
    if (!ctx) return undefined;
    const heights = new Array(BARS).fill(0);
    let raf = 0; let timer = 0; let last = performance.now(); let loud = false; let frame = 0;
    const fit = () => {
      const dpr = window.devicePixelRatio || 1;
      el.width = Math.round(el.clientWidth * dpr); el.height = Math.round(el.clientHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    fit();
    const ro = new ResizeObserver(fit); ro.observe(el);

    const draw = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      const w = el.clientWidth; const h = el.clientHeight; const cy = h / 2;
      ctx.clearRect(0, 0, w, h);
      const levels = muted ? null : getAudioEngine().getLevels?.();
      const bins = levels?.frequency?.length ? levels.frequency : null;
      let energy = 0;
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, "#5BC0FF"); grad.addColorStop(0.5, "#EEF1FF"); grad.addColorStop(1, "#FFC27A");
      ctx.strokeStyle = grad; ctx.lineCap = "round";
      const gap = w / BARS; ctx.lineWidth = Math.max(2.5, gap * 0.52);
      for (let i = 0; i < BARS; i++) {
        const target = bins ? Math.pow(bins[BIN_FOR_BAR(i, bins.length)], 0.85) : 0;
        energy += target;
        const k = reduce ? 1 : target > heights[i] ? Math.min(1, dt * 22) : Math.min(1, dt * 5);
        heights[i] += (target - heights[i]) * k;
        const rest = reduce ? 0 : 0.035 + 0.02 * Math.sin(now / 900 + i * 0.5);
        const half = Math.max(1.5, Math.max(heights[i], rest) * (cy - 2));
        const x = gap * (i + 0.5);
        ctx.globalAlpha = 0.35 + Math.min(0.65, heights[i] * 1.6);
        ctx.beginPath(); ctx.moveTo(x, cy - half); ctx.lineTo(x, cy + half); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      const isLoud = energy / BARS > 0.04;
      if (isLoud !== loud && ++frame % 3 === 0) { loud = isLoud; setHeard(isLoud); }
      if (reduce) timer = window.setTimeout(() => draw(performance.now()), 250);
      else raf = requestAnimationFrame(draw);
    };
    if (reduce) draw(performance.now()); else raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); clearTimeout(timer); ro.disconnect(); };
  }, [reduce, muted]);

  const state = muted ? "Muted" : heard ? "Playing" : playing ? "Starting…" : "Press play";
  return (
    <aside className="viz" aria-label="Sound visualizer: which climate data you are hearing">
      <header>
        <span className="viz__title">{lanes.length ? "Sound of the data" : "Sound"}</span>
        <span className="viz__state" aria-live="polite">{state}</span>
      </header>
      {lanes.length > 0 && (
        <div className="viz__lanes" style={{ height: lanes.length * LANE_H }}>
          <canvas ref={lanesCanvas} className="viz__lanescanvas" aria-hidden="true" />
          <ul>
            {lanes.map((l) => (
              <li key={l.key} style={{ height: LANE_H, "--c": `var(${l.color})` }}>
                <b>{l.label}</b><span>{l.sound}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <canvas ref={canvas} className="viz__canvas" aria-hidden="true" />
    </aside>
  );
}
