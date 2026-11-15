// The "Future" pill: switch to the World Bank CMIP6 temperature projections (to 2090) or back to measured data only.
import React, { useState } from "react";
import { useClock } from "../../state/clock.js";

export const SCENARIOS = [
  { id: "ssp245", label: "Medium emissions", note: "SSP2-4.5" },
  { id: "ssp585", label: "High emissions", note: "SSP5-8.5" },
];

export default function FutureControl({ city }) {
  const [open, setOpen] = useState(false);
  const enabled = useClock((s) => s.futureEnabled);
  const scenario = useClock((s) => s.scenario);
  if (!city?.projection?.source) return null;
  const current = SCENARIOS.find((s) => s.id === scenario);

  const pick = (id) => {
    const c = useClock.getState();
    c.setScenario(id); c.setFutureEnabled(true);
    c.seek(2050, c.month); // land in the future so the change is heard straight away
    setOpen(false);
  };
  const back = () => { const c = useClock.getState(); c.setFutureEnabled(false); setOpen(false); };

  return (
    <div className="compare">
      <button type="button" className={`hist-toggle${enabled ? " is-on" : ""}`} aria-expanded={open} onClick={() => setOpen(!open)}>
        {enabled ? `Future: ${current?.note}` : "Future"}
      </button>
      {open && (
        <ul className="compare__menu compare__menu--wide" role="menu" aria-label="Future climate">
          {SCENARIOS.map((s) => (
            <li key={s.id}><button type="button" role="menuitemradio" aria-checked={enabled && scenario === s.id} onClick={() => pick(s.id)}>{s.label} <small>{s.note}</small></button></li>
          ))}
          <li><button type="button" role="menuitem" onClick={back}>Measured data only</button></li>
        </ul>
      )}
    </div>
  );
}
