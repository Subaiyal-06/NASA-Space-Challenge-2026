// The offline globe: spins, swoops into Pakistan, pops up the city pins, and lifts the chosen city's
// ground out of the map. All the drawing logic is in ./geo; this component only wires it to React.
import React, { useEffect, useRef, useState } from "react";
import { Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "./geo/maplibreSetup.js"; // must run before the first map is created
import { buildStyle } from "./geo/mapStyle.js";
import { globeZoom, startSpin, zoomIntoPakistan, flyToCity, flyToPakistan, STAGE_PADDING } from "./geo/camera.js";
import { createPins } from "./geo/pins.js";
import { initPlate, setPlateShape, animatePlate } from "./geo/cityPlate.js";
import { cityShape } from "./geo/shapes.js";

export default function GlobeStage({ phase, cities, selectedId, onSelect, onArrived, reduceMotion }) {
  const box = useRef(null);
  const api = useRef({ amount: 0, token: 0 });
  const latest = useRef({});
  latest.current = { phase, cities, onSelect, onArrived, reduceMotion };
  const [ready, setReady] = useState(false);

  // Create the map once
  useEffect(() => {
    const map = new MapLibreMap({
      container: box.current, style: buildStyle(latest.current.cities), center: [150, 16], zoom: 1.4, pitch: 0,
      interactive: false, attributionControl: false, fadeDuration: 0, padding: STAGE_PADDING,
    });
    api.current.map = map;
    if (import.meta.env.DEV) window.__studio = { map, api };
    map.once("load", () => {
      initPlate(map);
      map.jumpTo({ zoom: globeZoom(map) });
      api.current.pins = createPins(map, latest.current.cities, { onSelect: (id) => latest.current.onSelect(id) });
      setReady(true);
    });
    const onResize = () => {
      map.resize();
      if (latest.current.phase === "intro") map.jumpTo({ zoom: globeZoom(map) });
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(box.current);
    return () => {
      ro.disconnect();
      api.current.stopSpin?.();
      api.current.pins?.destroy();
      map.remove();
    };
  }, []);

  // The globe turns slowly on the intro screen (unless motion is reduced); it stops when the swoop begins
  useEffect(() => {
    if (!ready) return;
    api.current.stopSpin?.();
    api.current.stopSpin = phase === "intro" && !reduceMotion ? startSpin(api.current.map) : null;
  }, [ready, phase, reduceMotion]);

  // Intro -> swoop into Pakistan -> pins pop up (south to north)
  useEffect(() => {
    if (!ready || phase !== "zooming" || api.current.zoomed) return;
    api.current.zoomed = true;
    const { map, pins } = api.current;
    api.current.stopSpin?.();
    zoomIntoPakistan(map, { reduceMotion: latest.current.reduceMotion })
      .then(() => pins.reveal({ reduceMotion: latest.current.reduceMotion }))
      .then(() => latest.current.onArrived());
  }, [ready, phase]);

  // Choose a city: fly there, raise its ground. Clear: lower it and fly back out.
  useEffect(() => {
    if (!ready || phase !== "explore") return;
    const { map, pins } = api.current;
    const rm = latest.current.reduceMotion;
    const token = ++api.current.token;
    const stale = () => token !== api.current.token;
    (async () => {
      if (api.current.amount > 0) { // a disc is up: lower it first
        await animatePlate(map, api.current.amount, 0, { duration: selectedId ? 350 : 700, reduceMotion: rm });
        api.current.amount = 0;
        if (stale()) return;
      }
      pins.setSelected(selectedId);
      if (!selectedId) { flyToPakistan(map, { reduceMotion: rm }); return; }
      const city = latest.current.cities.find((c) => c.id === selectedId);
      setPlateShape(map, cityShape(city));
      flyToCity(map, city, { reduceMotion: rm });
      await new Promise((r) => setTimeout(r, rm ? 0 : 950));
      if (stale()) return;
      await animatePlate(map, 0, 1, { reduceMotion: rm });
      api.current.amount = 1;
    })();
  }, [ready, phase, selectedId]);

  return <div ref={box} className="stage" role="img" aria-label="Globe zooming into Pakistan, with the cities marked" />;
}
