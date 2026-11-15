// Compare mode card: two cities side by side for the same month. City A plays in the left ear, city B in the right.
import React from "react";
import { headlineFor, gaugesFor } from "./gauges.js";
import { CATEGORY_DEFS, formatDate } from "./timeline.js";
import { buildCompareProps } from "../../app/compare.js";

const COLORS = Object.fromEntries(CATEGORY_DEFS.map((d) => [d.id, d.color]));

function Cell({ g }) {
  if (!g) return <div className="cmp__cell" />;
  const { mode, amount } = g.bar;
  const fill = mode === "center"
    ? { left: amount < 0 ? `${50 + amount * 50}%` : "50%", width: `${Math.abs(amount) * 50}%` }
    : { left: 0, width: `${amount * 100}%` };
  return (
    <div className={`cmp__cell${g.waiting ? " is-waiting" : ""}`} style={{ "--c": COLORS[g.id] }}>
      <strong>{g.waiting ? "–" : g.value}</strong>
      <div className={`gauge__bar gauge__bar--${mode}`} aria-hidden="true"><i style={fill} /></div>
      <small>{g.caption}</small>
    </div>
  );
}

export default function CompareCard({ a, b, year, month, enabled, showGreenery, onClear }) {
  // a / b: { id, name, city, snapshot, wx }
  if (!a?.snapshot || !b?.snapshot) return null;
  const ga = gaugesFor(a.snapshot, a.city, { enabled, showGreenery });
  const gb = gaugesFor(b.snapshot, b.city, { enabled, showGreenery });
  const ids = [...new Set([...ga, ...gb].map((g) => g.id))];
  const label = (id) => (ga.find((g) => g.id === id) ?? gb.find((g) => g.id === id)).label;
  const summary = buildCompareProps({ cityA: a.id, cityB: b.id, startYear: 1981, currentYear: 2024, month }).summary;
  return (
    <aside className="rn cmp" aria-label={`${a.name} compared with ${b.name}`}>
      <header>
        <span className="rn__title">{formatDate(year, month)}</span>
        <button type="button" className="linklike" onClick={onClear}>Stop comparing</button>
      </header>
      <div className="cmp__heads">
        <div><b>{a.name}</b><em>left ear</em><p>{headlineFor(a.wx, a.snapshot)}</p></div>
        <div><b>{b.name}</b><em>right ear</em><p>{headlineFor(b.wx, b.snapshot)}</p></div>
      </div>
      <div className="cmp__rows">
        {ids.map((id) => (
          <div key={id} className="cmp__row">
            <span className="cmp__label">{label(id)}</span>
            <Cell g={ga.find((g) => g.id === id)} />
            <Cell g={gb.find((g) => g.id === id)} />
          </div>
        ))}
      </div>
      <p className="cmp__summary">{summary}</p>
    </aside>
  );
}
