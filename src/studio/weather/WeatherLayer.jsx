// The weather on the city disc, drawn over the map and placed exactly on the raised disc.
// Light on purpose: only the selected city animates. Everything also has a text label (never colour alone).
import React, { useEffect, useRef, useState } from "react";
import { projectDisc } from "./anchor.js";
import { cityShape } from "../geo/shapes.js";
import { useFx, createFlashGovernor, nextFlashDelay } from "./fx.js";
import { Rain as RainIcon, Sun as SunIcon, Snow as SnowIcon, Quake as QuakeIcon, Dry as DryIcon, Leaf as LeafIcon } from "../ui/icons.jsx";

const near = (a, b) => a && b && Math.abs(a.cx - b.cx) < 0.4 && Math.abs(a.cy - b.cy) < 0.4 && Math.abs(a.rx - b.rx) < 0.4 && Math.abs(a.lift - b.lift) < 0.4;

/** Follows the disc on the screen while the camera moves. */
function useAnchor(map, city) {
  const [anchor, setAnchor] = useState(null);
  useEffect(() => {
    if (!map || !city) { setAnchor(null); return undefined; }
    const radius = cityShape(city).radiusKm;
    let raf = 0;
    const update = () => { raf = 0; const next = projectDisc(map, city, radius); setAnchor((prev) => (near(prev, next) ? prev : next)); };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(update); };
    map.on("render", schedule);
    schedule();
    return () => { map.off("render", schedule); cancelAnimationFrame(raf); };
  }, [map, city]);
  return anchor;
}

function Cloud({ className }) {
  // Soft puffs: a flat colour, a light top and a darker underside, with slightly blurred edges
  const shapes = <><circle cx="58" cy="72" r="36" /><circle cx="104" cy="54" r="46" /><circle cx="150" cy="74" r="33" /><rect x="38" y="72" width="130" height="34" rx="17" /></>;
  return (
    <svg className={`wx-cloud ${className}`} viewBox="0 0 200 120" aria-hidden="true">
      <defs>
        <linearGradient id="wxShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity="0.5" /><stop offset="0.55" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#0A1634" stopOpacity="0.32" /></linearGradient>
        <filter id="wxSoft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.6" /></filter>
      </defs>
      <g filter="url(#wxSoft)"><g fill="currentColor">{shapes}</g><g fill="url(#wxShade)">{shapes}</g></g>
    </svg>
  );
}

/** Rain: drops fall from the clouds onto the disc and splash. A calm still picture when motion is reduced. */
function RainCanvas({ a, amount, reduce }) {
  const ref = useRef(null);
  const W = Math.round(a.rx * 2.3); const H = Math.round(a.rx * 1.7);
  useEffect(() => {
    const el = ref.current; if (!el) return undefined;
    const ctx = el.getContext("2d");
    if (!ctx) return undefined; // no canvas available: the labels and clouds still tell the story
    const dpr = window.devicePixelRatio || 1;
    el.width = W * dpr; el.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const gx = W / 2; const gy = H - a.ry - 4; const grx = a.rx * 0.9; const gry = a.ry * 0.9; const topY = H * 0.28;
    const heavy = amount > 0.62; const speed = heavy ? 560 : 380; const wind = 0.16;
    const pick = () => { // a random landing spot inside the disc's ellipse
      const t = Math.random() * Math.PI * 2; const r = Math.sqrt(Math.random());
      return { tx: gx + Math.cos(t) * r * grx, ty: gy - a.lift * 0 + Math.sin(t) * r * gry };
    };
    ctx.strokeStyle = heavy ? "rgba(190,215,255,0.8)" : "rgba(205,225,255,0.65)"; ctx.lineCap = "round"; ctx.lineWidth = heavy ? 1.7 : 1.3;

    if (reduce) { // one still frame of streaks
      for (let i = 0; i < 26 + amount * 40; i++) { const { tx, ty } = pick(); const len = 14; ctx.globalAlpha = 0.55; ctx.beginPath(); ctx.moveTo(tx - wind * (ty - topY), topY + Math.random() * (ty - topY - len)); ctx.lineTo(tx - wind * (ty - topY) + wind * len, ty - 6); ctx.stroke(); }
      return undefined;
    }
    const drops = []; const splashes = []; let raf = 0; let last = performance.now(); let carry = 0;
    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      carry += amount * (heavy ? 190 : 110) * dt;
      while (carry >= 1 && drops.length < 260) { carry -= 1; const { tx, ty } = pick(); drops.push({ x: tx - wind * (ty - topY), y: topY, tx, ty, len: heavy ? 15 : 11 }); }
      ctx.clearRect(0, 0, W, H);
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i]; d.y += speed * dt; d.x += speed * dt * wind;
        if (d.y >= d.ty) { splashes.push({ x: d.tx, y: d.ty, t: 0 }); drops.splice(i, 1); continue; }
        ctx.globalAlpha = 0.7; ctx.beginPath(); ctx.moveTo(d.x - wind * d.len, d.y - d.len); ctx.lineTo(d.x, d.y); ctx.stroke();
      }
      for (let i = splashes.length - 1; i >= 0; i--) {
        const s = splashes[i]; s.t += dt * 3.2; if (s.t >= 1) { splashes.splice(i, 1); continue; }
        ctx.globalAlpha = 0.55 * (1 - s.t); ctx.beginPath(); ctx.ellipse(s.x, s.y, 3 + s.t * 9, (3 + s.t * 9) * 0.38, 0, 0, Math.PI * 2); ctx.stroke();
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [W, H, a.rx, a.ry, amount > 0.62, reduce, amount > 0]);
  return <canvas ref={ref} className="wx-rain" style={{ width: W, height: H, left: a.cx - W / 2, top: a.cy - a.lift - H + a.ry + 4 }} aria-hidden="true" />;
}

/** Lightning: a soft jagged bolt now and then, never more than one flash every 4 seconds. */
// One governor for the whole screen, so two storms side by side still never flash more than once every 4 seconds
const sharedGovernor = createFlashGovernor();

function Lightning({ a, active }) {
  const [bolt, setBolt] = useState(null);
  useEffect(() => {
    if (!active) return undefined;
    const gov = sharedGovernor;
    let timer = 0; let off = 0;
    const strike = () => {
      if (document.hidden || !gov.tryFlash()) return;
      const x0 = a.cx + (Math.random() - 0.5) * a.rx * 0.8; const y0 = a.cy - a.lift - a.rx * 0.5;
      const x1 = a.cx + (Math.random() - 0.5) * a.rx * 0.9; const y1 = a.cy - a.lift + (Math.random() - 0.2) * a.ry * 0.7;
      const pts = Array.from({ length: 8 }, (_, i) => { const t = i / 7; return `${(x0 + (x1 - x0) * t + (i && i < 7 ? (Math.random() - 0.5) * 38 : 0)).toFixed(1)},${(y0 + (y1 - y0) * t).toFixed(1)}`; }).join(" ");
      setBolt(pts); useFx.getState().flashNow();
      off = window.setTimeout(() => setBolt(null), 380);
    };
    const loop = () => { timer = window.setTimeout(() => { strike(); loop(); }, nextFlashDelay()); };
    timer = window.setTimeout(() => { strike(); loop(); }, 1100);
    return () => { clearTimeout(timer); clearTimeout(off); setBolt(null); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
  if (!bolt) return null;
  return (
    <svg className="wx-bolt" aria-hidden="true">
      <polyline points={bolt} fill="none" stroke="rgba(190,215,255,0.55)" strokeWidth="9" strokeLinejoin="round" strokeLinecap="round" style={{ filter: "blur(5px)" }} />
      <polyline points={bolt} fill="none" stroke="#FFFFFF" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

const CRACKS = [
  "M100 50 L128 40 L150 46 L176 30", "M150 46 L158 62 L172 70", "M100 50 L84 34 L58 38 L30 22", "M58 38 L50 52 L34 58",
  "M100 50 L112 70 L96 88", "M112 70 L130 82", "M100 50 L72 66 L48 62 L24 78", "M100 50 L142 62 L170 58",
];

/** Earthquake: cracks draw across the disc (the screen shake is done by the stage). */
function Cracks({ a, id, magnitude }) {
  const scale = 0.85 + Math.min(0.5, (magnitude - 5) * 0.16);
  return (
    <svg key={id} className="wx-cracks" viewBox="0 0 200 100" preserveAspectRatio="none" aria-hidden="true"
      style={{ left: a.cx - a.rx, top: a.cy - a.lift - a.ry, width: a.rx * 2, height: a.ry * 2, transform: `scale(${scale})` }}>
      {CRACKS.map((d, i) => <path key={`g${i}`} d={d} className="wx-crack wx-crack--glow" style={{ "--d": `${i * 0.06}s` }} />)}
      {CRACKS.map((d, i) => <path key={`c${i}`} d={d} className="wx-crack" style={{ "--d": `${i * 0.06}s` }} />)}
    </svg>
  );
}

const LABEL_ICONS = { storm: RainIcon, rain: RainIcon, clouds: RainIcon, quake: QuakeIcon, dry: DryIcon, hot: SunIcon, cool: SnowIcon, green: LeafIcon };

export default function WeatherLayer({ map, city, wx, reduce }) {
  const a = useAnchor(map, city);
  const quakeId = useFx((s) => s.quake);
  const [cloudState, setCloudState] = useState("idle");
  const hasClouds = wx.clouds > 0;
  useEffect(() => { setCloudState((prev) => (hasClouds ? "in" : prev === "in" ? "out" : prev)); }, [hasClouds]);
  if (!a || !(a.rx > 8)) return null;

  const heavy = wx.rain >= 0.65 || wx.storm;
  const topY = a.cy - a.lift;
  return (
    <div className={`wx${reduce ? " wx--still" : ""}`} aria-hidden="false">
      {/* ground tints on the disc top */}
      <div className="wx-ellipse wx-green" style={{ left: a.cx - a.rx, top: topY - a.ry, width: a.rx * 2, height: a.ry * 2, opacity: Math.abs(wx.green) * 0.55, "--tint": wx.green >= 0 ? "98,221,160" : "217,165,107" }} />
      <div className="wx-ellipse wx-dry" style={{ left: a.cx - a.rx, top: topY - a.ry, width: a.rx * 2, height: a.ry * 2, opacity: wx.dry * 0.75 }} />
      <div className="wx-ellipse wx-cool" style={{ left: a.cx - a.rx, top: topY - a.ry, width: a.rx * 2, height: a.ry * 2, opacity: wx.heat < 0 ? Math.min(1, -wx.heat * 1.2) : 0 }} />

      {/* drought: dust drifts across the parched ground (the cracked, browned ground is the tint above) */}
      {wx.dry > 0 && (
        <div className="wx-dust" style={{ left: a.cx - a.rx, top: topY - a.ry * 1.25, width: a.rx * 2, height: a.ry * 2.5, opacity: 0.35 + wx.dry * 0.5 }}>
          <i /><i /><i />
        </div>
      )}

      {/* sun */}
      <div className="wx-sun" style={{ left: a.cx + a.rx * 0.55, top: topY - a.ry - a.rx * 0.78, width: a.rx * 0.7, height: a.rx * 0.7, opacity: wx.heat > 0 ? 0.35 + 0.65 * wx.heat : 0 }}><i /></div>

      {/* clouds drift in from the left and out to the right */}
      <div className={`wx-clouds wx-clouds--${cloudState}${heavy ? " wx-clouds--dark" : ""}`}
        style={{ left: a.cx - a.rx * 1.05, top: topY - a.ry - a.rx * 0.95, width: a.rx * 2.1, height: a.rx * 0.95, "--lvl": Math.max(0.5, wx.clouds) }}>
        <Cloud className="wx-cloud--a" /><Cloud className="wx-cloud--b" /><Cloud className="wx-cloud--c" /><Cloud className="wx-cloud--d" />
      </div>

      {wx.rain > 0 && <RainCanvas a={a} amount={wx.rain} reduce={reduce} />}
      <Lightning a={a} active={wx.storm && !reduce} />
      {wx.quake && quakeId > 0 && <Cracks a={a} id={quakeId} magnitude={wx.quake.magnitude} />}

      {/* words for everything shown (never colour alone) */}
      {wx.labels.length > 0 && (
        <ul className="wx-labels" aria-live="polite" style={{ left: a.cx, top: a.cy + a.ry + 18 }}>
          {wx.labels.slice(0, 3).map((l) => {
            const Icon = LABEL_ICONS[l.kind];
            return <li key={l.kind} className={`wx-label wx-label--${l.kind}`}><Icon />{l.text}</li>;
          })}
        </ul>
      )}
    </div>
  );
}
