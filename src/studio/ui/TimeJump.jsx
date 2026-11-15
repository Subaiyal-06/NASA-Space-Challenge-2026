// "Jump to a time": pick a year and a month, or a big moment, so nobody has to scrub from the start.
import React, { useEffect, useRef, useState } from "react";
import { MONTHS_SHORT, MONTHS, bigMoments } from "./timeline.js";
import { Close } from "./icons.jsx";

export default function TimeJump({ year, month, range, markers, onSeek, onClose }) {
  const box = useRef(null);
  const moments = bigMoments(markers);
  const decades = [];
  for (let d = Math.floor(range.startYear / 10) * 10; d <= range.endYear; d += 10) decades.push(d);
  const [decade, setDecade] = useState(Math.floor(year / 10) * 10);
  const years = [];
  for (let y = Math.max(decade, range.startYear); y <= Math.min(decade + 9, range.endYear); y++) years.push(y);

  useEffect(() => {
    const first = box.current?.querySelector("[aria-current='true']") ?? box.current?.querySelector("button");
    first?.focus();
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    const onDown = (e) => { if (box.current && !box.current.contains(e.target) && !e.target.closest("[data-jump-toggle]")) onClose(); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("pointerdown", onDown); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="jump" role="dialog" aria-label="Jump to a time" ref={box}>
      <header className="jump__head">
        <h2>Jump to a time</h2>
        <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}><Close /></button>
      </header>

      <section>
        <h3>Decade</h3>
        <div className="jump__decades">
          {decades.map((d) => (
            <button key={d} type="button" className={`pill pill--wide${d === decade ? " pill--on" : ""}`} aria-pressed={d === decade} onClick={() => setDecade(d)}>{d}s</button>
          ))}
        </div>
        <h3>Year</h3>
        <div className="jump__years">
          {years.map((y) => (
            <button key={y} type="button" className={`pill${y === year ? " pill--on" : ""}`} aria-current={y === year} onClick={() => onSeek(y, month)}>{y}</button>
          ))}
        </div>
      </section>

      <section>
        <h3>Month</h3>
        <div className="jump__months">
          {MONTHS_SHORT.map((m, i) => (
            <button key={m} type="button" className={`pill${i === month ? " pill--on" : ""}`} aria-label={MONTHS[i]} aria-current={i === month} onClick={() => onSeek(year, i)}>{m}</button>
          ))}
        </div>
      </section>

      {moments.length > 0 && (
        <section>
          <h3>Big moments</h3>
          <ul className="jump__moments">
            {moments.map((m) => (
              <li key={`${m.year}-${m.month}-${m.text}`}>
                <button type="button" className="moment" onClick={() => { onSeek(m.year, m.month); onClose(); }}>
                  <span className="moment__when">{MONTHS_SHORT[m.month]} {m.year}</span>
                  <span className="moment__what">{m.text}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
