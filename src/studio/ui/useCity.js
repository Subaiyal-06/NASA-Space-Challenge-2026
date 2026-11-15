// Loads a city through the data API and gives the playback range and the timeline markers.
import { useEffect, useMemo, useState } from "react";
import { loadCity, getRange, getMarkers } from "../../data/api.js";

export function useCity(id, { scenario, futureEnabled = false } = {}) {
  const [city, setCity] = useState(null);
  useEffect(() => {
    let live = true;
    setCity(null);
    if (id) loadCity(id).then((c) => live && setCity(c)).catch(() => {});
    return () => { live = false; };
  }, [id]);
  const range = useMemo(() => (city ? getRange(city, futureEnabled ? scenario : undefined) : null), [city, scenario, futureEnabled]);
  const markers = useMemo(() => (city ? getMarkers(city) : { stories: [], badges: [] }), [city]);
  return { city, range, markers };
}
