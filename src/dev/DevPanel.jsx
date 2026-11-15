// DEV PANEL (open with  #/dev  at the end of the address, for example http://localhost:5173/#/dev).
// Plain and unstyled on purpose. For developers: control the clock, fire events, watch what the audio
// engine receives, see warnings, and run contract tests on plugged-in modules.
import React, { useEffect, useState } from "react";
import { useClock, emitClockEvent } from "../state/clock.js";
import { initAppBridge, getAudioEngine } from "../app/flow.js";
import { getCityList, loadCity, getDataNotes } from "../data/api.js";
import { integrationStatus } from "../integrations/resolve.js";
import { useAudioLog } from "../slots/NullAudio.js";
import { useWarnings } from "../slots/warnings.js";
import { validateClock } from "../contracts/index.js";
import { runAllSlotContracts, runAudioContract } from "./contractTests.jsx";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const box = { border: "1px solid #888", padding: 8, margin: "8px 0" };
const short = (v) => { const s = JSON.stringify(v); return s.length > 140 ? s.slice(0, 140) + "..." : s; };

function Section({ title, children }) {
  return <section style={box}><h3 style={{ margin: "0 0 6px" }}>{title}</h3>{children}</section>;
}

export default function DevPanel() {
  const clock = useClock();
  const calls = useAudioLog((s) => s.calls);
  const warnings = useWarnings((s) => s.warnings);
  const [results, setResults] = useState(null);
  const [loaded, setLoaded] = useState([]);
  const cities = getCityList();
  const clockProblems = validateClock(clock);

  useEffect(() => {
    const detach = initAppBridge(); // so the audio log follows the clock, like in the real app
    clock.selectCity(clock.cityA ?? "karachi", "A").then(() => setLoaded((l) => [...new Set([...l, clock.cityA ?? "karachi"])]));
    return detach;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickCity = async (id, slot) => {
    await clock.selectCity(id || null, slot);
    if (id) setLoaded((l) => [...new Set([...l, id])]);
  };
  const runTests = async () => setResults({ slots: runAllSlotContracts(), audio: await runAudioContract() });
  const fire = (type) => {
    const base = { year: clock.year, month: clock.month };
    if (type === "quake") emitClockEvent("quake", { ...base, magnitude: 7.6, depth: 26, lat: 34.5, lon: 73.6, source: "USGS (non-NASA)" });
    if (type === "story") emitClockEvent("story", { ...base, id: "dev-story", title: "Dev story", text: "A test story fired from the dev panel.", source: "dev panel" });
    if (type === "badge") emitClockEvent("badge", { ...base, layer: "temperature", text: "Dev badge (in our data)" });
  };
  const status = integrationStatus();

  return (
    <div style={{ fontFamily: "monospace", fontSize: 13, padding: 12, maxWidth: 980 }}>
      <h2 style={{ margin: 0 }}>Dev panel</h2>
      <p style={{ margin: "4px 0" }}><a href="#/">&larr; back to the app</a></p>

      <Section title="Integration status (real or placeholder)">
        <table><tbody>
          {Object.entries(status).map(([k, v]) => (<tr key={k}><td style={{ paddingRight: 16 }}>{k}</td><td>{v}</td></tr>))}
        </tbody></table>
      </Section>

      <Section title="Contract tests">
        <button type="button" onClick={runTests}>Run contract tests</button>
        {results && (
          <div>
            <p>Audio ({results.audio.status}): <b>{results.audio.ok ? "PASS" : "FAIL"}</b> {results.audio.problems.join("; ")}</p>
            <ul style={{ margin: 0 }}>
              {results.slots.map((r) => (
                <li key={r.slot}>{r.slot} ({r.status}): <b>{r.ok ? "PASS" : "FAIL"}</b> {r.problems.join("; ")}</li>
              ))}
            </ul>
          </div>
        )}
        <p style={{ margin: "6px 0 0" }}>Clock contract: <b>{clockProblems.length ? "FAIL" : "PASS"}</b> {clockProblems.join("; ")}</p>
      </Section>

      <Section title="Clock controls">
        <div>
          City A: <select value={clock.cityA ?? ""} onChange={(e) => pickCity(e.target.value, "A")}>{cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>{" "}
          City B: <select value={clock.cityB ?? ""} onChange={(e) => pickCity(e.target.value, "B")}><option value="">(none)</option>{cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>{" "}
          Mode: <select value={clock.mode} onChange={(e) => clock.setMode(e.target.value)}><option>month</option><option>year</option><option>story</option></select>{" "}
          Speed: <select value={clock.speed} onChange={(e) => clock.setSpeed(+e.target.value)}><option>1</option><option>2</option><option>4</option></select>
        </div>
        <div style={{ marginTop: 6 }}>
          <button type="button" onClick={clock.toggle}>{clock.playing ? "Pause" : "Play"}</button>{" "}
          <button type="button" onClick={() => clock.stepMonth(-1)}>&minus; month</button>{" "}
          <button type="button" onClick={() => clock.stepMonth(1)}>+ month</button>{" "}
          <button type="button" onClick={() => clock.leap(5)}>+5 years</button>{" "}
          <button type="button" onClick={() => clock.leap(10)}>+10 years</button>{" "}
          Year <input type="number" value={clock.year} style={{ width: 70 }} onChange={(e) => clock.setYear(+e.target.value)} />{" "}
          <select value={clock.month} onChange={(e) => clock.setMonth(+e.target.value)}>{MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}</select>
        </div>
        <div style={{ marginTop: 6 }}>
          <label><input type="checkbox" checked={clock.futureEnabled} onChange={(e) => clock.setFutureEnabled(e.target.checked)} /> future years</label>{" "}
          Scenario: <select value={clock.scenario ?? ""} onChange={(e) => clock.setScenario(e.target.value)}><option value="ssp245">ssp245</option><option value="ssp585">ssp585</option></select>
        </div>
        <div style={{ marginTop: 6 }}>
          Tension override: {Number(clock.tension).toFixed(2)}{" "}
          <input type="range" min="0" max="1" step="0.01" value={clock.tension}
            onChange={(e) => { const v = +e.target.value; useClock.setState({ tension: v }); getAudioEngine().setTension?.(v); }} />
          <em> (the next month tick replaces it with the real value)</em>
        </div>
        <pre style={{ margin: "6px 0 0" }}>{JSON.stringify({ year: clock.year, month: clock.month, mode: clock.mode, playing: clock.playing, speed: clock.speed, pacing: clock.pacing, tension: clock.tension, interest: clock.interest, cityA: clock.cityA, cityB: clock.cityB, scenario: clock.scenario, futureEnabled: clock.futureEnabled, layers: clock.layers }, null, 1)}</pre>
      </Section>

      <Section title="Fire events">
        <button type="button" onClick={() => fire("quake")}>Quake</button>{" "}
        <button type="button" onClick={() => fire("story")}>Story</button>{" "}
        <button type="button" onClick={() => fire("badge")}>Badge</button>
      </Section>

      <Section title={`Audio call log (${calls.length}) - what the audio engine received`}>
        <button type="button" onClick={() => useAudioLog.getState().clear()}>Clear</button>
        <div style={{ maxHeight: 200, overflow: "auto" }}>
          {calls.slice(-40).reverse().map((c, i) => (<div key={i}>{new Date(c.time).toLocaleTimeString()} <b>{c.method}</b> {short(c.args)}</div>))}
        </div>
        {status.audio === "real" && <p><em>A real audio module is plugged in, so calls go to it and this log stays empty.</em></p>}
      </Section>

      <Section title={`Warnings (${warnings.length})`}>
        <button type="button" onClick={() => useWarnings.getState().clear()}>Clear</button>
        <div style={{ maxHeight: 160, overflow: "auto" }}>
          {warnings.slice().reverse().map((w, i) => (<div key={i}>[{w.source}] {w.message}</div>))}
        </div>
      </Section>

      <Section title="Data notes (loaded cities)">
        {loaded.map((id) => (<div key={id}><b>{id}</b>: {getDataNotes(id).length ? getDataNotes(id).join(" | ") : "no notes"}</div>))}
      </Section>
    </div>
  );
}
