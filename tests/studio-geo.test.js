import { describe, it, expect } from "vitest";
import {
  zoomForGlobe, zoomForSpan, sortSouthToNorth, normalizeLng, spinEndLng, easeInOutCubic, easeOutBack,
  circleRing, discFeature, ringFeature, grooveFeatures, distanceKm, GROOVE_FRACTIONS,
} from "../src/studio/geo/math.js";
import { cityShape, DISC_RADIUS_KM } from "../src/studio/geo/shapes.js";
import { LABEL_SIDE } from "../src/studio/geo/pins.js";
import { getCityList } from "../src/data/api.js";

describe("pin order and camera maths", () => {
  it("pins pop up south to north", () => {
    const order = sortSouthToNorth(getCityList()).map((c) => c.id);
    expect(order).toEqual(["karachi", "quetta", "lahore", "islamabad", "peshawar"]);
    const lats = sortSouthToNorth(getCityList()).map((c) => c.lat);
    expect([...lats].sort((a, b) => a - b)).toEqual(lats);
  });

  it("the globe zoom grows with the screen and the Pakistan zoom is closer than the globe", () => {
    expect(zoomForGlobe(1000)).toBeGreaterThan(zoomForGlobe(500));
    expect(zoomForSpan(800, 17.5)).toBeGreaterThan(zoomForGlobe(800) + 2);
  });

  it("wraps longitudes and keeps the spin heading west onto Pakistan", () => {
    expect(normalizeLng(190)).toBe(-170);
    expect(normalizeLng(-190)).toBe(170);
    for (const from of [150, 60, -120, 69.6]) {
      const end = spinEndLng(from, 69.6, 0);
      expect(end).toBeLessThanOrEqual(from);
      expect(normalizeLng(end)).toBeCloseTo(69.6, 6);
      expect(spinEndLng(from, 69.6, 1)).toBeCloseTo(end - 360, 6);
    }
  });

  it("easing starts at 0 and ends at 1", () => {
    for (const f of [easeInOutCubic, easeOutBack]) { expect(f(0)).toBeCloseTo(0, 6); expect(f(1)).toBeCloseTo(1, 6); }
  });
});

describe("city discs", () => {
  const karachi = [67.0, 24.86];

  it("a disc has the right radius", () => {
    const ring = circleRing(karachi, 24);
    expect(ring[0]).toEqual(ring[ring.length - 1]); // closed
    for (const p of ring) expect(distanceKm(karachi, p)).toBeGreaterThan(23.5), expect(distanceKm(karachi, p)).toBeLessThan(24.5);
  });

  it("a ring has a hole and the record grooves sit inside the disc", () => {
    expect(ringFeature(karachi, 20, 19.5).geometry.coordinates).toHaveLength(2);
    const grooves = grooveFeatures(karachi, 20);
    expect(grooves).toHaveLength(GROOVE_FRACTIONS.length);
    for (const g of grooves) expect(distanceKm(karachi, g.geometry.coordinates[0][0])).toBeLessThan(20);
    expect(discFeature(karachi, 5).geometry.type).toBe("Polygon");
  });

  it("every city now has its own traced outline: a closed polygon that stays within the disc size around the city", () => {
    for (const c of getCityList()) {
      const s = cityShape(c);
      expect(s.kind).toBe("custom");
      expect(s.radiusKm).toBe(DISC_RADIUS_KM[c.id]);
      expect(s.center).toEqual([c.lon, c.lat]);
      const ring = s.feature.geometry.coordinates[0];
      expect(ring.length).toBeGreaterThan(20);
      expect(ring[0]).toEqual(ring[ring.length - 1]);
      for (const [lon, lat] of ring) {
        const km = Math.hypot((lon - c.lon) * 111.32 * Math.cos((c.lat * Math.PI) / 180), (lat - c.lat) * 110.574);
        expect(km).toBeLessThanOrEqual(DISC_RADIUS_KM[c.id] * 1.12);
      }
    }
  });

  it("names of the close-together cities go to different sides so they never overlap", () => {
    expect(LABEL_SIDE.peshawar).not.toBe(LABEL_SIDE.islamabad);
  });
});
