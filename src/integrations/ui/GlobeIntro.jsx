/**
 * GLOBE INTRO SLOT (Contract: { cities, onStart, onSelectCity, reduceMotion })
 * ────────────────────────────────────────────────────────────────────────────
 * Interactive Map & Globe screen powered by:
 *   1. Official Google Maps JavaScript API when `VITE_GOOGLE_MAPS_API_KEY` is configured
 *      (supports 🛰️ Satellite Hybrid, 🌑 Night Dark, 🗺️ Street Roadmap, and ⛰️ Terrain Relief,
 *       with smooth fly-in animation to Pakistan and GPS-locked interactive city pins).
 *   2. MapLibre GL 3D Globe fallback if Google Maps isn't configured or fails to load.
 *   3. Offline SVG Pakistan map fallback if offline or WebGL is unavailable (e.g., tests).
 */
import React, { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const CITY_META = {
  karachi: { emoji: "🌊", desc: "Coastal megacity · Arabian Sea" },
  lahore: { emoji: "🌿", desc: "Cultural heart · Ravi plains" },
  islamabad: { emoji: "🏔️", desc: "Capital city · Margalla foothills" },
  peshawar: { emoji: "🏜️", desc: "Historic gateway · Khyber valley" },
  quetta: { emoji: "⛰️", desc: "High-altitude basin · Balochistan" },
};

const PAKISTAN_COORDS = [
  [61.5, 25.2], [63.0, 25.1], [65.0, 25.2], [67.0, 24.8], [68.2, 23.8],
  [70.8, 24.5], [71.1, 27.8], [73.9, 29.9], [74.6, 31.6], [75.3, 32.5],
  [74.8, 34.6], [76.8, 35.4], [75.8, 36.8], [74.5, 37.0], [71.5, 36.4],
  [71.2, 34.0], [69.9, 33.1], [69.3, 31.6], [66.3, 29.8], [63.0, 29.5],
  [60.9, 29.8], [61.5, 25.2],
];

const PAKISTAN_GEOJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Pakistan" },
      geometry: { type: "Polygon", coordinates: [PAKISTAN_COORDS] },
    },
  ],
};

// Sleek NASA dark-blue theme for Google Maps Night mode
const GOOGLE_NIGHT_STYLES = [
  { elementType: "geometry", stylers: [{ color: "#0b192c" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#060e1a" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#7dd3fc" }] },
  { featureType: "administrative.country", elementType: "geometry.stroke", stylers: [{ color: "#38bdf8" }, { weight: 1.5 }] },
  { featureType: "administrative.province", elementType: "geometry.stroke", stylers: [{ color: "#1e3a5f" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#e0f2fe" }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#0f243e" }] },
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1a365d" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#2b598a" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#050d1a" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#38bdf8" }] },
];

function isJsDom() {
  return typeof navigator !== "undefined" && /jsdom/i.test(navigator.userAgent);
}

function getGoogleApiKey() {
  return (
    (typeof import.meta !== "undefined" &&
      (import.meta.env?.VITE_GOOGLE_MAPS_API_KEY || import.meta.env?.VITE_MAP_API_KEY)) ||
    ""
  );
}

function canUseWebGL() {
  if (typeof window === "undefined" || typeof document === "undefined" || isJsDom()) return false;
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

function loadGoogleMapsSdk(apiKey) {
  if (typeof window === "undefined" || isJsDom() || !apiKey) {
    return Promise.reject(new Error("No Google Maps key or browser environment"));
  }
  if (window.google?.maps?.Map) {
    return Promise.resolve(window.google.maps);
  }
  if (window.__ejGoogleMapsPromise) {
    return window.__ejGoogleMapsPromise;
  }

  window.__ejGoogleMapsPromise = new Promise((resolve, reject) => {
    const cbName = "__ejInitGoogleMaps";
    const timeout = setTimeout(() => {
      reject(new Error("Google Maps script timeout"));
    }, 10000);

    window[cbName] = () => {
      clearTimeout(timeout);
      if (window.google?.maps?.Map) {
        resolve(window.google.maps);
      } else {
        reject(new Error("Google Maps SDK failed to initialize"));
      }
    };

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&callback=${cbName}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      clearTimeout(timeout);
      reject(new Error("Failed to load Google Maps script"));
    };
    document.head.appendChild(script);
  });

  return window.__ejGoogleMapsPromise;
}

function buildMapLibreStyle(mapType = "hybrid") {
  const satelliteTiles = [
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  ];
  const labelTiles = ["https://basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}.png"];
  const darkTiles = ["https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"];
  const streetTiles = ["https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"];

  const layers = [{ id: "background", type: "background", paint: { "background-color": "#060e1a" } }];
  const sources = {};

  if (mapType === "night") {
    sources["carto-dark"] = { type: "raster", tiles: darkTiles, tileSize: 256 };
    layers.push({ id: "carto-dark-layer", type: "raster", source: "carto-dark", paint: { "raster-opacity": 0.95 } });
  } else if (mapType === "street") {
    sources["street-tiles"] = { type: "raster", tiles: streetTiles, tileSize: 256 };
    layers.push({ id: "street-layer", type: "raster", source: "street-tiles", paint: { "raster-opacity": 1 } });
  } else {
    sources["satellite"] = { type: "raster", tiles: satelliteTiles, tileSize: 256, maxzoom: 18 };
    layers.push({ id: "satellite-layer", type: "raster", source: "satellite", paint: { "raster-opacity": 0.92 } });
    sources["carto-labels"] = { type: "raster", tiles: labelTiles, tileSize: 256 };
    layers.push({ id: "labels-layer", type: "raster", source: "carto-labels", paint: { "raster-opacity": 0.95 } });
  }

  return { version: 8, sources, layers };
}

export default function GlobeIntro({ cities = [], onStart, onSelectCity, reduceMotion = false }) {
  const mapContainerRef = useRef(null);
  const googleMapRef = useRef(null);
  const googleOverlaysRef = useRef([]);
  const mapLibreRef = useRef(null);
  const mapLibreMarkersRef = useRef([]);
  const flyTimerRef = useRef(null);

  const googleApiKey = getGoogleApiKey();
  const [engine, setEngine] = useState(() => {
    if (isJsDom()) return "svg";
    if (googleApiKey) return "google";
    return canUseWebGL() ? "maplibre" : "svg";
  });
  const [phase, setPhase] = useState("intro"); // "intro" | "flying" | "ready"
  const [mapType, setMapType] = useState("hybrid"); // "hybrid" | "night" | "street" | "terrain"
  const [hoveredCity, setHoveredCity] = useState(null);

  function handlePickCity(cityId) {
    if (typeof onSelectCity === "function") {
      onSelectCity(cityId);
    } else if (typeof onStart === "function") {
      onStart();
    }
  }

  // ── Engine 1: Official Google Maps JS API ───────────────────────────────────
  useEffect(() => {
    if (engine !== "google" || !mapContainerRef.current) return;
    let cancelled = false;

    loadGoogleMapsSdk(googleApiKey)
      .then((gmaps) => {
        if (cancelled || !mapContainerRef.current) return;

        const map = new gmaps.Map(mapContainerRef.current, {
          center: { lat: 24.0, lng: 45.0 },
          zoom: 3,
          mapTypeId: mapType === "terrain" ? "terrain" : mapType === "street" || mapType === "night" ? "roadmap" : "hybrid",
          styles: mapType === "night" ? GOOGLE_NIGHT_STYLES : null,
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: "greedy",
          backgroundColor: "#060e1a",
          tilt: 0,
        });

        // Subtle Pakistan border outline
        new gmaps.Polygon({
          paths: PAKISTAN_COORDS.map(([lng, lat]) => ({ lat, lng })),
          strokeColor: "#38bdf8",
          strokeOpacity: 0.75,
          strokeWeight: 2,
          fillColor: "#0ea5e9",
          fillOpacity: 0.08,
          clickable: false,
          map,
        });

        googleMapRef.current = map;
      })
      .catch((err) => {
        console.warn("Google Maps failed, falling back to MapLibre:", err);
        if (!cancelled) {
          setEngine(canUseWebGL() ? "maplibre" : "svg");
        }
      });

    return () => {
      cancelled = true;
      if (flyTimerRef.current) cancelAnimationFrame(flyTimerRef.current);
      googleOverlaysRef.current.forEach((o) => o.setMap(null));
      googleOverlaysRef.current = [];
      googleMapRef.current = null;
    };
  }, [engine, googleApiKey]);

  // Apply mapType changes to Google Map
  useEffect(() => {
    const map = googleMapRef.current;
    if (engine !== "google" || !map) return;
    if (mapType === "night") {
      map.setMapTypeId("roadmap");
      map.setOptions({ styles: GOOGLE_NIGHT_STYLES });
    } else if (mapType === "street") {
      map.setMapTypeId("roadmap");
      map.setOptions({ styles: null });
    } else if (mapType === "terrain") {
      map.setMapTypeId("terrain");
      map.setOptions({ styles: null });
    } else {
      map.setMapTypeId("hybrid");
      map.setOptions({ styles: null });
    }
  }, [engine, mapType]);

  // Attach custom GPS-locked HTML city markers on Google Maps when phase === 'ready'
  useEffect(() => {
    const map = googleMapRef.current;
    const gmaps = typeof window !== "undefined" ? window.google?.maps : null;
    if (engine !== "google" || !map || !gmaps || phase !== "ready") return;

    googleOverlaysRef.current.forEach((o) => o.setMap(null));
    googleOverlaysRef.current = [];

    class CityPinOverlay extends gmaps.OverlayView {
      constructor(city, idx) {
        super();
        this.city = city;
        this.idx = idx;
        this.position = new gmaps.LatLng(city.lat ?? 24.86, city.lon ?? 67.0);
        this.div = null;
      }
      onAdd() {
        const meta = CITY_META[this.city.id] ?? { emoji: "📍", desc: "Pakistan" };
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "ej-map-pin";
        btn.style.position = "absolute";
        btn.style.transform = "translate(-50%, -50%)";
        btn.style.animationDelay = reduceMotion ? "0ms" : `${this.idx * 110}ms`;
        btn.setAttribute("aria-label", `Select ${this.city.name} — ${meta.desc}`);
        btn.innerHTML = `
          <div class="ej-map-pin-orb">${meta.emoji}</div>
          <div class="ej-map-pin-label">${this.city.name}</div>
        `;
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          handlePickCity(this.city.id);
        });
        this.div = btn;
        this.getPanes().overlayMouseTarget.appendChild(btn);
      }
      draw() {
        if (!this.div) return;
        const proj = this.getProjection();
        if (!proj) return;
        const pt = proj.fromLatLngToDivPixel(this.position);
        if (pt) {
          this.div.style.left = `${pt.x}px`;
          this.div.style.top = `${pt.y}px`;
        }
      }
      onRemove() {
        if (this.div?.parentNode) {
          this.div.parentNode.removeChild(this.div);
        }
        this.div = null;
      }
    }

    cities.forEach((city, idx) => {
      const overlay = new CityPinOverlay(city, idx);
      overlay.setMap(map);
      googleOverlaysRef.current.push(overlay);
    });

    return () => {
      googleOverlaysRef.current.forEach((o) => o.setMap(null));
      googleOverlaysRef.current = [];
    };
  }, [engine, phase, cities, reduceMotion]);

  // ── Engine 2: MapLibre GL 3D Globe Fallback ─────────────────────────────────
  useEffect(() => {
    if (engine !== "maplibre" || !mapContainerRef.current) return;
    let map;
    try {
      map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: buildMapLibreStyle(mapType),
        center: [42, 24],
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

        if (!map.getSource("pakistan-border")) {
          map.addSource("pakistan-border", { type: "geojson", data: PAKISTAN_GEOJSON });
          map.addLayer({
            id: "pakistan-fill",
            type: "fill",
            source: "pakistan-border",
            paint: { "fill-color": "#38bdf8", "fill-opacity": 0.1 },
          });
          map.addLayer({
            id: "pakistan-outline",
            type: "line",
            source: "pakistan-border",
            paint: { "line-color": "#38bdf8", "line-width": 2, "line-opacity": 0.65 },
          });
        }
      });

      mapLibreRef.current = map;
    } catch {
      setEngine("svg");
    }

    return () => {
      mapLibreMarkersRef.current.forEach((m) => m.remove());
      mapLibreMarkersRef.current = [];
      map?.remove();
      mapLibreRef.current = null;
    };
  }, [engine]);

  useEffect(() => {
    const map = mapLibreRef.current;
    if (engine !== "maplibre" || !map || phase !== "ready") return;

    mapLibreMarkersRef.current.forEach((m) => m.remove());
    mapLibreMarkersRef.current = [];

    cities.forEach((city, idx) => {
      const meta = CITY_META[city.id] ?? { emoji: "📍", desc: "Pakistan" };
      const el = document.createElement("button");
      el.type = "button";
      el.className = "ej-map-pin";
      el.style.animationDelay = reduceMotion ? "0ms" : `${idx * 110}ms`;
      el.setAttribute("aria-label", `Select ${city.name} — ${meta.desc}`);
      el.innerHTML = `
        <div class="ej-map-pin-orb">${meta.emoji}</div>
        <div class="ej-map-pin-label">${city.name}</div>
      `;
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        handlePickCity(city.id);
      });

      const marker = new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat([city.lon ?? 67.0, city.lat ?? 24.86])
        .addTo(map);
      mapLibreMarkersRef.current.push(marker);
    });
  }, [engine, phase, cities, reduceMotion]);

  // Switch MapLibre style if on fallback engine
  function handleMapTypeChange(nextType) {
    setMapType(nextType);
    if (engine === "maplibre" && mapLibreRef.current) {
      const map = mapLibreRef.current;
      const center = map.getCenter();
      const zoom = map.getZoom();
      const pitch = map.getPitch();
      const bearing = map.getBearing();
      map.setStyle(buildMapLibreStyle(nextType));
      map.once("style.load", () => {
        try {
          if (typeof map.setProjection === "function") {
            map.setProjection({ type: "globe" });
          }
        } catch {}
        map.jumpTo({ center, zoom, pitch, bearing });
      });
    }
  }

  // Smooth Fly-In to Pakistan
  function handleExploreMap() {
    if (engine === "google" && googleMapRef.current) {
      const map = googleMapRef.current;
      if (reduceMotion) {
        map.moveCamera({ center: { lat: 30.2, lng: 69.3 }, zoom: 5.7 });
        setPhase("ready");
        return;
      }
      setPhase("flying");
      const startLat = 24.0;
      const startLng = 45.0;
      const startZoom = 3.0;
      const endLat = 30.2;
      const endLng = 69.3;
      const endZoom = 5.7;
      const duration = 2200;
      const startTime = performance.now();

      const step = (now) => {
        const raw = Math.min(1, (now - startTime) / duration);
        const ease = 1 - Math.pow(1 - raw, 3);
        map.moveCamera({
          center: {
            lat: startLat + (endLat - startLat) * ease,
            lng: startLng + (endLng - startLng) * ease,
          },
          zoom: startZoom + (endZoom - startZoom) * ease,
          tilt: ease * 30,
        });
        if (raw < 1) {
          flyTimerRef.current = requestAnimationFrame(step);
        } else {
          setPhase("ready");
        }
      };
      flyTimerRef.current = requestAnimationFrame(step);
      return;
    }

    if (engine === "maplibre" && mapLibreRef.current) {
      setPhase("flying");
      mapLibreRef.current.flyTo({
        center: [69.5, 30.4],
        zoom: 5.15,
        pitch: reduceMotion ? 0 : 28,
        duration: reduceMotion ? 300 : 2400,
        essential: true,
      });
      setTimeout(() => setPhase("ready"), reduceMotion ? 350 : 2450);
      return;
    }

    setPhase("ready");
  }

  function focusCityOnMap(city) {
    setHoveredCity(city.id);
    if (engine === "google" && googleMapRef.current) {
      googleMapRef.current.panTo({ lat: city.lat ?? 30.2, lng: city.lon ?? 69.3 });
    } else if (engine === "maplibre" && mapLibreRef.current) {
      mapLibreRef.current.easeTo({ center: [city.lon ?? 69.5, city.lat ?? 30.4], duration: 500 });
    }
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
      {/* Map Canvas */}
      {engine !== "svg" ? (
        <div ref={mapContainerRef} style={{ position: "absolute", inset: 0 }} />
      ) : (
        <OfflineSvgFallback cities={cities} phase={phase} onPickCity={handlePickCity} />
      )}

      {/* Subtle Edge Vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: "radial-gradient(ellipse at center, transparent 68%, rgba(6,14,26,0.75) 100%)",
          zIndex: 1,
        }}
      />

      {/* Map Layer Switcher */}
      {engine !== "svg" && (
        <div
          style={{
            position: "absolute",
            top: "14px",
            right: "14px",
            zIndex: 15,
            display: "flex",
            gap: "6px",
            background: "rgba(8, 20, 36, 0.88)",
            backdropFilter: "blur(8px)",
            padding: "5px",
            borderRadius: "10px",
            border: "1px solid rgba(56, 189, 248, 0.35)",
          }}
        >
          {[
            { id: "hybrid", label: "🛰️ Satellite" },
            { id: "night", label: "🌑 Night" },
            { id: "street", label: "🗺️ Streets" },
            ...(engine === "google" ? [{ id: "terrain", label: "⛰️ Terrain" }] : []),
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
                  background: active ? "rgba(14, 165, 233, 0.55)" : "transparent",
                  border: active ? "1px solid rgba(125,211,252,0.7)" : "1px solid transparent",
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
              background: "rgba(8, 20, 36, 0.84)",
              backdropFilter: "blur(12px)",
              padding: "34px 32px",
              borderRadius: "20px",
              border: "1px solid rgba(56, 189, 248, 0.35)",
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
                opacity: 0.88,
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
            background: "rgba(8, 20, 36, 0.88)",
            border: "1px solid rgba(56, 189, 248, 0.45)",
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
              left: "16px",
              zIndex: 10,
              padding: "8px 18px",
              borderRadius: "9999px",
              background: "rgba(8, 20, 36, 0.9)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(56, 189, 248, 0.4)",
              color: "#e0f2fe",
              fontSize: "13px",
              fontWeight: 600,
              boxShadow: "0 4px 16px rgba(0,0,0,0.45)",
              pointerEvents: "none",
            }}
          >
            Tap any city pin on {engine === "google" ? "Google Maps" : "the map"} (or choose below)
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
                  onMouseEnter={() => focusCityOnMap(c)}
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

function projectSvgLonLat(lon, lat) {
  const x = ((lon - 60.0) / 18.0) * 340 + 30;
  const y = ((37.5 - lat) / 14.5) * 300 + 30;
  return { x, y };
}

function OfflineSvgFallback({ cities, phase, onPickCity }) {
  const poly = PAKISTAN_COORDS.map(([lon, lat]) => {
    const { x, y } = projectSvgLonLat(lon, lat);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

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
      <svg
        viewBox="0 0 400 360"
        style={{ width: "min(620px, 85vw)", height: "min(520px, 72vh)", overflow: "visible" }}
        role="img"
        aria-label="Offline map of Pakistan"
      >
        <circle cx="200" cy="180" r="165" fill="rgba(14,165,233,0.08)" stroke="rgba(56,189,248,0.2)" />
        <polygon points={poly} fill="rgba(16,185,129,0.14)" stroke="#38bdf8" strokeWidth="2" />
        {phase === "ready" &&
          cities.map((c) => {
            const { x, y } = projectSvgLonLat(c.lon ?? 67, c.lat ?? 25);
            const meta = CITY_META[c.id] ?? { emoji: "📍" };
            return (
              <g
                key={c.id}
                transform={`translate(${x}, ${y})`}
                style={{ cursor: "pointer" }}
                onClick={() => onPickCity(c.id)}
              >
                <circle r="12" fill="rgba(14,165,233,0.3)" stroke="#38bdf8" strokeWidth="2" />
                <circle r="4.5" fill="#38bdf8" />
                <text x="0" y="-16" textAnchor="middle" fill="#fff" fontSize="11.5" fontWeight="bold">
                  {meta.emoji} {c.name}
                </text>
              </g>
            );
          })}
      </svg>
    </div>
  );
}
