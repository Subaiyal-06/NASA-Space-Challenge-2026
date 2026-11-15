// Big, readable category chips on the left: what to listen to and watch. Only layers the city has appear.
import React from "react";
import { useClock } from "../../state/clock.js";
import { useStudio } from "../state.js";
import { categoriesFor } from "./timeline.js";
import { CATEGORY_ICONS } from "./icons.jsx";

export default function CategoryRail({ city }) {
  const year = useClock((s) => s.year);
  const layers = useClock((s) => s.layers);
  const setLayers = useClock((s) => s.setLayers);
  const extras = useStudio((s) => s.extras);
  const toggleExtra = useStudio((s) => s.toggleExtra);
  const cats = categoriesFor(city, year);
  if (!cats.length) return null;

  const isOn = (c) => (c.core ? layers.includes(c.id) : extras[c.id] !== false);
  const toggle = (c) => {
    if (!c.core) return toggleExtra(c.id);
    setLayers(layers.includes(c.id) ? layers.filter((l) => l !== c.id) : [...layers, c.id]);
  };

  return (
    <nav className="rail" aria-label="Categories">
      <p className="rail__title">Listen to</p>
      <ul>
        {cats.map((c) => {
          const Icon = CATEGORY_ICONS[c.icon];
          const on = isOn(c);
          return (
            <li key={c.id}>
              <button
                type="button"
                className={`chip${on ? " chip--on" : ""}${c.available ? "" : " chip--waiting"}`}
                style={{ "--cat": c.color }}
                aria-pressed={on}
                onClick={() => toggle(c)}
              >
                <span className="chip__icon"><Icon /></span>
                <span className="chip__text">
                  <span className="chip__label">{c.label}</span>
                  {!c.available && <span className="chip__note">starts in {c.startYear}</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
