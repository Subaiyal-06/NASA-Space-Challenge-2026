// "Right now": what this month is like, in words, with one friendly gauge per category and the climate-stress meter.
import React, { useState } from "react";
import { headlineFor, hearingFor, gaugesFor, stressPercent, stressWord } from "./gauges.js";
import { CATEGORY_DEFS, formatDate } from "./timeline.js";

const COLORS = Object.fromEntries(CATEGORY_DEFS.map((d) => [d.id, d.color]));

function Gauge({ g }) {
  const { mode, amount } = g.bar;
  const fill = mode === "center"
    ? { left: amount < 0 ? `${50 + amount * 50}%` : "50%", width: `${Math.abs(amount) * 50}%` }
    : { left: 0, width: `${amount * 100}%` };
  return (
    <li className={`gauge${g.waiting ? " is-waiting" : ""}`} style={{ "--c": COLORS[g.id] }}>
      <div className="gauge__top"><span>{g.label}</span><strong>{g.value}</strong></div>
      <div className={`gauge__bar gauge__bar--${mode}`} aria-hidden="true"><i style={fill} /></div>
      <small>{g.caption}</small>
    </li>
  );
}

export default function RightNow({ wx, snapshot, city, enabled, showGreenery }) {
  const [open, setOpen] = useState(true);
  if (!snapshot || !city) return null;
  const gauges = gaugesFor(snapshot, city, { enabled, showGreenery });
  const pct = stressPercent(snapshot);
  return (
    <aside className="rn" aria-label="This month in numbers">
      <header>
        <span className="rn__title">{formatDate(snapshot.year, snapshot.month)}</span>
        <button type="button" className="linklike" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "Hide numbers" : "Show numbers"}</button>
      </header>
      <p className="rn__headline">{headlineFor(wx, snapshot)}</p>
      {open && (
        <>
          <ul className="gauges">{gauges.map((g) => <Gauge key={g.id} g={g} />)}</ul>
          <div className="stress" role="img" aria-label={`Climate stress ${pct} percent, ${stressWord(pct)}. Our own index.`}>
            <div className="gauge__top"><span>Climate stress <em>(our own index)</em></span><strong>{pct}%</strong></div>
            <div className="gauge__bar gauge__bar--fill" aria-hidden="true"><i style={{ left: 0, width: `${pct}%` }} /></div>
            <small>{stressWord(pct)}</small>
          </div>
        </>
      )}
      <p className="rn__hearing"><span>What you&rsquo;re hearing</span>{hearingFor(wx, snapshot.tension)}</p>
    </aside>
  );
}
