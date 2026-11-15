// The "Compare" pill: pick a second city to hear in the right ear, or stop comparing.
import React, { useState } from "react";

export default function CompareControl({ cities, cityId, cityBId, onPick, onClear }) {
  const [open, setOpen] = useState(false);
  const others = cities.filter((c) => c.id !== cityId);
  const b = cities.find((c) => c.id === cityBId);
  return (
    <div className="compare">
      {b
        ? <button type="button" className="hist-toggle is-on" onClick={onClear} aria-label={`Stop comparing with ${b.name}`}>vs {b.name} &times;</button>
        : <button type="button" className="hist-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>Compare</button>}
      {open && !b && (
        <ul className="compare__menu" role="menu" aria-label="Compare with">
          {others.map((c) => (
            <li key={c.id}><button type="button" role="menuitem" onClick={() => { setOpen(false); onPick(c.id); }}>{c.name}</button></li>
          ))}
        </ul>
      )}
    </div>
  );
}
