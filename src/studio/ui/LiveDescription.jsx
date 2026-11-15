// A text description of the month for screen readers, kept in a live region that is hidden from the eye.
// While the music plays a month goes by every 2.5 seconds, so only notable months (and each January) are announced;
// when you pause, jump or step, the month you land on is announced after a short moment.
import React, { useEffect, useState } from "react";
import { worthAnnouncingWhilePlaying } from "./describe.js";

export default function LiveDescription({ text, playing, wx, month, enabled }) {
  const [said, setSaid] = useState("");
  useEffect(() => {
    if (!enabled || !text) { setSaid(""); return undefined; }
    if (playing && !worthAnnouncingWhilePlaying(wx, month)) return undefined;
    const t = setTimeout(() => setSaid(text), playing ? 300 : 700);
    return () => clearTimeout(t);
  }, [text, playing, enabled]); // eslint-disable-line react-hooks/exhaustive-deps
  return <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{said}</div>;
}
