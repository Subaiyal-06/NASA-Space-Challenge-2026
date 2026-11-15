// Where the city disc is on the screen, so the weather can sit exactly on it. Pure maths over map.project().
import { PLATE_HEIGHT_M } from "../geo/cityPlate.js";

const KM_PER_DEG_LAT = 110.574;
const KM_PER_DEG_LON_EQ = 111.32;
const EARTH_CIRCUMFERENCE_M = 40075016.686;

/** Metres on the ground per screen pixel at this latitude and MapLibre zoom (512 px tiles). */
export const metersPerPixel = (lat, zoom) => (EARTH_CIRCUMFERENCE_M * Math.cos((lat * Math.PI) / 180)) / (512 * 2 ** zoom);

/** How many pixels the raised top of the disc sits above its base (it is lifted by the plate height). */
export const liftPixels = (lat, zoom, pitchDeg, heightM = PLATE_HEIGHT_M) => (heightM / metersPerPixel(lat, zoom)) * Math.sin((pitchDeg * Math.PI) / 180);

/**
 * Screen position and size of the disc: { cx, cy, rx, ry, lift }.
 *   cx, cy = centre of the disc on the ground, rx, ry = half width and half height of its ellipse,
 *   lift = pixels the top surface is raised.   `map` needs project(), getZoom(), getPitch().
 */
export function projectDisc(map, { lon, lat }, radiusKm) {
  const dLat = radiusKm / KM_PER_DEG_LAT;
  const dLon = radiusKm / (KM_PER_DEG_LON_EQ * Math.cos((lat * Math.PI) / 180));
  const c = map.project([lon, lat]);
  const pts = [[lon + dLon, lat], [lon - dLon, lat], [lon, lat + dLat], [lon, lat - dLat]].map((p) => map.project(p));
  const xs = pts.map((p) => p.x); const ys = pts.map((p) => p.y);
  return {
    cx: c.x, cy: c.y,
    rx: (Math.max(...xs) - Math.min(...xs)) / 2,
    ry: (Math.max(...ys) - Math.min(...ys)) / 2,
    lift: liftPixels(lat, map.getZoom(), map.getPitch()),
  };
}
