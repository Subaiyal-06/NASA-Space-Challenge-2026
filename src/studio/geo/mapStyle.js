// The offline globe style. Everything is drawn from bundled GeoJSON, so no internet and no map tiles.
import world from "../assets/geo/world.json";
import region from "../assets/geo/region.json";
import provinces from "../assets/geo/provinces.json";

export const COLORS = {
  ocean: "#0F1B46",
  land: "#26337B",
  neighbour: "#2D3C8C",
  pakistan: "#4A5FCB",
  border: "#93A4F5",
  mist: "#EEF1FF",
  sunrise: "#FFC27A",
  needle: "#FF4B4B",
  midnight: "#0C1634",
};

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

export function buildStyle() {
  return {
    version: 8,
    projection: { type: "globe" },
    sky: {
      "sky-color": "#1B2A6B",
      "horizon-color": COLORS.sunrise,
      "fog-color": COLORS.midnight,
      "sky-horizon-blend": 0.5,
      "horizon-fog-blend": 0.5,
      "fog-ground-blend": 0,
      "atmosphere-blend": ["interpolate", ["linear"], ["zoom"], 0, 0.55, 3, 0.4, 4.5, 0],
    },
    sources: {
      world: { type: "geojson", data: world },
      region: { type: "geojson", data: region },
      provinces: { type: "geojson", data: provinces },
      graticule: { type: "geojson", data: graticule() },
    },
    layers: [
      { id: "ocean", type: "background", paint: { "background-color": COLORS.ocean } },
      { id: "graticule", type: "line", source: "graticule", paint: { "line-color": COLORS.border, "line-opacity": 0.1, "line-width": 0.6 } },
      // Fine detail for the region takes over from the world outline when zoomed in (avoids coastline mismatch)
      { id: "world-land", type: "fill", source: "world", paint: { "fill-color": COLORS.land, "fill-opacity": ["interpolate", ["linear"], ["zoom"], 5.2, 1, 6.2, 0] } },
      { id: "neighbours", type: "fill", source: "region", filter: ["!=", ["get", "pak"], true], paint: { "fill-color": COLORS.neighbour } },
      { id: "neighbour-borders", type: "line", source: "region", filter: ["!=", ["get", "pak"], true], paint: { "line-color": COLORS.border, "line-opacity": 0.28, "line-width": 0.8 } },
      { id: "pakistan", type: "fill", source: "region", filter: ["==", ["get", "pak"], true], paint: { "fill-color": COLORS.pakistan } },
      { id: "provinces", type: "line", source: "provinces", minzoom: 3.2, paint: { "line-color": COLORS.mist, "line-opacity": 0.2, "line-width": 0.8 } },
      { id: "pakistan-glow", type: "line", source: "region", filter: ["==", ["get", "pak"], true], paint: { "line-color": COLORS.mist, "line-opacity": 0.22, "line-width": 7, "line-blur": 5 } },
      { id: "pakistan-outline", type: "line", source: "region", filter: ["==", ["get", "pak"], true], paint: { "line-color": COLORS.mist, "line-opacity": 0.85, "line-width": 1.6 } },
    ],
  };
}
