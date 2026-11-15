// Camera moves for the globe: idle spin, the spinning zoom into Pakistan, and the flights to a city.
import { easeInOutCubic, lerp, normalizeLng, spinEndLng, zoomForGlobe, zoomForSpan } from "./math.js";

export const PAKISTAN = { lng: 69.6, lat: 29.6 };
const PAKISTAN_SPAN_DEG = 17.5; // about 20.7 to 37.1 north, plus a margin
export const CITY_VIEW = { zoom: 9.2, pitch: 58, bearing: -16 };
export const STAGE_PADDING = { top: 0, left: 0, right: 0, bottom: 110 }; // keeps the picture clear of the bottom bar

const size = (map) => { const el = map.getContainer(); return { w: el.clientWidth, h: el.clientHeight }; };
export const globeZoom = (map) => { const { w, h } = size(map); return zoomForGlobe(Math.min(w, h)); };
export const pakistanZoom = (map) => zoomForSpan(size(map).h, PAKISTAN_SPAN_DEG, 0.78);

/** Slow idle spin. Returns a stop function. */
export function startSpin(map, degPerSecond = 7) {
  let raf = 0;
  let last = performance.now();
  const tick = (now) => {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    const c = map.getCenter();
    map.jumpTo({ center: [normalizeLng(c.lng - degPerSecond * dt), c.lat] });
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

/** The globe keeps turning while it swoops in on Pakistan. Resolves when it has arrived. */
export function zoomIntoPakistan(map, { duration = 5600, reduceMotion = false } = {}) {
  const to = { lat: PAKISTAN.lat, zoom: pakistanZoom(map), pitch: 18 };
  if (reduceMotion) {
    map.jumpTo({ center: [PAKISTAN.lng, to.lat], zoom: to.zoom, pitch: to.pitch });
    return Promise.resolve();
  }
  const c = map.getCenter();
  const from = { lng: c.lng, lat: c.lat, zoom: map.getZoom(), pitch: map.getPitch() };
  const endLng = spinEndLng(from.lng, PAKISTAN.lng, 0); // keeps turning west, lands on Pakistan
  return new Promise((resolve) => {
    const t0 = performance.now();
    const frame = (now) => {
      const t = Math.min(1, (now - t0) / duration);
      const e = easeInOutCubic(t);
      map.jumpTo({
        center: [normalizeLng(lerp(from.lng, endLng, e)), lerp(from.lat, to.lat, e)],
        zoom: lerp(from.zoom, to.zoom, e),
        pitch: lerp(from.pitch, to.pitch, e),
      });
      if (t < 1) requestAnimationFrame(frame); else resolve();
    };
    requestAnimationFrame(frame);
  });
}

/** Fly to a city: tilted so its raised disc can be seen. */
export function flyToCity(map, city, { reduceMotion = false } = {}) {
  const opts = { center: [city.lon, city.lat], ...CITY_VIEW };
  if (reduceMotion) map.jumpTo(opts); else map.easeTo({ ...opts, duration: 1900, easing: easeInOutCubic });
}

/** Fly back out to the whole of Pakistan. */
export function flyToPakistan(map, { reduceMotion = false } = {}) {
  const opts = { center: [PAKISTAN.lng, PAKISTAN.lat], zoom: pakistanZoom(map), pitch: 18, bearing: 0 };
  if (reduceMotion) map.jumpTo(opts); else map.easeTo({ ...opts, duration: 1700, easing: easeInOutCubic });
}
