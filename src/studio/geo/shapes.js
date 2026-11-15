// The "ground" of each city that rises out of the map.
// PLACEHOLDER: a round disc (like a record) until real city outlines arrive.
// TO USE REAL OUTLINES: drop a GeoJSON file named <cityId>.geojson (one Polygon or MultiPolygon, either a bare
// geometry, a Feature, or a FeatureCollection) into src/studio/assets/shapes/. It is picked up automatically.
import { discFeature, circleRing } from "./math.js";

const files = import.meta.glob("../assets/shapes/*.geojson", { eager: true, query: "?raw", import: "default" }); // read as text, then parsed
const custom = {};
for (const [path, text] of Object.entries(files)) {
  const gj = typeof text === "string" ? JSON.parse(text) : text;
  const id = path.split("/").pop().replace(".geojson", "");
  const feature = gj.type === "FeatureCollection" ? gj.features[0] : gj.type === "Feature" ? gj : { type: "Feature", properties: {}, geometry: gj };
  custom[id] = feature;
}

/** Placeholder disc radius per city, in km. */
export const DISC_RADIUS_KM = { karachi: 24, lahore: 20, islamabad: 18, peshawar: 16, quetta: 15 };
const DEFAULT_RADIUS_KM = 18;

/** { kind: "disc" | "custom", feature, radiusKm } for a city. */
export function cityShape(city) {
  const center = [city.lon, city.lat];
  if (custom[city.id]) return { kind: "custom", feature: custom[city.id], center, radiusKm: DISC_RADIUS_KM[city.id] ?? DEFAULT_RADIUS_KM };
  const radiusKm = DISC_RADIUS_KM[city.id] ?? DEFAULT_RADIUS_KM;
  return { kind: "disc", feature: discFeature(center, radiusKm, { id: city.id }), center, radiusKm };
}

export { circleRing };
