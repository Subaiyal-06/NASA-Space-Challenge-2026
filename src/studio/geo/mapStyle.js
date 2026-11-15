// The offline globe style. The picture of the Earth is NASA satellite imagery stored in the app (public/tiles),
// the lines on top (borders, provinces) are bundled GeoJSON. Nothing needs the internet.
import region from "../assets/geo/region.json";
import provinces from "../assets/geo/provinces.json";

export const COLORS = {
  ocean: "#0A1330",
  border: "#C9D3FF",
  mist: "#EEF1FF",
  sunrise: "#FFC27A",
  needle: "#FF4B4B",
  midnight: "#0C1634",
};

export const IMAGERY_CREDIT = "Imagery: NASA GIBS (Blue Marble, Landsat). Borders: Natural Earth.";

// Where the downloaded tiles cover (see scripts/fetch-imagery.py: keep these in step with it)
export const REGION_BOX = [42, 6, 100, 48]; // wide region, tiles z4-6
export const CORE_BOX = [58, 18, 82, 39]; // Pakistan itself, tiles z7
export const CITY_BOX_DEG = 1.1; // sharp Landsat close-up around each city (about 120 km), tiles z8-10

// Folder of the tiles, next to index.html. Works from a web server and from a file on disk (installed app).
const tileBase = () => window.location.href.split("#")[0].replace(/[^/]*$/, "") + "tiles/";

// Faint lines of latitude and longitude every 15 degrees, so the globe reads as a globe while it spins
function graticule() {
  const lines = [];
  for (let lng = -180; lng < 180; lng += 15) {
    const l = []; for (let lat = -80; lat <= 80; lat += 4) l.push([lng, lat]); lines.push(l);
  }
  for (let lat = -75; lat <= 75; lat += 15) {
    const l = []; for (let lng = -180; lng <= 180; lng += 4) l.push([lng, lat]); lines.push(l);
  }
  return { type: "Feature", properties: {}, geometry: { type: "MultiLineString", coordinates: lines } };
}

export function buildStyle(cities) {
  const base = tileBase();
  const raster = (name, extra) => ({ type: "raster", tiles: [`${base}${name}/{z}/{x}/{y}.jpg`], tileSize: 256, ...extra });
  const sources = {
    "bm-global": raster("bluemarble", { minzoom: 0, maxzoom: 3 }),
    "bm-region": raster("bluemarble", { minzoom: 4, maxzoom: 6, bounds: REGION_BOX }),
    "bm-core": raster("bluemarble", { minzoom: 7, maxzoom: 7, bounds: CORE_BOX }),
    region: { type: "geojson", data: region },
    provinces: { type: "geojson", data: provinces },
    graticule: { type: "geojson", data: graticule() },
  };
  const closeUps = cities.map((c) => {
    const id = `landsat-${c.id}`;
    sources[id] = raster("landsat", { minzoom: 8, maxzoom: 10, bounds: [c.lon - CITY_BOX_DEG, c.lat - CITY_BOX_DEG, c.lon + CITY_BOX_DEG, c.lat + CITY_BOX_DEG] });
    return {
      id, type: "raster", source: id,
      paint: { "raster-opacity": ["interpolate", ["linear"], ["zoom"], 7.3, 0, 8.4, 1], "raster-saturation": 0.35, "raster-contrast": 0.18, "raster-fade-duration": 0 },
    };
  });

  return {
    version: 8,
    projection: { type: "globe" },
    // A thin blue-and-gold glow around the edge of the Earth, like seen from orbit at sunrise
    sky: {
      "sky-color": "#3B6BD9",
      "horizon-color": COLORS.sunrise,
      "fog-color": COLORS.midnight,
      "sky-horizon-blend": 0.35,
      "horizon-fog-blend": 0.5,
      "fog-ground-blend": 0,
      "atmosphere-blend": ["interpolate", ["linear"], ["zoom"], 0, 1, 3, 0.8, 5, 0],
    },
    sources,
    layers: [
      { id: "ocean", type: "background", paint: { "background-color": COLORS.ocean } },
      { id: "bm-global", type: "raster", source: "bm-global", paint: { "raster-saturation": 0.1, "raster-contrast": 0.08, "raster-fade-duration": 0 } },
      { id: "bm-region", type: "raster", source: "bm-region", paint: { "raster-saturation": 0.1, "raster-contrast": 0.08, "raster-fade-duration": 0 } },
      { id: "bm-core", type: "raster", source: "bm-core", paint: { "raster-saturation": 0.1, "raster-contrast": 0.08, "raster-fade-duration": 0 } },
      ...closeUps,
      { id: "graticule", type: "line", source: "graticule", paint: { "line-color": COLORS.border, "line-opacity": 0.08, "line-width": 0.6 } },
      { id: "neighbour-borders", type: "line", source: "region", filter: ["!=", ["get", "pak"], true], paint: { "line-color": COLORS.border, "line-opacity": 0.4, "line-width": 0.9 } },
      { id: "provinces", type: "line", source: "provinces", minzoom: 3.2, paint: { "line-color": COLORS.mist, "line-opacity": 0.32, "line-width": 0.9, "line-dasharray": [2, 2] } },
      { id: "pakistan-glow", type: "line", source: "region", filter: ["==", ["get", "pak"], true], paint: { "line-color": COLORS.sunrise, "line-opacity": 0.35, "line-width": 8, "line-blur": 6 } },
      { id: "pakistan-outline", type: "line", source: "region", filter: ["==", ["get", "pak"], true], paint: { "line-color": COLORS.mist, "line-opacity": 0.95, "line-width": 1.8 } },
    ],
  };
}
