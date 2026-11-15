// A short toast when the playhead reaches a record ("in our data"). Shows for about 3 seconds, then fades.
import React, { useEffect, useState } from "react";
import { useClock } from "../../state/clock.js";
import { Star } from "./icons.jsx";

export const TOAST_MS = 3200;

export default function BadgeToast() {
  const [badge, setBadge] = useState(null);
  useEffect(() => {
    let timer = 0;
    const off = useClock.on("badge", (b) => {
      setBadge(b);
      clearTimeout(timer);
      timer = setTimeout(() => setBadge(null), TOAST_MS);
    });
    return () => { clearTimeout(timer); if (typeof off === "function") off(); };
  }, []);
  if (!badge) return null;
  return (
    <div className="toast" role="status">
      <Star />
      <span>{badge.text ?? badge.title}</span>
    </div>
  );
}
