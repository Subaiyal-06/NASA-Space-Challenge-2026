// Compare mode: a strip under the two globes, one column per city for the same month.
// City A (left half) plays in the left ear, city B (right half) in the right ear.
import React from "react";
import { headlineFor, gaugesFor } from "./gauges.js";
import { CATEGORY_DEFS, formatDate } from "./timeline.js";
import { buildCompareProps } from "../../app/compare.js";

const COLORS = Object.fromEntries(CATEGORY_DEFS.map((d) => [d.id, d.color]));

function Tile({ g }) {
  const { mode, amount } = g.bar;
  const fill = mode === "center"
    ? { left: amount < 0 ? `${50 + amount * 50}%` : "50%", width: `${Math.abs(amount) * 50}%` }
    : { left: 0, width: `${amount * 100}%` };
  return (
    <li className={`cmp__tile${g.waiting ? " is-waiting" : ""}`} style={{ "--c": COLORS[g.id] }}>
      <span>{g.label}</span>
      <strong>{g.value}</strong>
      <div className={`gauge__bar gauge__bar--${mode}`} aria-hidden="true"><i style={fill} /></div>
      <small>{g.caption}</small>
    </li>
  );
}

function Column({ side, ear, city, snapshot, wx, name, enabled, showGreenery }) {
  const gauges = gaugesFor(snapshot, city, { enabled, showGreenery });
  return (
    <section className={`cmp__col cmp__col--${side}`} aria-label={`${name}, ${ear}`}>
      <header><b>{name}</b><em>{ear}</em></header>
      <p>{headlineFor(wx, snapshot)}</p>
      <ul>{gauges.map((g) => <Tile key={g.id} g={g} />)}</ul>
    </section>
  );
}

export default function CompareCard({ a, b, year, month, enabled, showGreenery, onClear }) {
  // a / b: { id, name, city, snapshot, wx }
  if (!a?.snapshot || !b?.snapshot) return null;
  const summary = buildCompareProps({ cityA: a.id, cityB: b.id, startYear: 1981, currentYear: 2024, month }).summary;
  return (
    <div className="cmp" role="group" aria-label={`${a.name} compared with ${b.name}`}>
      <div className="cmp__top">
        <span className="cmp__date">{formatDate(year, month)}</span>
        <span className="cmp__summary">{summary}</span>
        <button type="button" className="linklike" onClick={onClear}>Stop comparing</button>
      </div>
      <div className="cmp__cols">
        <Column side="a" ear="left ear" {...a} enabled={enabled} showGreenery={showGreenery} />
        <Column side="b" ear="right ear" {...b} enabled={enabled} showGreenery={showGreenery} />
      </div>
    </div>
  );
}
