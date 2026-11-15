/**
 * GLOBE INTRO SLOT (Contract: { cities, onStart, onSelectCity, reduceMotion })
 * ────────────────────────────────────────────────────────────────────────────
 * Modern Minimal Pastel-Green & White Interactive Map Experience:
 *  - Starts zoomed cleanly on Pakistan (or flies smoothly straight into Pakistan on start)
 *  - City selection buttons float directly ABOVE their respective cities on the map
 *    (anchored to real [lat, lon] via Google Maps OverlayView / MapLibre Marker)
 *  - Official Google Maps JS API (`VITE_GOOGLE_MAPS_API_KEY`) with Pastel Mint,
 *    Satellite, Terrain, and Street styles + MapLibre & Offline SVG fallbacks
 *  - Animated with Framer Motion + crisp Lucide icons (zero emojis)
 */
import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Compass, Layers, MapPin, Mountain, Play, RotateCcw, Satellite, Sparkles } from "lucide-react";
import { GlobeArtifact3D } from "./Artifacts3D.jsx";

const CITY_META = {
  karachi: { desc: "Coastal megacity" },
  lahore: { desc: "Ravi plains" },
  islamabad: { desc: "Margalla foothills" },
  peshawar: { desc: "Khyber valley" },
  quetta: { desc: "High-altitude basin" },
};

const PAKISTAN_CENTER = { lat: 30.15, lng: 69.35 };
const PAKISTAN_ZOOM = 5.65;

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

// Custom Pastel Mint & White theme for Google Maps
const GOOGLE_PASTEL_STYLES = [
  { elementType: "geometry", stylers: [{ color: "#f6fcf9" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#064e3b" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }, { weight: 3 }] },
  { featureType: "administrative.country", elementType: "geometry.stroke", stylers: [{ color: "#10b981" }, { weight: 1.6 }] },
  { featureType: "administrative.province", elementType: "geometry.stroke", stylers: [{ color: "#a7f3d0" }, { weight: 1 }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#ecfdf5" }] },
  { featureType: "landscape.natural.terrain", elementType: "geometry", stylers: [{ color: "#d1fae5" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#bbf7d0" }] },
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.highway", elementType: "geometry.fill", stylers: [{ color: "#d1fae5" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#6ee7b7" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#dbeafe" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#0369a1" }] },
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
    const timeout = setTimeout(() => reject(new Error("Google Maps timeout")), 10000);

    window[cbName] = () => {
      clearTimeout(timeout);
      if (window.google?.maps?.Map) resolve(window.google.maps);
      else reject(new Error("Google Maps SDK failed to initialize"));
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

function buildMapLibreStyle(mapType = "pastel") {
  const satelliteTiles = [
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  ];
  const lightTiles = [
    "https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
  ];
  const labelTiles = [
    "https://basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png",
  ];

  const layers = [{ id: "background", type: "background", paint: { "background-color": "#ecfdf5" } }];
  const sources = {};

  if (mapType === "hybrid") {
    sources["satellite"] = { type: "raster", tiles: satelliteTiles, tileSize: 256, maxzoom: 18 };
    layers.push({ id: "satellite-layer", type: "raster", source: "satellite", paint: { "raster-opacity": 0.92 } });
    sources["labels"] = { type: "raster", tiles: labelTiles, tileSize: 256 };
    layers.push({ id: "labels-layer", type: "raster", source: "labels", paint: { "raster-opacity": 0.9 } });
  } else {
    sources["light-tiles"] = { type: "raster", tiles: lightTiles, tileSize: 256 };
    layers.push({ id: "light-layer", type: "raster", source: "light-tiles", paint: { "raster-opacity": 0.96 } });
  }

  return { version: 8, sources, layers };
}

function buildCityPinDom(city, idx, reduceMotion, onPick) {
  const meta = CITY_META[city.id] ?? { desc: "Pakistan" };
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "ej-city-pin-wrap";
  btn.style.position = "absolute";
  btn.style.transform = "translate(-50%, -100%)";
  btn.style.animationDelay = reduceMotion ? "0ms" : `${idx * 90}ms`;
  btn.setAttribute("aria-label", `Select ${city.name} — ${meta.desc}`);
  btn.innerHTML = `
    <div class="ej-city-btn">
      <div class="ej-city-btn-badge">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
      <div>
        <div class="ej-city-btn-name">${city.name}</div>
        <div class="ej-city-btn-sub">${meta.desc}</div>
      </div>
    </div>
    <div class="ej-city-stem"></div>
    <div class="ej-city-dot"></div>
  `;
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    onPick(city.id);
  });
  return btn;
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
  const [mapType, setMapType] = useState("pastel"); // "pastel" | "hybrid" | "terrain" | "street"

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
          center: { lat: 26.5, lng: 56.0 },
          zoom: 3.6,
          mapTypeId: mapType === "hybrid" ? "hybrid" : mapType === "terrain" ? "terrain" : "roadmap",
          styles: mapType === "pastel" ? GOOGLE_PASTEL_STYLES : null,
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: "greedy",
          backgroundColor: "#f3fbf7",
        });

        // Subtle mint border around Pakistan
        new gmaps.Polygon({
          paths: PAKISTAN_COORDS.map(([lng, lat]) => ({ lat, lng })),
          strokeColor: "#059669",
          strokeOpacity: 0.7,
          strokeWeight: 2,
          fillColor: "#10b981",
          fillOpacity: 0.08,
          clickable: false,
          map,
        });

        googleMapRef.current = map;
      })
      .catch(() => {
        if (!cancelled) setEngine(canUseWebGL() ? "maplibre" : "svg");
      });

    return () => {
      cancelled = true;
      if (flyTimerRef.current) cancelAnimationFrame(flyTimerRef.current);
      googleOverlaysRef.current.forEach((o) => o.setMap(null));
      googleOverlaysRef.current = [];
      googleMapRef.current = null;
    };
  }, [engine, googleApiKey]);

  // Apply mapType changes to Google Maps
  useEffect(() => {
    const map = googleMapRef.current;
    if (engine !== "google" || !map) return;
    if (mapType === "pastel") {
      map.setMapTypeId("roadmap");
      map.setOptions({ styles: GOOGLE_PASTEL_STYLES });
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

  // Render city buttons directly ABOVE each city's real GPS coordinate on Google Maps
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
        this.div = buildCityPinDom(this.city, this.idx, reduceMotion, handlePickCity);
        this.getPanes().floatPane.appendChild(this.div);
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
        if (this.div?.parentNode) this.div.parentNode.removeChild(this.div);
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

  // ── Engine 2: MapLibre GL Fallback ──────────────────────────────────────────
  useEffect(() => {
    if (engine !== "maplibre" || !mapContainerRef.current) return;
    let map;
    try {
      map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: buildMapLibreStyle(mapType),
        center: [56, 26.5],
        zoom: 2.6,
        attributionControl: false,
      });
      map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "bottom-right");

      map.on("style.load", () => {
        if (!map.getSource("pakistan-border")) {
          map.addSource("pakistan-border", { type: "geojson", data: PAKISTAN_GEOJSON });
          map.addLayer({
            id: "pakistan-fill",
            type: "fill",
            source: "pakistan-border",
            paint: { "fill-color": "#10b981", "fill-opacity": 0.1 },
          });
          map.addLayer({
            id: "pakistan-outline",
            type: "line",
            source: "pakistan-border",
            paint: { "line-color": "#059669", "line-width": 2, "line-opacity": 0.75 },
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
      const el = buildCityPinDom(city, idx, reduceMotion, handlePickCity);
      el.style.position = "relative";
      el.style.transform = "none";
      const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([city.lon ?? 67.0, city.lat ?? 24.86])
        .addTo(map);
      mapLibreMarkersRef.current.push(marker);
    });
  }, [engine, phase, cities, reduceMotion]);

  function handleMapTypeChange(nextType) {
    setMapType(nextType);
    if (engine === "maplibre" && mapLibreRef.current) {
      const map = mapLibreRef.current;
      const center = map.getCenter();
      const zoom = map.getZoom();
      map.setStyle(buildMapLibreStyle(nextType));
      map.once("style.load", () => map.jumpTo({ center, zoom }));
    }
  }

  function zoomToPakistan(immediate = false) {
    if (engine === "google" && googleMapRef.current) {
      const map = googleMapRef.current;
      if (immediate || reduceMotion) {
        map.moveCamera({ center: PAKISTAN_CENTER, zoom: PAKISTAN_ZOOM, tilt: 22 });
        setPhase("ready");
        return;
      }
      setPhase("flying");
      const startLat = 26.5;
      const startLng = 56.0;
      const startZoom = 3.6;
      const duration = 1500;
      const startTime = performance.now();

      const step = (now) => {
        const raw = Math.min(1, (now - startTime) / duration);
        const ease = 1 - Math.pow(1 - raw, 3);
        map.moveCamera({
          center: {
            lat: startLat + (PAKISTAN_CENTER.lat - startLat) * ease,
            lng: startLng + (PAKISTAN_CENTER.lng - startLng) * ease,
          },
          zoom: startZoom + (PAKISTAN_ZOOM - startZoom) * ease,
          tilt: ease * 24,
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
        center: [PAKISTAN_CENTER.lng, PAKISTAN_CENTER.lat],
        zoom: 5.2,
        pitch: reduceMotion ? 0 : 24,
        duration: immediate || reduceMotion ? 200 : 1600,
        essential: true,
      });
      setTimeout(() => setPhase("ready"), immediate || reduceMotion ? 220 : 1650);
      return;
    }

    setPhase("ready");
  }

  function resetPakistanView() {
    if (engine === "google" && googleMapRef.current) {
      googleMapRef.current.panTo(PAKISTAN_CENTER);
      googleMapRef.current.setZoom(PAKISTAN_ZOOM);
    } else if (engine === "maplibre" && mapLibreRef.current) {
      mapLibreRef.current.flyTo({ center: [PAKISTAN_CENTER.lng, PAKISTAN_CENTER.lat], zoom: 5.2, duration: 700 });
    }
  }

  return (
    <div
      className="ej-globe-screen"
      style={{
        position: "relative",
        width: "100%",
        height: "calc(100vh - 58px)",
        minHeight: "540px",
        background: "var(--ej-bg-gradient)",
        color: "var(--ej-fg)",
        overflow: "hidden",
      }}
    >
      {/* Map Canvas */}
      {engine !== "svg" ? (
        <div ref={mapContainerRef} style={{ position: "absolute", inset: 0 }} />
      ) : (
        <OfflineSvgPakistanMap cities={cities} phase={phase} onPickCity={handlePickCity} />
      )}

      {/* Soft Pastel Atmospheric Wash */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse at center, transparent 66%, rgba(236, 253, 245, 0.55) 100%)",
          zIndex: 1,
        }}
      />

      {/* Map Layer Switcher */}
      {engine !== "svg" && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.35 }}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            zIndex: 15,
            display: "flex",
            gap: "4px",
            background: "rgba(255, 255, 255, 0.92)",
            backdropFilter: "blur(12px)",
            padding: "5px",
            borderRadius: "12px",
            border: "1px solid var(--ej-border)",
            boxShadow: "var(--ej-shadow-3d)",
          }}
        >
          {[
            { id: "pastel", label: "Pastel", Icon: Sparkles },
            { id: "hybrid", label: "Satellite", Icon: Satellite },
            ...(engine === "google" ? [{ id: "terrain", label: "Terrain", Icon: Mountain }] : []),
            { id: "street", label: "Streets", Icon: Layers },
          ].map(({ id, label, Icon }) => {
            const active = mapType === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => handleMapTypeChange(id)}
                aria-pressed={active}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "6px 11px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: active ? 700 : 500,
                  color: active ? "#ffffff" : "#064e3b",
                  background: active ? "#059669" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                <Icon size={13} />
                {label}
              </button>
            );
          })}
        </motion.div>
      )}

      {/* Phase 1: Minimal Floating Intro Card */}
      <AnimatePresence>
        {phase === "intro" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, y: -12 }}
            transition={{ duration: reduceMotion ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "24px",
              pointerEvents: "none",
            }}
          >
            <div
              className="ej-card-3d"
              style={{
                pointerEvents: "auto",
                textAlign: "center",
                maxWidth: "500px",
                padding: "36px 34px",
                background: "rgba(255, 255, 255, 0.92)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "14px" }}>
                <GlobeArtifact3D size={76} reduceMotion={reduceMotion} />
              </div>

              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 12px",
                  borderRadius: "9999px",
                  background: "#ecfdf5",
                  border: "1px solid #a7f3d0",
                  color: "#059669",
                  fontSize: "11.5px",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  marginBottom: "12px",
                }}
              >
                <Compass size={12} />
                NASA Climate Sonification
              </div>

              <h1
                style={{
                  fontSize: "34px",
                  fontWeight: 800,
                  letterSpacing: "-0.025em",
                  margin: "0 0 6px 0",
                  color: "#064e3b",
                }}
              >
                Earth Jukebox: Pakistan
              </h1>

              <p
                style={{
                  fontSize: "15.5px",
                  color: "#475569",
                  lineHeight: 1.6,
                  margin: "0 0 26px 0",
                }}
              >
                Explore Pakistan&apos;s climate history month by month. Temperature, rainfall,
                drought, air quality, and seismic events shape a living musical score.
              </p>

              <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
                <motion.button
                  type="button"
                  whileHover={reduceMotion ? {} : { scale: 1.03, y: -1 }}
                  whileTap={reduceMotion ? {} : { scale: 0.98 }}
                  onClick={() => zoomToPakistan(false)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "12px 26px",
                    fontSize: "15px",
                    fontWeight: 700,
                    borderRadius: "12px",
                    color: "#ffffff",
                    background: "linear-gradient(135deg, #059669, #10b981)",
                    border: "none",
                    boxShadow: "0 12px 24px -6px rgba(5, 150, 105, 0.4)",
                    cursor: "pointer",
                  }}
                >
                  <MapPin size={17} />
                  Explore Pakistan
                </motion.button>

                <motion.button
                  type="button"
                  whileHover={reduceMotion ? {} : { scale: 1.03 }}
                  whileTap={reduceMotion ? {} : { scale: 0.98 }}
                  onClick={() => onStart?.()}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "7px",
                    padding: "12px 20px",
                    fontSize: "14px",
                    fontWeight: 600,
                    borderRadius: "12px",
                    color: "#064e3b",
                    background: "#ecfdf5",
                    border: "1px solid #a7f3d0",
                    cursor: "pointer",
                  }}
                >
                  <Play size={15} />
                  Quick Start
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase 2: Flying Pill */}
      <AnimatePresence>
        {phase === "flying" && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            style={{
              position: "absolute",
              bottom: "28px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 10,
              padding: "10px 22px",
              borderRadius: "9999px",
              background: "rgba(255, 255, 255, 0.94)",
              border: "1px solid #a7f3d0",
              boxShadow: "var(--ej-shadow-3d)",
              color: "#064e3b",
              fontSize: "14px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Compass size={16} color="#059669" />
            Zooming into Pakistan…
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase 3: Ready — Minimal Top-Left Prompt + Reset View (City buttons sit directly ABOVE each city on the map) */}
      <AnimatePresence>
        {phase === "ready" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              position: "absolute",
              top: "16px",
              left: "16px",
              zIndex: 15,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div
              style={{
                padding: "8px 16px",
                borderRadius: "12px",
                background: "rgba(255, 255, 255, 0.92)",
                backdropFilter: "blur(10px)",
                border: "1px solid var(--ej-border)",
                boxShadow: "var(--ej-shadow-3d)",
                color: "#064e3b",
                fontSize: "13px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "7px",
              }}
            >
              <MapPin size={15} color="#059669" />
              Select a city above its pin on the map
            </div>

            {engine !== "svg" && (
              <button
                type="button"
                onClick={resetPakistanView}
                title="Re-center on Pakistan"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "8px 12px",
                  borderRadius: "12px",
                  background: "rgba(255, 255, 255, 0.92)",
                  border: "1px solid var(--ej-border)",
                  boxShadow: "var(--ej-shadow-3d)",
                  color: "#059669",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <RotateCcw size={13} />
                Re-center
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function projectSvgLonLat(lon, lat) {
  const x = ((lon - 60.0) / 18.0) * 340 + 30;
  const y = ((37.5 - lat) / 14.5) * 300 + 30;
  return { x, y };
}

function OfflineSvgPakistanMap({ cities, phase, onPickCity }) {
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
        background: "var(--ej-bg-gradient)",
      }}
    >
      <div style={{ position: "relative", width: "min(620px, 90vw)", height: "min(520px, 75vh)" }}>
        <svg
          viewBox="0 0 400 360"
          style={{ width: "100%", height: "100%", overflow: "visible" }}
          role="img"
          aria-label="Map of Pakistan"
        >
          <circle cx="200" cy="180" r="165" fill="rgba(209, 250, 229, 0.45)" stroke="#a7f3d0" />
          <polygon points={poly} fill="#d1fae5" stroke="#059669" strokeWidth="2" strokeLinejoin="round" />
        </svg>

        {phase === "ready" &&
          cities.map((c) => {
            const { x, y } = projectSvgLonLat(c.lon ?? 67, c.lat ?? 25);
            const meta = CITY_META[c.id] ?? { desc: "Pakistan" };
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onPickCity(c.id)}
                className="ej-city-pin-wrap"
                style={{
                  position: "absolute",
                  left: `${(x / 400) * 100}%`,
                  top: `${(y / 360) * 100}%`,
                  transform: "translate(-50%, -100%)",
                }}
              >
                <div className="ej-city-btn">
                  <div className="ej-city-btn-badge">
                    <MapPin size={13} />
                  </div>
                  <div>
                    <div className="ej-city-btn-name">{c.name}</div>
                    <div className="ej-city-btn-sub">{meta.desc}</div>
                  </div>
                </div>
                <div className="ej-city-stem" />
                <div className="ej-city-dot" />
              </button>
            );
          })}
      </div>
    </div>
  );
}
