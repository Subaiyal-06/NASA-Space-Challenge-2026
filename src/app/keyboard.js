// KEYBOARD SHORTCUTS (Step C9: Space, Left/Right step, Up/Down speed)
import { useClock } from "../state/clock.js";

const SPEEDS = [1, 2, 4];

/**
 * Handles a keyboard event for playback and navigation:
 * - Space: play / pause
 * - ArrowRight: step forward 1 month (Shift+ArrowRight: leap +5 years)
 * - ArrowLeft: step backward 1 month (Shift+ArrowLeft: leap -5 years)
 * - ArrowUp: increase playback speed (1 -> 2 -> 4)
 * - ArrowDown: decrease playback speed (4 -> 2 -> 1)
 */
export function handleAppKeyDown(e) {
  if (!e) return false;
  const tag = e.target?.tagName?.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select" || e.target?.isContentEditable) {
    return false;
  }

  const clock = useClock.getState();

  switch (e.code || e.key) {
    case "Space":
    case " ":
      e.preventDefault?.();
      clock.toggle();
      return true;

    case "ArrowRight":
      e.preventDefault?.();
      if (e.shiftKey) clock.leap(5);
      else clock.stepMonth(1);
      return true;

    case "ArrowLeft":
      e.preventDefault?.();
      if (e.shiftKey) clock.leap(-5);
      else clock.stepMonth(-1);
      return true;

    case "ArrowUp": {
      e.preventDefault?.();
      const idx = SPEEDS.indexOf(clock.speed);
      if (idx < SPEEDS.length - 1) clock.setSpeed(SPEEDS[idx + 1]);
      return true;
    }

    case "ArrowDown": {
      e.preventDefault?.();
      const idx = SPEEDS.indexOf(clock.speed);
      if (idx > 0) clock.setSpeed(SPEEDS[idx - 1]);
      return true;
    }

    default:
      return false;
  }
}

export function attachKeyboardShortcuts(target = typeof window !== "undefined" ? window : null) {
  if (!target?.addEventListener) return () => {};
  target.addEventListener("keydown", handleAppKeyDown);
  return () => target.removeEventListener("keydown", handleAppKeyDown);
}
