// Pure helpers for the globe: camera maths, easing and the shapes of the city "discs". No map code here,
// so everything in this file is unit-tested.
const TILE = 512; // MapLibre tile size: the world is 512 * 2^zoom pixels wide

/** Zoom at which the whole globe is about `fraction` of the smaller screen side. */
export const zoomForGlobe = (minDimPx, fraction = 0.62) => Math.log2((fraction * minDimPx * Math.PI) / TILE);

/** Zoom at which `spanDeg` degrees of latitude fill about `fraction` of the screen height. */
export const zoomForSpan = (heightPx, spanDeg, fraction = 0.7) => Math.log2((360 * fraction * heightPx) / (spanDeg * TILE));

/** Cities from south to north: the order the pins pop up in. */
export const sortSouthToNorth = (cities) => [...cities].sort((a, b) => a.lat - b.lat);

/** Longitude wrapped into -180..180. */
export const normalizeLng = (lng) => ((((lng + 180) % 360) + 360) % 360) - 180;

/**
 * Where the camera longitude should end up so the globe keeps spinning west on its way to `to`,
 * with `extraTurns` additional full turns. The result is always <= from.
 */
export function spinEndLng(from, to, extraTurns = 1) {
  const d = ((((from - to) % 360) + 360) % 360);
  return from - (d + 360 * extraTurns);
}

export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
export const easeOutBack = (t, s = 1.4) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
export const lerp = (a, b, t) => a + (b - a) * t;

const KM_PER_DEG_LAT = 110.574;
const KM_PER_DEG_LON_EQ = 111.32;

/** Points of a circle of `km` radius around [lng, lat], as a closed ring of [lng, lat]. */
export function circleRing([lng, lat], km, steps = 96, reverse = false) {
  const dLat = km / KM_PER_DEG_LAT;
  const dLng = km / (KM_PER_DEG_LON_EQ * Math.cos((lat * Math.PI) / 180));
  const ring = [];
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    ring.push([lng + dLng * Math.cos(a), lat + dLat * Math.sin(a)]);
  }
  ring.push(ring[0]);
  return reverse ? ring.reverse() : ring;
}

/** A GeoJSON polygon: a filled circle. */
export const discFeature = (center, km, props = {}) => ({
  type: "Feature", properties: props, geometry: { type: "Polygon", coordinates: [circleRing(center, km)] },
});

/** A GeoJSON polygon: a thin ring (outer circle with an inner circle cut out). */
export const ringFeature = (center, outerKm, innerKm, props = {}) => ({
  type: "Feature", properties: props,
  geometry: { type: "Polygon", coordinates: [circleRing(center, outerKm), circleRing(center, innerKm, 96, true)] },
});

/** Record-style grooves: thin rings at these fractions of the disc radius. */
export const GROOVE_FRACTIONS = [0.3, 0.5, 0.7, 0.88];
export const grooveFeatures = (center, radiusKm) =>
  GROOVE_FRACTIONS.map((f) => ringFeature(center, radiusKm * f + 0.25, radiusKm * f - 0.25, { groove: true }));

/** Approximate great-circle distance in km (used by tests and by shape checks). */
export function distanceKm([lng1, lat1], [lng2, lat2]) {
  const r = Math.PI / 180;
  const a = Math.sin(((lat2 - lat1) * r) / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(((lng2 - lng1) * r) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}
