// The selected city's "ground" rising out of the map like a record on a turntable, with a red outline.
// Layers: a soft shadow on the ground, the raised disc, thin record grooves on top, a raised red rim
// and a red outline on the ground. Weather animations will sit above this disc.
import { COLORS } from "./mapStyle.js";
import { discFeature, grooveFeatures, ringFeature, easeOutBack, easeOutCubic } from "./math.js";

export const PLATE_HEIGHT_M = 3600;
const EMPTY = { type: "FeatureCollection", features: [] };
const fc = (features) => ({ type: "FeatureCollection", features });

export function initPlate(map) {
  for (const id of ["plate-shadow", "plate-body", "plate-grooves", "plate-rim", "plate-outline"]) map.addSource(id, { type: "geojson", data: EMPTY });
  map.addLayer({ id: "plate-shadow", type: "fill", source: "plate-shadow", paint: { "fill-color": "#000000", "fill-opacity": 0 } });
  map.addLayer({ id: "plate-body", type: "fill-extrusion", source: "plate-body", paint: {
    "fill-extrusion-color": "#9FB0FF", "fill-extrusion-height": 0, "fill-extrusion-base": 0, "fill-extrusion-opacity": 0.72, "fill-extrusion-vertical-gradient": true } });
  map.addLayer({ id: "plate-grooves", type: "fill-extrusion", source: "plate-grooves", paint: {
    "fill-extrusion-color": COLORS.mist, "fill-extrusion-height": 0, "fill-extrusion-base": 0, "fill-extrusion-opacity": 0.16 } });
  map.addLayer({ id: "plate-rim", type: "fill-extrusion", source: "plate-rim", paint: {
    "fill-extrusion-color": COLORS.needle, "fill-extrusion-height": 0, "fill-extrusion-base": 0, "fill-extrusion-opacity": 1 } });
  map.addLayer({ id: "plate-outline", type: "line", source: "plate-outline", paint: {
    "line-color": COLORS.needle, "line-width": 2.6, "line-opacity": 0 } });
  map.setLight({ anchor: "map", position: [1.4, 210, 38], color: "#ffffff", intensity: 0.5 });
}

/** Put the geometry of a city's disc into the layers (height stays where it is). */
export function setPlateShape(map, shape) {
  const body = shape.kind === "custom" ? shape.feature : shape.feature;
  // the shadow follows the shape (a slightly larger copy for a real outline, a round one for the placeholder disc)
  const grow = (f, k) => ({ ...f, geometry: { ...f.geometry, coordinates: f.geometry.coordinates.map((ring) => ring.map(([x, y]) => [shape.center[0] + (x - shape.center[0]) * k, shape.center[1] + (y - shape.center[1]) * k])) } });
  map.getSource("plate-shadow").setData(fc([shape.kind === "custom" && shape.feature.geometry.type === "Polygon" ? grow(shape.feature, 1.12) : discFeature(shape.center, shape.radiusKm * 1.14)]));
  map.getSource("plate-body").setData(fc([body]));
  map.getSource("plate-grooves").setData(fc(shape.kind === "disc" ? grooveFeatures(shape.center, shape.radiusKm) : []));
  map.getSource("plate-rim").setData(fc(shape.kind === "disc" ? [ringFeature(shape.center, shape.radiusKm, shape.radiusKm - 0.55)] : []));
  map.getSource("plate-outline").setData(fc([body]));
}

/** 0 = flat on the ground, 1 = fully raised. */
export function setPlateAmount(map, amount) {
  const h = PLATE_HEIGHT_M * amount;
  map.setPaintProperty("plate-body", "fill-extrusion-height", h);
  map.setPaintProperty("plate-grooves", "fill-extrusion-base", h);
  map.setPaintProperty("plate-grooves", "fill-extrusion-height", h + (amount > 0 ? 45 : 0));
  map.setPaintProperty("plate-rim", "fill-extrusion-base", h);
  map.setPaintProperty("plate-rim", "fill-extrusion-height", h + (amount > 0 ? 260 : 0));
  map.setPaintProperty("plate-shadow", "fill-opacity", 0.38 * Math.min(1, amount * 1.5));
  map.setPaintProperty("plate-outline", "line-opacity", Math.min(1, amount * 4));
}

/** Animate the disc rising (or lowering). Returns a promise. */
export function animatePlate(map, from, to, { duration = 1100, reduceMotion = false } = {}) {
  if (reduceMotion) { setPlateAmount(map, to); return Promise.resolve(); }
  return new Promise((resolve) => {
    const t0 = performance.now();
    const frame = (now) => {
      const t = Math.min(1, (now - t0) / duration);
      const e = to >= from ? easeOutBack(t, 1.1) : easeOutCubic(t);
      setPlateAmount(map, Math.max(0, from + (to - from) * e));
      if (t < 1) requestAnimationFrame(frame); else { setPlateAmount(map, to); resolve(); }
    };
    requestAnimationFrame(frame);
  });
}
