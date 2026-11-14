import { describe, it, expect } from "vitest";
import { getCityList, loadCity, getSnapshot } from "../src/data/api.js";

describe("data API (sample Karachi)", () => {
  it("lists cities from data/index.json", () => {
    const list = getCityList();
    expect(list[0]).toEqual({ id: "karachi", name: "Karachi", lat: 24.86, lon: 67 });
  });

  it("loads a city and rejects unknown ones with a clear message", async () => {
    expect((await loadCity("karachi")).city).toBe("Karachi");
    await expect(loadCity("atlantis")).rejects.toThrow(/Unknown city "atlantis"/);
  });

  it("getSnapshot returns the agreed shape (by object and by id)", async () => {
    const city = await loadCity("karachi");
    const s = getSnapshot(city, 1981, 5);
    expect(Object.keys(s).sort()).toEqual(["interest", "isProjection", "layers", "month", "tension", "year"]);
    expect(Object.keys(s.layers).sort()).toEqual(["air", "drought", "quakes", "rainfall", "temperature"]);
    expect(s.layers.temperature.available).toBe(true);
    expect(s.layers.rainfall.percentile).toBeGreaterThanOrEqual(0);
    expect(s.layers.rainfall.percentile).toBeLessThanOrEqual(100);
    expect(s.isProjection).toBe(false);
    expect(getSnapshot("karachi", 1981, 5)).toEqual(s);
  });

  it("marks layers unavailable before their start year (orchestra grows)", async () => {
    const city = await loadCity("karachi");
    const early = getSnapshot(city, 1950, 6);
    expect(early.layers.temperature.available).toBe(true); // sample starts 1900
    expect(early.layers.rainfall.available).toBe(false); // starts 1981
    expect(early.layers.rainfall.percentile).toBeNull();
    expect(getSnapshot(city, 1990, 6).layers.air.available).toBe(false); // starts 2000
  });

  it("returns earthquakes for the right month only", async () => {
    const city = await loadCity("karachi");
    expect(getSnapshot(city, 2005, 9).layers.quakes[0]).toMatchObject({ magnitude: 7.6, lat: 34.5, lon: 73.6 });
    expect(getSnapshot(city, 2005, 8).layers.quakes).toEqual([]);
  });

  it("flags years after the data as projections and tells you to load first", async () => {
    const city = await loadCity("karachi");
    expect(getSnapshot(city, 2050, 0).isProjection).toBe(true);
    expect(() => getSnapshot("lahore", 1981, 0)).toThrow(/not loaded/);
  });
});
