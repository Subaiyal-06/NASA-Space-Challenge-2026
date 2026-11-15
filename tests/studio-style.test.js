// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { existsSync, readdirSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildStyle, REGION_BOX, CORE_BOX, CITY_BOX_DEG } from "../src/studio/geo/mapStyle.js";
import { getCityList } from "../src/data/api.js";

const TILES = resolve(dirname(fileURLToPath(import.meta.url)), "../public/tiles").split(String.fromCharCode(92)).join("/") + "/";
const tileXY = (lon, lat, z) => {
  const n = 2 ** z;
  return [Math.floor(((lon + 180) / 360) * n), Math.floor(((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) * n)];
};
const has = (layer, z, lon, lat) => { const [x, y] = tileXY(lon, lat, z); return existsSync(`${TILES}${layer}/${z}/${x}/${y}.jpg`); };

describe("globe imagery style", () => {
  const cities = getCityList();
  const style = buildStyle(cities);

  it("has the Earth photo layers underneath and the border lines on top", () => {
    const ids = style.layers.map((l) => l.id);
    expect(ids.indexOf("bm-global")).toBeLessThan(ids.indexOf("bm-region"));
    expect(ids.indexOf("bm-core")).toBeLessThan(ids.indexOf(`landsat-${cities[0].id}`));
    expect(ids.indexOf(`landsat-${cities[0].id}`)).toBeLessThan(ids.indexOf("pakistan-outline"));
    expect(style.projection.type).toBe("globe");
  });

  it("has a sharp close-up source for every city, centred on it, and tiles are read from disk", () => {
    for (const c of cities) {
      const s = style.sources[`landsat-${c.id}`];
      expect(s.bounds).toEqual([c.lon - CITY_BOX_DEG, c.lat - CITY_BOX_DEG, c.lon + CITY_BOX_DEG, c.lat + CITY_BOX_DEG]);
      expect(s.tiles[0]).toMatch(/tiles\/landsat\/\{z\}\/\{x\}\/\{y\}\.jpg$/);
      expect([s.minzoom, s.maxzoom]).toEqual([8, 10]);
    }
  });

  it("the downloaded tiles really cover what the style asks for", () => {
    for (let z = 0; z <= 3; z++) for (let x = 0; x < 2 ** z; x++) for (let y = 0; y < 2 ** z; y++)
      expect(existsSync(`${TILES}bluemarble/${z}/${x}/${y}.jpg`)).toBe(true); // whole world, z0-3
    const [w, s, e, n] = REGION_BOX;
    for (const z of [4, 5, 6]) for (const [lon, lat] of [[w + 0.01, s + 0.01], [e - 0.01, n - 0.01], [70, 30]]) expect(has("bluemarble", z, lon, lat)).toBe(true);
    for (const [lon, lat] of [[CORE_BOX[0] + 0.01, CORE_BOX[1] + 0.01], [CORE_BOX[2] - 0.01, CORE_BOX[3] - 0.01]]) expect(has("bluemarble", 7, lon, lat)).toBe(true);
    for (const c of cities) for (const z of [8, 9, 10]) {
      expect(has("landsat", z, c.lon, c.lat)).toBe(true); // centre
      expect(has("landsat", z, c.lon - CITY_BOX_DEG + 0.01, c.lat - CITY_BOX_DEG + 0.01)).toBe(true); // corner of the box
      expect(has("landsat", z, c.lon + CITY_BOX_DEG - 0.01, c.lat + CITY_BOX_DEG - 0.01)).toBe(true);
    }
  });

  it("stays small enough to bundle (under 12 MB of tiles)", () => {
    let bytes = 0;
    const walk = (d) => { for (const f of readdirSync(d, { withFileTypes: true })) f.isDirectory() ? walk(`${d}/${f.name}`) : (bytes += statSync(`${d}/${f.name}`).size); };
    walk(TILES.replace(/\/$/, ""));
    expect(bytes).toBeLessThan(12 * 1024 * 1024);
  });
});
