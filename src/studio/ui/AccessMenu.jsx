// The Accessibility menu: voice narration, a text description for screen readers, high contrast,
// "describe this month now", and the keyboard shortcuts. Calm-motion lives in its own switch next to this button.
import React, { useEffect, useRef, useState } from "react";
import { useSettings } from "../../settings/index.js";
import { useA11y } from "../state.js";

/** Speak a text with the computer's own voice (does nothing where speech is not available). */
export function speak(text) {
  try {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") return false;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text); u.rate = 1;
    window.speechSynthesis.speak(u);
    return true;
  } catch { return false; }
}

export const SHORTCUTS = [
  ["Space", "Play or pause"],
  ["Left / Right arrow", "Back or forward one month"],
  ["Shift + Left / Right", "Back or forward five years"],
  ["Up / Down arrow", "Faster or slower"],
];

function Switch({ checked, onChange, children, hint }) {
  return (
    <button type="button" role="switch" aria-checked={checked} className="sw" onClick={() => onChange(!checked)}>
      <span className="sw__text"><b>{children}</b>{hint && <small>{hint}</small>}</span>
      <span className="motion-toggle__knob" aria-hidden="true" />
    </button>
  );
}

export default function AccessMenu({ description, onDescribe }) {
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const voice = useSettings((s) => s.voiceAnnouncer);
  const setVoice = useSettings((s) => s.setVoiceAnnouncer);
  const describe = useA11y((s) => s.describe);
  const setDescribe = useA11y((s) => s.setDescribe);
  const hc = useA11y((s) => s.highContrast);
  const setHc = useA11y((s) => s.setHighContrast);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    const onDown = (e) => { if (root.current && !root.current.contains(e.target)) setOpen(false); };
    window.addEventListener("keydown", onKey); window.addEventListener("pointerdown", onDown);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("pointerdown", onDown); };
  }, [open]);

  return (
    <div className="a11y" ref={root}>
      <button type="button" className="a11y__btn" aria-expanded={open} aria-controls="a11y-menu" onClick={() => setOpen(!open)}>Accessibility</button>
      {open && (
        <div id="a11y-menu" className="a11y__menu" role="group" aria-label="Accessibility options">
          <Switch checked={voice} onChange={setVoice} hint="A short spoken update for each month">Speak each month aloud</Switch>
          <Switch checked={describe} onChange={setDescribe} hint="For screen readers; plays only the notable months while music runs">Text description of the month</Switch>
          <Switch checked={hc} onChange={setHc} hint="Stronger colours and no blur">High contrast</Switch>
          <button type="button" className="a11y__now" onClick={() => { if (!speak(description)) onDescribe?.(); }} disabled={!description}>Describe this month now</button>
          <dl className="a11y__keys" aria-label="Keyboard shortcuts">
            {SHORTCUTS.map(([k, v]) => (<div key={k}><dt>{k}</dt><dd>{v}</dd></div>))}
          </dl>
        </div>
      )}
    </div>
  );
}
