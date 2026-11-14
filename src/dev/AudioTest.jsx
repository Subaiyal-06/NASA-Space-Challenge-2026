// Member 1's private test page for the audio engine. Open: http://localhost:5173/audio-test.html
import { useEffect, useState } from "react";
import * as audio from "../audio/index.js";

export default function AudioTest() {
  const [playing, setPlaying] = useState(false);
  const [bar, setBar] = useState(0);
  const [tension, setTension] = useState(0);

  useEffect(() => audio.onNewBar(() => setBar(audio.currentBar())), []);

  const toggle = async () => {
    if (playing) { audio.stop(); setPlaying(false); }
    else { await audio.start(); setPlaying(true); }
  };
  const changeTension = (e) => {
    const v = parseFloat(e.target.value);
    setTension(v);
    audio.setTension(v);
  };

  return (
    <main className="p-8 max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Audio test (Member 1)</h1>
      <button onClick={toggle} className="px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-lg">
        {playing ? "Stop" : "Start"}
      </button>
      <p>Bar (= month) counter: <b>{bar}</b> &middot; one bar = {audio.BAR_LENGTH_SECONDS} s</p>
      <label className="block">
        Tension: {tension.toFixed(2)}
        <input type="range" min="0" max="1" step="0.01" value={tension} onChange={changeTension} className="w-full" />
      </label>
      <p className="opacity-60 text-sm">
        0-0.2 drone + soft pad &middot; 0.2 arpeggio &middot; 0.4 fuller pad, arp higher &middot; 0.6 strings, faster, tense chords &middot; 0.8 pulse + big reverb
      </p>
    </main>
  );
}
