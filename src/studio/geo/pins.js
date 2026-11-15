// Location pins. They pop up one by one from south to north, each with its name.
// The pin is a real <button> inside the marker, so it works with the keyboard and screen readers.
import { Marker } from "maplibre-gl";
import { sortSouthToNorth } from "./math.js";

// Where each name sits next to its pin. Peshawar, Islamabad and Lahore are close together, so their names go
// to different sides and never overlap. Cities without an entry get the name above the pin.
export const LABEL_SIDE = { peshawar: "left", islamabad: "right", lahore: "right", quetta: "left", karachi: "left" };

const PIN_SVG =`<svg class="pin__glyph" viewBox="0 0 34 46" aria-hidden="true">
  <path d="M17 1C8.2 1 1 8 1 16.7 1 28.5 17 45 17 45s16-16.5 16-28.3C33 8 25.8 1 17 1Z" fill="#EEF1FF"/>
  <circle cx="17" cy="16.5" r="6" fill="#27336F"/></svg>`;

/**
 * Creates one marker per city (hidden). Returns a controller:
 *   reveal({ stagger, reduceMotion })  pops them in, south to north
 *   setSelected(id | null)             lifts the chosen pin above its disc, dims the rest
 *   destroy()
 */
export function createPins(map, cities, { onSelect }) {
  const ordered = sortSouthToNorth(cities);
  const entries = ordered.map((city) => {
    const root = document.createElement("div");
    root.className = `pin-anchor pin-anchor--label-${LABEL_SIDE[city.id] ?? "top"}`;
    root.innerHTML = `<button type="button" class="pin" aria-label="Choose ${city.name}">${PIN_SVG}<span class="pin__name">${city.name}</span></button>`;
    const button = root.querySelector("button");
    button.addEventListener("click", () => onSelect(city.id));
    const marker = new Marker({ element: root, anchor: "bottom" }).setLngLat([city.lon, city.lat]).addTo(map);
    return { city, root, button, marker };
  });
  const timers = [];

  return {
    order: ordered.map((c) => c.id),
    reveal({ stagger = 480, reduceMotion = false } = {}) {
      entries.forEach(({ root }, i) => {
        const show = () => root.classList.add("pin-anchor--in");
        if (reduceMotion) show(); else timers.push(setTimeout(show, i * stagger));
      });
      return new Promise((resolve) => setTimeout(resolve, reduceMotion ? 0 : (entries.length - 1) * stagger + 700));
    },
    setSelected(id) {
      entries.forEach(({ city, root }) => {
        root.classList.toggle("pin-anchor--selected", city.id === id);
        root.classList.toggle("pin-anchor--dim", id != null && city.id !== id);
      });
    },
    destroy() { timers.forEach(clearTimeout); entries.forEach(({ marker }) => marker.remove()); },
  };
}
