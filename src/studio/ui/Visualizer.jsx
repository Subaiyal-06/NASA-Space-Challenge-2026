// The audio visualizer: its own card, drawn from the REAL sound coming out of the music engine (getLevels).
// Mirrored bars grow with the music. When nothing is playing it rests as a calm line, never fake movement.
import React, { useEffect, useRef, useState } from "react";
import { useClock } from "../../state/clock.js";
import { useSettings } from "../../settings/index.js";
import { getAudioEngine } from "../../app/flow.js";

const BARS = 40;
const BIN_FOR_BAR = (i, bins) => Math.min(bins - 1, Math.round(1 + Math.pow(i / (BARS - 1), 1.6) * (bins * 0.72)));

/** Where the 64 sound bins land on the bars: the low ones (most of the music) get more bars. Exported for tests. */
export const barBins = (bins = 64) => Array.from({ length: BARS }, (_, i) => BIN_FOR_BAR(i, bins));

export default function Visualizer({ reduce }) {
  const canvas = useRef(null);
  const playing = useClock((s) => s.playing);
  const muted = useSettings((s) => s.muted);
  const [heard, setHeard] = useState(false);

  useEffect(() => {
    const el = canvas.current;
    const ctx = el.getContext("2d");
    if (!ctx) return undefined;
    const heights = new Array(BARS).fill(0);
    let raf = 0; let timer = 0; let last = performance.now(); let loud = false; let frame = 0;

    const fit = () => {
      const dpr = window.devicePixelRatio || 1;
      el.width = Math.round(el.clientWidth * dpr);
      el.height = Math.round(el.clientHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);

    const draw = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const w = el.clientWidth; const h = el.clientHeight; const cy = h / 2;
      ctx.clearRect(0, 0, w, h);

      const levels = muted ? null : getAudioEngine().getLevels?.();
      const bins = levels?.frequency?.length ? levels.frequency : null;
      let energy = 0;

      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, "#5BC0FF"); grad.addColorStop(0.5, "#EEF1FF"); grad.addColorStop(1, "#FFC27A");
      ctx.strokeStyle = grad; ctx.lineCap = "round";
      const gap = w / BARS; const barW = Math.max(2.5, gap * 0.52);
      ctx.lineWidth = barW;

      for (let i = 0; i < BARS; i++) {
        const target = bins ? Math.pow(bins[BIN_FOR_BAR(i, bins.length)], 0.85) : 0;
        energy += target;
        // rise quickly, fall gently (in calm mode there is no smoothing at all)
        const k = reduce ? 1 : target > heights[i] ? Math.min(1, dt * 22) : Math.min(1, dt * 5);
        heights[i] += (target - heights[i]) * k;
        const rest = reduce ? 0 : 0.035 + 0.02 * Math.sin(now / 900 + i * 0.5); // a calm breathing line
        const half = Math.max(1.5, (Math.max(heights[i], rest) * (cy - 4)));
        const x = gap * (i + 0.5);
        ctx.globalAlpha = 0.35 + Math.min(0.65, heights[i] * 1.6);
        ctx.beginPath(); ctx.moveTo(x, cy - half); ctx.lineTo(x, cy + half); ctx.stroke();
      }
      ctx.globalAlpha = 1;

      const isLoud = energy / BARS > 0.04;
      if (isLoud !== loud && ++frame % 3 === 0) { loud = isLoud; setHeard(isLoud); } // update the label only when it changes
      if (reduce) timer = window.setTimeout(() => draw(performance.now()), 250);
      else raf = requestAnimationFrame(draw);
    };
    if (reduce) draw(performance.now()); else raf = requestAnimationFrame(draw);

    return () => { cancelAnimationFrame(raf); clearTimeout(timer); ro.disconnect(); };
  }, [reduce, muted]);

  const state = muted ? "Muted" : heard ? "Playing" : playing ? "Starting…" : "Press play";
  return (
    <aside className="viz" aria-label="Sound visualizer">
      <header>
        <span className="viz__title">Sound</span>
        <span className="viz__state" aria-live="polite">{state}</span>
      </header>
      <canvas ref={canvas} className="viz__canvas" aria-hidden="true" />
    </aside>
  );
}
