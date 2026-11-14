// Member 1's private test page for the audio engine. Open: http://localhost:5173/audio-test.html
import { useEffect, useRef, useState } from "react";
import * as audio from "../audio/index.js";
import { listCities, loadCity } from "../data/loader.js";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function AudioTest() {
  const [playing, setPlaying] = useState(false);
  const [bar, setBar] = useState(0);
  const [tension, setTension] = useState(0);
  const cities = listCities();
  const [cityId, setCityId] = useState(cities.includes("karachi") ? "karachi" : cities[0]);
  const [year, setYear] = useState(2022);
  const [month, setMonth] = useState(6);
  const [auto, setAuto] = useState(false); // advance one month per bar
  const [layers, setLayers] = useState([...audio.LAYER_NAMES]);
  const [city, setCity] = useState(null);
  const ym = useRef({ year, month });
  ym.current = { year, month };

  useEffect(() => audio.onNewBar(() => setBar(audio.currentBar())), []);

  useEffect(() => { loadCity(cityId).then((c) => { setCity(c); audio.setCity(c); }); }, [cityId]);
  useEffect(() => { audio.setMonth(year, month); const t = city?.tension?.[year]?.[month]; if (t != null) { setTension(t); audio.setTension(t); } }, [year, month, city]);
  useEffect(() => { audio.setLayers(layers); }, [layers]);

  // Auto-play: step one month every 2.5 s (the real clock will do this in the finished app)
  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => {
      const { year: y, month: m } = ym.current;
      if (m === 11) { setYear(y + 1); setMonth(0); } else setMonth(m + 1);
    }, audio.BAR_LENGTH_SECONDS * 1000);
    return () => clearInterval(id);
  }, [auto]);

  const toggle = async () => {
    if (playing) { audio.stop(); setPlaying(false); setAuto(false); }
    else { await audio.start(); setPlaying(true); }
  };
  const toggleLayer = (l) => setLayers((ls) => (ls.includes(l) ? ls.filter((x) => x !== l) : [...ls, l]));
  const manualTension = (e) => { const v = parseFloat(e.target.value); setTension(v); audio.setTension(v); };

  return (
    <main className="p-8 max-w-xl mx-auto space-y-5">
      <h1 className="text-2xl font-bold">Audio test (Member 1)</h1>
      <button onClick={toggle} className="px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-lg">
        {playing ? "Stop" : "Start"}
      </button>
      <p>Bar counter: <b>{bar}</b> &middot; one bar = {audio.BAR_LENGTH_SECONDS} s</p>

      <div className="flex gap-3 items-center flex-wrap">
        <select value={cityId} onChange={(e) => setCityId(e.target.value)} className="bg-slate-800 p-2 rounded">
          {cities.map((c) => <option key={c}>{c}</option>)}
        </select>
        <input type="number" value={year} min="1900" max="2025" onChange={(e) => setYear(+e.target.value)} className="bg-slate-800 p-2 rounded w-24" />
        <select value={month} onChange={(e) => setMonth(+e.target.value)} className="bg-slate-800 p-2 rounded">
          {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
        </select>
        <label><input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} /> auto-advance</label>
      </div>
      <p className="text-sm opacity-70">Try Karachi Jul 1987 (dry) then Jul 2022 (flood): the second should have many rain notes and rain hiss.</p>

      <div className="flex gap-4 flex-wrap">
        {audio.LAYER_NAMES.map((l) => (
          <label key={l}><input type="checkbox" checked={layers.includes(l)} onChange={() => toggleLayer(l)} /> {l}</label>
        ))}
      </div>

      <label className="block">
        Tension: {tension.toFixed(2)} (set from the city data; drag to override)
        <input type="range" min="0" max="1" step="0.01" value={tension} onChange={manualTension} className="w-full" />
      </label>
    </main>
  );
}
