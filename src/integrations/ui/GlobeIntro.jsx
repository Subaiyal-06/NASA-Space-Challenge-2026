/**
 * GLOBE INTRO SLOT (Contract: { cities, onStart, onSelectCity, reduceMotion })
 * ────────────────────────────────────────────────────────────────────────────
 * Interactive 3D Satellite & Dark Street Map Globe powered by MapLibre GL JS:
 *  - Starts in 3D globe view showing Earth from space, then smoothly flies (`flyTo`)
 *    into Pakistan when the user clicks "Explore Map".
 *  - Uses real `new maplibregl.Marker()` anchored to each city's `[lon, lat]` GPS coordinates
 *    so zooming, panning, rotating, or resizing never misaligns the pins!
 *  - Includes a map style switcher:
 *      🛰️ Satellite (Esri World Imagery + Place Labels — works immediately, no key required)
 *      🗺️ Dark Map (Carto Dark Matter — works immediately, no key required)
 *      🔑 Custom / Google / MapTiler key support via `VITE_MAP_API_KEY` or `VITE_GOOGLE_MAPS_API_KEY`
 *  - Automatically falls back to the offline vector Pakistan map if WebGL is unavailable
 *    (e.g. headless JSDOM tests or offline environment).
 */
import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const CITY_META = {
  karachi: { emoji: "🌊", desc: "Coastal megacity · Arabian Sea" },
  lahore: { emoji: "🌿", desc: "Cultural heart · Ravi plains" },
  islamabad: { emoji: "🏔️", desc: "Capital city · Margalla foothills" },
  peshawar: { emoji: "🏜️", desc: "Historic gateway · Khyber valley" },
  quetta: { emoji: "⛰️", desc: "High-altitude basin · Balochistan" },
};

const PAKISTAN_GEOJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Pakistan" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [61.5, 25.2], [63.0, 25.1], [65.0, 25.2], [67.0, 24.8], [68.2, 23.8],
            [70.8, 24.5], [71.1, 27.8], [73.9, 29.9], [74.6, 31.6], [75.3, 32.5],
            [74.8, 34.6], [76.8, 35.4], [75.8, 36.8], [74.5, 37.0], [71.5, 36.4],
            [71.2, 34.0], [69.9, 33.1], [69.3, 31.6], [66.3, 29.8], [63.0, 29.5],
            [60.9, 29.8], [61.5, 25.2],
          ],
        ],
      },
    },
  ],
};

function canUseWebGL() {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  if (typeof navigator !== "undefined" && /jsdom/i.test(navigator.userAgent)) return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

function buildMapStyle(mapType = "hybrid") {
  const apiKey =
    (typeof import.meta !== "undefined" &&
      (import.meta.env?.VITE_MAP_API_KEY || import.meta.env?.VITE_GOOGLE_MAPS_API_KEY)) ||
    "";

  // If a Google Maps Tile key or MapTiler key is provided, allow using it; otherwise use high-res Esri Satellite + Carto labels
  const satelliteTiles = apiKey && apiKey.startsWith("AIza")
    ? [`https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&key=${apiKey}`]
    : ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"];

  const labelTiles = [
    "https://basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}.png",
  ];

  const darkTiles = [
    "https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
  ];

  const streetTiles = apiKey && apiKey.startsWith("AIza")
    ? [`https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=${apiKey}`]
    : ["https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"];

  const layers = [
    {
      id: "background",
      type: "background",
      paint: { "background-color": "#060e1a" },
    },
  ];

  const sources = {};

  if (mapType === "dark") {
    sources["carto-dark"] = {
      type: "raster",
      tiles: darkTiles,
      tileSize: 256,
    };
    layers.push({
      id: "carto-dark-layer",
      type: "raster",
      source: "carto-dark",
      paint: { "raster-opacity": 0.95 },
    });
  } else if (mapType === "street") {
    sources["street-tiles"] = {
      type: "raster",
      tiles: streetTiles,
      tileSize: 256,
    };
    layers.push({
      id: "street-layer",
      type: "raster",
      source: "street-tiles",
      paint: { "raster-opacity": 1 },
    });
  } else {
    // Default: "hybrid" (Satellite imagery + place labels)
    sources["satellite"] = {
      type: "raster",
      tiles: satelliteTiles,
      tileSize: 256,
      maxzoom: 18,
    };
    layers.push({
      id: "satellite-layer",
      type: "raster",
      source: "satellite",
      paint: { "raster-opacity": 0.92 },
    });

    if (!apiKey.startsWith("AIza")) {
      sources["carto-labels"] = {
        type: "raster",
        tiles: labelTiles,
        tileSize: 256,
      };
      layers.push({
        id: "labels-layer",
        type: "raster",
        source: "carto-labels",
        paint: { "raster-opacity": 0.95 },
      });
    }
  }

  return {
    version: 8,
    sources,
    layers,
  };
}

export default function GlobeIntro({ cities = [], onStart, onSelectCity, reduceMotion = false }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  const [phase, setPhase] = useState("intro"); // "intro" | "flying" | "ready"
  const [mapType, setMapType] = useState("hybrid"); // "hybrid" | "dark" | "street"
  const [webglSupported, setWebglSupported] = useState(() => canUseWebGL());
  const [hoveredCity, setHoveredCity] = useState(null);

  function handlePickCity(cityId) {
    if (typeof onSelectCity === "function") {
      onSelectCity(cityId);
    } else if (typeof onStart === "function") {
      onStart();
    }
  }

  // Initialize MapLibre GL 3D Globe
  useEffect(() => {
    if (!webglSupported || !mapContainerRef.current) return;

    let map;
    try {
      map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: buildMapStyle(mapType),
        center: [42, 24], // Space view showing Africa/Middle East/South Asia
        zoom: 1.85,
        pitch: 0,
        bearing: 0,
        attributionControl: false,
      });

      map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "bottom-right");

      map.on("style.load", () => {
        try {
          if (typeof map.setProjection === "function") {
            map.setProjection({ type: "globe" });
          }
        } catch {}

        // Add subtle Pakistan border highlight
        if (!map.getSource("pakistan-border")) {
          map.addSource("pakistan-border", {
            type: "geojson",
            data: PAKISTAN_GEOJSON,
          });
          map.addLayer({
            id: "pakistan-fill",
            type: "fill",
            source: "pakistan-border",
            paint: {
              "fill-color": "#38bdf8",
              "fill-opacity": 0.1,
            },
          });
          map.addLayer({
            id: "pakistan-outline",
            type: "line",
            source: "pakistan-border",
            paint: {
              "line-color": "#38bdf8",
              "line-width": 2,
              "line-opacity": 0.65,
            },
          });
        }
      });

      mapRef.current = map;
    } catch (err) {
      console.warn("MapLibre init fallback:", err);
      setWebglSupported(false);
    }

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map?.remove();
      mapRef.current = null;
    };
  }, [webglSupported]);

  // Switch map style (Hybrid Satellite / Dark / Street) without losing camera position
  function handleMapTypeChange(nextType) {
    setMapType(nextType);
    const map = mapRef.current;
    if (!map) return;
    const center = map.getCenter();
    const zoom = map.getZoom();
    const pitch = map.getPitch();
    const bearing = map.getBearing();
    map.setStyle(buildMapStyle(nextType));
    map.once("style.load", () => {
      try {
        if (typeof map.setProjection === "function") {
          map.setProjection({ type: "globe" });
        }
      } catch {}
      map.jumpTo({ center, zoom, pitch, bearing });
    });
  }

  // Attach real GPS-anchored MapLibre Markers when phase === 'ready'
  useEffect(() => {
    const map = mapRef.current;
    if (!map || phase !== "ready") return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    cities.forEach((city, idx) => {
      const meta = CITY_META[city.id] ?? { emoji: "📍", desc: "Pakistan" };
      const el = document.createElement("button");
      el.type = "button";
      el.className = "ej-map-pin";
      el.style.animationDelay = reduceMotion ? "0ms" : `${idx * 120}ms`;
      el.setAttribute("aria-label", `Select ${city.name} — ${meta.desc}`);
      el.innerHTML = `
        <div class="ej-map-pin-orb">${meta.emoji}</div>
        <div class="ej-map-pin-label">${city.name}</div>
      `;
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        handlePickCity(city.id);
      });

      const marker = new maplibregl.Marker({
        element: el,
        anchor: "center",
      })
        .setLngLat([city.lon ?? 67.0, city.lat ?? 24.86])
        .addTo(map);

      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
    };
  }, [phase, cities, reduceMotion]);

  // Fly into Pakistan
  function handleExploreMap() {
    const map = mapRef.current;
    if (!map || !webglSupported) {
      setPhase("ready");
      return;
    }
    setPhase("flying");
    map.flyTo({
      center: [69.5, 30.4],
      zoom: 5.15,
      pitch: reduceMotion ? 0 : 28,
      bearing: 0,
      duration: reduceMotion ? 300 : 2800,
      essential: true,
    });
    setTimeout(() => {
      setPhase("ready");
    }, reduceMotion ? 350 : 2850);
  }

  return (
    <div
      className="ej-globe-screen"
      style={{
        position: "relative",
        width: "100%",
        height: "calc(100vh - 54px)",
        minHeight: "540px",
        background: "var(--ej-bg, #060e1a)",
        color: "var(--ej-fg, #e8f4f8)",
        overflow: "hidden",
      }}
    >
      {/* 1. Real 3D Satellite / Street Map Canvas */}
      {webglSupported ? (
        <div ref={mapContainerRef} style={{ position: "absolute", inset: 0 }} />
      ) : (
        <OfflineSvgFallback cities={cities} phase={phase} onPickCity={handlePickCity} />
      )}

      {/* Subtle Space Vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: "radial-gradient(ellipse at center, transparent 65%, rgba(6,14,26,0.8) 100%)",
          zIndex: 1,
        }}
      />

      {/* Map Layer Switcher (Satellite / Dark / Street) */}
      {webglSupported && (
        <div
          style={{
            position: "absolute",
            top: "14px",
            right: "14px",
            zIndex: 15,
            display: "flex",
            gap: "6px",
            background: "rgba(8, 20, 36, 0.85)",
            backdropFilter: "blur(8px)",
            padding: "5px",
            borderRadius: "10px",
            border: "1px solid rgba(56, 189, 248, 0.3)",
          }}
        >
          {[
            { id: "hybrid", label: "🛰️ Satellite" },
            { id: "dark", label: "🌑 Dark Map" },
            { id: "street", label: "🗺️ Street Map" },
          ].map((t) => {
            const active = mapType === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleMapTypeChange(t.id)}
                aria-pressed={active}
                style={{
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontSize: "11.5px",
                  fontWeight: active ? 700 : 500,
                  color: active ? "#ffffff" : "#bae6fd",
                  background: active ? "rgba(14, 165, 233, 0.5)" : "transparent",
                  border: active ? "1px solid rgba(125,211,252,0.6)" : "1px solid transparent",
                  cursor: "pointer",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Phase 1: Intro Splash Card */}
      {phase === "intro" && (
        <div
          className="fade-in"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              pointerEvents: "auto",
              textAlign: "center",
              maxWidth: "540px",
              background: "rgba(8, 20, 36, 0.82)",
              backdropFilter: "blur(12px)",
              padding: "34px 32px",
              borderRadius: "20px",
              border: "1px solid rgba(56, 189, 248, 0.3)",
              boxShadow: "0 20px 50px rgba(0,0,0,0.65)",
            }}
          >
            <div style={{ fontSize: "52px", marginBottom: "10px" }}>🌍</div>
            <h1
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "42px",
                fontWeight: 700,
                margin: "0 0 6px 0",
                color: "#ffffff",
                textShadow: "0 2px 20px rgba(14,165,233,0.5)",
              }}
            >
              Earth Jukebox
            </h1>
            <h2
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "22px",
                color: "#7dd3fc",
                margin: "0 0 14px 0",
              }}
            >
              Pakistan
            </h2>
            <p style={{ fontSize: "16.5px", color: "#e0f2fe", margin: "0 0 10px 0" }}>
              Listen to Pakistan&apos;s climate history, month by month.
            </p>
            <p
              style={{
                fontSize: "13px",
                color: "#bae6fd",
                opacity: 0.85,
                lineHeight: 1.6,
                margin: "0 0 26px 0",
              }}
            >
              Temperature, rainfall, drought, earthquakes, and air quality — each becomes an
              instrument. The music builds as climate stress rises.
            </p>

            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={handleExploreMap}
                style={{
                  padding: "13px 34px",
                  fontSize: "17px",
                  fontWeight: 700,
                  borderRadius: "9999px",
                  color: "#ffffff",
                  background: "linear-gradient(135deg, #1e40af, #0ea5e9)",
                  border: "1px solid rgba(125,211,252,0.5)",
                  boxShadow: "0 0 28px rgba(14,165,233,0.5)",
                  cursor: "pointer",
                }}
                aria-label="Start the Earth Jukebox experience and fly to Pakistan"
              >
                🚀 Fly to Pakistan
              </button>
              <button
                type="button"
                onClick={() => onStart?.()}
                style={{
                  padding: "13px 22px",
                  fontSize: "14.5px",
                  fontWeight: 600,
                  borderRadius: "9999px",
                  color: "#e0f2fe",
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.22)",
                  cursor: "pointer",
                }}
                aria-label="Quick start with Karachi"
              >
                ▶ Quick Start (Karachi)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Phase 2: Flying caption */}
      {phase === "flying" && (
        <div
          style={{
            position: "absolute",
            bottom: "36px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
            padding: "10px 24px",
            borderRadius: "9999px",
            background: "rgba(8, 20, 36, 0.85)",
            border: "1px solid rgba(56, 189, 248, 0.4)",
            color: "#ffffff",
            fontSize: "16px",
            fontWeight: 600,
          }}
        >
          🛰️ Flying into Pakistan…
        </div>
      )}

      {/* Phase 3: Ready — Instruction Banner & Bottom Quick-Select Bar */}
      {phase === "ready" && (
        <>
          <div
            style={{
              position: "absolute",
              top: "14px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 10,
              padding: "8px 20px",
              borderRadius: "9999px",
              background: "rgba(8, 20, 36, 0.88)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(56, 189, 248, 0.4)",
              color: "#e0f2fe",
              fontSize: "13.5px",
              fontWeight: 600,
              boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
            }}
          >
            Tap any city pin on the map (or select below) to start listening
          </div>

          <div
            style={{
              position: "absolute",
              bottom: "18px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 10,
              width: "min(920px, 94vw)",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: "8px",
            }}
          >
            {cities.map((c) => {
              const meta = CITY_META[c.id] ?? { emoji: "📍", desc: "Pakistan" };
              const active = hoveredCity === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handlePickCity(c.id)}
                  onMouseEnter={() => {
                    setHoveredCity(c.id);
                    mapRef.current?.easeTo({
                      center: [c.lon ?? 69.5, c.lat ?? 30.4],
                      duration: 600,
                    });
                  }}
                  onMouseLeave={() => setHoveredCity(null)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "10px",
                    textAlign: "left",
                    background: active ? "rgba(14, 165, 233, 0.35)" : "rgba(8, 20, 36, 0.88)",
                    backdropFilter: "blur(8px)",
                    border: `1px solid ${active ? "#facc15" : "rgba(56, 189, 248, 0.32)"}`,
                    color: "#ffffff",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontSize: "14.5px", fontWeight: 700 }}>
                    {meta.emoji} {c.name}
                  </div>
                  <div style={{ fontSize: "11px", color: "#bae6fd", opacity: 0.85 }}>
                    {meta.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function OfflineSvgFallback({ cities, phase, onPickCity }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(ellipse at center, #0a2744 0%, #0d1b2a 75%)",
      }}
    >
      {phase === "ready" && (
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", zIndex: 5 }}>
          {cities.map((c) => (
            <button key={c.id} type="button" onClick={() => onPickCity(c.id)}>
              {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
