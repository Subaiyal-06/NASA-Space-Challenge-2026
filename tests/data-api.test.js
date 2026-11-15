import { describe, it, expect } from "vitest";
import sample from "../data/cities/karachi.sample.json";
import {
  getCityList, loadCity, getSnapshot, getRange, getBaselineSnapshot, getSeries, getMarkers, getDataNotes, getExtras,
} from "../src/data/api.js";
import { getTension, getInterest, getRecords, quakeFloor, dataYears } from "../src/data/derived.js";
import { checkCity } from "../src/data/validate.js";
import { DATA_CONFIG } from "../src/data/config.js";
import { applyAdapters } from "../src/data/adapters/index.js";

const SNAPSHOT_KEYS = ["interest", "isProjection", "layers", "month", "tension", "year"];
const withSource = { ...sample }; // sample projection already names its (sample) source

describe("city list and loading (real data from the data team)", () => {
  it("lists the five cities in data/index.json", () => {
    expect(getCityList().map((c) => c.id)).toEqual(["karachi", "lahore", "islamabad", "peshawar", "quetta"]);
  });

  it("loads a city and rejects unknown ones; a file without a projection loads fine", async () => {
    const karachi = await loadCity("karachi");
    expect(karachi.city).toBe("Karachi");
    expect(karachi.projection).toBeUndefined();
    expect(getDataNotes("karachi")).toEqual([]);
    await expect(loadCity("atlantis")).rejects.toThrow(/Unknown city "atlantis"/);
  });

  it("all five real files load without errors", async () => {
    for (const { id } of getCityList()) {
      const city = await loadCity(id);
      expect(checkCity(city).errors).toEqual([]);
    }
  });
});

describe("getSnapshot", () => {
  it("returns the agreed shape (by object and by id)", async () => {
    const city = await loadCity("karachi");
    const s = getSnapshot(city, 1981, 5);
    expect(Object.keys(s).sort()).toEqual(SNAPSHOT_KEYS);
    expect(Object.keys(s.layers).sort()).toEqual(["air", "drought", "quakes", "rainfall", "temperature"]);
    expect(s.isProjection).toBe(false);
    expect(getSnapshot("karachi", 1981, 5)).toEqual(s);
  });

  it("shows the 2022 flood and the 2005 earthquake in the real data", async () => {
    const karachi = await loadCity("karachi");
    const flood = getSnapshot(karachi, 2022, 6);
    expect(flood.layers.rainfall.value).toBeGreaterThan(390);
    expect(flood.layers.rainfall.percentile).toBeGreaterThanOrEqual(95);
    const islamabad = await loadCity("islamabad");
    expect(getSnapshot(islamabad, 2005, 9).layers.quakes.some((q) => q.magnitude === 7.6)).toBe(true);
    expect(getSnapshot(islamabad, 2005, 8).layers.quakes.filter((q) => q.magnitude === 7.6)).toEqual([]);
  });

  it("marks layers unavailable before their start year (sample file)", () => {
    const early = getSnapshot(sample, 1950, 6);
    expect(early.layers.temperature.available).toBe(true); // sample starts 1900
    expect(early.layers.rainfall.available).toBe(false); // starts 1981
    expect(early.layers.rainfall.percentile).toBeNull();
    expect(getSnapshot(sample, 1990, 6).layers.air.available).toBe(false); // starts 2000
  });

  it("tells you to load a city first", () => {
    expect(() => getSnapshot("not-loaded", 1981, 0)).toThrow(/not loaded/);
  });
});

describe("derived fallbacks (data team's values always win)", () => {
  const strip = (c) => { const { tension, interest, baseline, records, ...rest } = c; return rest; };

  it("computes tension and interest when the file has none, and flood months score higher", async () => {
    const bare = strip(await loadCity("karachi"));
    const flood = getTension(bare, 2022, 6);
    expect(flood).toBeGreaterThanOrEqual(0); expect(flood).toBeLessThanOrEqual(1);
    expect(getInterest(bare, 2022, 6)).toBeGreaterThan(getInterest(bare, 1987, 2));
    expect(getSnapshot(bare, 2022, 6).tension).toBe(flood);
    // same month with the flood rain replaced by normal rain: tension must be lower
    const noFlood = structuredClone(bare);
    noFlood.layers.rainfall.monthly[2022][6] = noFlood.layers.rainfall.normals[6];
    expect(flood).toBeGreaterThan(getTension(noFlood, 2022, 6));
  });

  it("uses the file's own tension when present", async () => {
    const city = await loadCity("karachi");
    const forced = { ...city, tension: { 2000: Array(12).fill(0.77) } };
    expect(getSnapshot(forced, 2000, 3).tension).toBe(0.77);
  });

  it("derives baseline and records when missing", async () => {
    const bare = strip(await loadCity("lahore"));
    const b = getBaselineSnapshot(bare, 6);
    expect(b.isBaseline).toBe(true);
    expect(b.layers.rainfall.available).toBe(true);
    expect(getRecords(bare).length).toBeGreaterThan(3);
    expect(getRecords(bare).every((r) => /in our data/.test(r.text))).toBe(true);
  });
});

describe("range, baseline, series, markers", () => {
  it("getRange: real data 1981-2025, projection only with a named source", async () => {
    const real = await loadCity("karachi");
    expect(getRange(real)).toMatchObject({ startYear: 1981, endYear: 2025 });
    expect(getRange(real, "ssp245").endYear).toBe(2025); // no projection in the file yet
    expect(getRange(real).layerStartYears.air).toBeNull(); // real files have no air layer yet
    expect(getRange(real).layerStartYears.vegetation).toBe(2001); // extra layers are reported too
    expect(getRange(withSource).startYear).toBe(1900);
    expect(getRange(withSource, "ssp245").endYear).toBe(2100);
  });

  it("projected years: temperature only, flagged, and tension rises", () => {
    const now = getSnapshot(withSource, 2025, 6, "ssp585");
    const later = getSnapshot(withSource, 2100, 6, "ssp585");
    expect(later.isProjection).toBe(true);
    expect(later.layers.temperature.available).toBe(true);
    expect(later.layers.rainfall.available).toBe(false);
    expect(later.tension).toBeGreaterThan(getSnapshot(withSource, 2050, 6, "ssp585").tension - 0.0001);
    expect(getSnapshot(withSource, 2101, 6, "ssp585").layers.temperature.available).toBe(false);
    expect(getSnapshot(withSource, 2050, 6).layers.temperature.available).toBe(false); // no scenario chosen
    expect(now.isProjection).toBe(false);
  });

  it("getBaselineSnapshot is the 1981-1990 average for that calendar month (derived)", async () => {
    const city = await loadCity("karachi");
    const b = getBaselineSnapshot(city, 6);
    expect(b.year).toBeNull();
    const avg = (layer) => [...Array(10).keys()].reduce((sum, i) => sum + city.layers[layer].monthly[1981 + i][6], 0) / 10;
    expect(b.layers.temperature.anomaly).toBeCloseTo(avg("temperature"), 1);
    expect(b.layers.rainfall.value).toBeCloseTo(avg("rainfall"), 1);
  });

  it("the file's own baseline wins over the derived one", async () => {
    const city = await loadCity("karachi");
    const forced = { ...city, baseline: { temperature: Array(12).fill(0.5), rainfall: Array(12).fill(7) } };
    expect(getBaselineSnapshot(forced, 6).layers.rainfall.value).toBe(7);
  });

  it("getSeries returns month-by-month values and rejects unknown layers", async () => {
    const city = await loadCity("karachi");
    const t = getSeries(city, "temperature", 1981, 1982);
    expect(t).toHaveLength(24);
    expect(t[0]).toMatchObject({ year: 1981, month: 0 });
    expect(getSeries(city, "quakes", 2013, 2013).some((q) => q.value === 7.7)).toBe(true);
    expect(getSeries(city, "quakes", 1981, 2025).every((q) => q.value >= quakeFloor(city))).toBe(true);
    expect(getSeries(city, "tension", 1990, 1990)).toHaveLength(12);
    expect(() => getSeries(city, "bogus", 1981, 1982)).toThrow(/unknown layer/);
  });

  it("getMarkers returns stories and badges", async () => {
    const m = getMarkers(await loadCity("quetta"));
    expect(Array.isArray(m.stories)).toBe(true);
    expect(m.badges.length).toBeGreaterThan(0);
  });
});

describe("adapters and validator", () => {
  it("keeps a projection that names its source", () => {
    expect(applyAdapters(withSource).notes).toEqual([]);
    expect(applyAdapters(withSource).city.projection).toBeDefined();
  });

  it("warns about an unsourced projection and errors on broken files", () => {
    const { projection, ...rest } = withSource;
    const noSource = { ...rest, projection: { temperature: {} } };
    expect(checkCity(noSource).warnings.join(" ")).toContain("projection");
    const broken = structuredClone(sample);
    broken.layers.rainfall.normals = [1, 2];
    expect(checkCity(broken).errors.join(" ")).toContain("normals must be 12 numbers");
  });
});

describe("extra layers (greenery now; aqi and night lights later) and the earthquake floor", () => {
  it("getExtras returns the vegetation (greenery) layer with its source and unit", async () => {
    const karachi = await loadCity("karachi");
    const e = getExtras(karachi, 2020, 7);
    expect(e.vegetation).toMatchObject({ available: true, unit: expect.stringContaining("NDVI") });
    expect(e.vegetation.value).toBeCloseTo(0.1279, 4);
    expect(e.vegetation.source).toContain("MODIS");
    expect(getExtras(karachi, 1990, 0).vegetation).toMatchObject({ available: false, value: null }); // starts 2001
    expect(getSeries(karachi, "vegetation", 2020, 2020)).toHaveLength(12);
  });

  it("a new monthly or yearly layer works with no code change", async () => {
    const city = structuredClone(await loadCity("lahore"));
    city.layers.aqi = { source: "test", unit: "AQI", startYear: 2000, monthly: { 2010: Array(12).fill(150) } };
    city.layers.nightlights = { source: "test", unit: "radiance", startYear: 2012, yearly: { 2015: 42.5 } };
    expect(checkCity(city).errors).toEqual([]);
    expect(getExtras(city, 2010, 3).aqi).toMatchObject({ available: true, value: 150 });
    expect(getExtras(city, 2015, 3).nightlights).toMatchObject({ available: true, value: 42.5 });
    expect(getExtras(city, 2016, 3).nightlights.available).toBe(false); // no value that year
    expect(getSeries(city, "nightlights", 2012, 2020)).toEqual([{ year: 2015, month: 0, value: 42.5 }]);
    expect(getRange(city).layerStartYears).toMatchObject({ aqi: 2000, nightlights: 2012 });
  });

  it("the validator rejects a malformed extra layer clearly", async () => {
    const city = structuredClone(await loadCity("lahore"));
    city.layers.aqi = { unit: "AQI", startYear: 2000, monthly: { 2010: [1, 2] } };
    const msg = checkCity(city).errors.join(" ");
    expect(msg).toContain("aqi: source is required");
    expect(msg).toContain("aqi.monthly[2010]: must be 12 numbers");
  });

  it("small earthquakes stay in the file but are not reported (Peshawar has about 3-4 per month)", async () => {
    const peshawar = await loadCity("peshawar");
    const all = peshawar.layers.earthquakes.events.filter((e) => e.year >= 1981);
    const reported = getSeries(peshawar, "quakes", 1981, 2025);
    expect(all.length).toBeGreaterThan(1500);
    expect(reported.length).toBeLessThan(250);
    expect(reported.length).toBe(all.filter((e) => e.mag >= quakeFloor(peshawar)).length);
  });
});

describe("earthquake floor is chosen per city (notable for where it is)", () => {
  it("quiet cities report smaller quakes, busy ones only strong ones, and no city shakes more than about one month in eight", async () => {
    const floors = {};
    for (const id of ["karachi", "lahore", "islamabad", "peshawar", "quetta"]) {
      const city = await loadCity(id);
      floors[id] = quakeFloor(city);
      const months = new Set(getSeries(city, "quakes", 1981, 2025).map((q) => q.year * 12 + q.month)).size;
      expect(months / (dataYears(city).length * 12)).toBeLessThanOrEqual(DATA_CONFIG.maxQuakeMonthShare + 0.0001);
    }
    expect(floors.karachi).toBeLessThan(floors.peshawar);
    expect(floors.karachi).toBe(5);
  });
});

describe("drought layer (SPI-3 computed by us from the real NASA rainfall)", () => {
  it("is present for every city, starts in 1982 and names how it was made", async () => {
    for (const { id } of getCityList()) {
      const d = (await loadCity(id)).layers.drought;
      expect(d.startYear).toBe(1982); // needs 2 earlier months of rain, so the first full year is 1982
      expect(d.source).toContain("Computed by us");
      expect(d.unit).toContain("SPI-3");
      expect(Object.values(d.monthly).flat().every((v) => v >= -3 && v <= 3)).toBe(true);
    }
  });

  it("is unavailable before 1982 and available after (the orchestra grows)", async () => {
    const karachi = await loadCity("karachi");
    expect(getSnapshot(karachi, 1981, 5).layers.drought.available).toBe(false);
    expect(getSnapshot(karachi, 1982, 5).layers.drought.available).toBe(true);
    expect(getBaselineSnapshot(karachi, 5).layers.drought.available).toBe(true);
  });

  it("is a proper standard score: average near 0, spread near 1, about 15% dry and 15% wet", async () => {
    for (const { id } of getCityList()) {
      const v = Object.values((await loadCity(id)).layers.drought.monthly).flat();
      const mean = v.reduce((a, b) => a + b, 0) / v.length;
      const sd = Math.sqrt(v.reduce((a, b) => a + (b - mean) ** 2, 0) / v.length);
      expect(Math.abs(mean)).toBeLessThan(0.15);
      expect(sd).toBeGreaterThan(0.85); expect(sd).toBeLessThan(1.15);
      expect(v.filter((x) => x < -1).length / v.length).toBeGreaterThan(0.08);
      expect(v.filter((x) => x < -1).length / v.length).toBeLessThan(0.22);
    }
  });

  it("matches real events: the 2022 Karachi flood is very wet and the 1999-2001 Quetta drought is dry", async () => {
    const karachi = await loadCity("karachi");
    expect(getSnapshot(karachi, 2022, 7).layers.drought.spi).toBeGreaterThan(2); // August 2022
    const quetta = await loadCity("quetta");
    const avg = (y) => quetta.layers.drought.monthly[y].reduce((a, b) => a + b, 0) / 12;
    expect(avg(2000)).toBeLessThan(-1);
    expect(avg(1999) + avg(2000) + avg(2001)).toBeLessThan(-2);
  });
});
