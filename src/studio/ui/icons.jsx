// Small inline icons (no icon library needed). All use currentColor so CSS controls the colour.
import React from "react";

const base = { viewBox: "0 0 24 24", "aria-hidden": true, focusable: false };
const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };

export const Play = (p) => <svg {...base} {...p}><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" fill="currentColor" /></svg>;
export const Pause = (p) => <svg {...base} {...p}><rect x="6" y="5" width="4.2" height="14" rx="1.3" fill="currentColor" /><rect x="13.8" y="5" width="4.2" height="14" rx="1.3" fill="currentColor" /></svg>;
export const StepBack = (p) => <svg {...base} {...p}><rect x="5" y="5" width="2.6" height="14" rx="1.2" fill="currentColor" /><path d="M19 6v12a.8.8 0 0 1-1.25.66l-8.4-6a.8.8 0 0 1 0-1.32l8.4-6A.8.8 0 0 1 19 6Z" fill="currentColor" /></svg>;
export const StepNext = (p) => <svg {...base} {...p}><rect x="16.4" y="5" width="2.6" height="14" rx="1.2" fill="currentColor" /><path d="M5 6v12a.8.8 0 0 0 1.25.66l8.4-6a.8.8 0 0 0 0-1.32l-8.4-6A.8.8 0 0 0 5 6Z" fill="currentColor" /></svg>;
export const LeapBack = (p) => <svg {...base} {...p}><path d="M11 6l-6 6 6 6M19 6l-6 6 6 6" {...stroke} /></svg>;
export const LeapNext = (p) => <svg {...base} {...p}><path d="M13 6l6 6-6 6M5 6l6 6-6 6" {...stroke} /></svg>;
export const Volume = (p) => <svg {...base} {...p}><path d="M4 9.5v5h3.4l4.6 3.8V5.7L7.4 9.5H4Z" fill="currentColor" /><path d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.6a7.8 7.8 0 0 1 0 10.8" {...stroke} /></svg>;
export const VolumeOff = (p) => <svg {...base} {...p}><path d="M4 9.5v5h3.4l4.6 3.8V5.7L7.4 9.5H4Z" fill="currentColor" /><path d="M16 9.5l5 5M21 9.5l-5 5" {...stroke} /></svg>;
export const Calendar = (p) => <svg {...base} {...p}><rect x="4" y="5.5" width="16" height="14.5" rx="3" {...stroke} /><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" {...stroke} /></svg>;
export const Close = (p) => <svg {...base} {...p}><path d="M6 6l12 12M18 6L6 18" {...stroke} /></svg>;
export const Star = (p) => <svg {...base} {...p}><path d="M12 3.2l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.7 6.6 19.7l1.2-6L3.3 9.5l6.1-.7L12 3.2Z" fill="currentColor" /></svg>;

// Categories
export const Sun = (p) => <svg {...base} {...p}><circle cx="12" cy="12" r="4.2" fill="currentColor" /><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7" {...stroke} /></svg>;
export const Rain = (p) => <svg {...base} {...p}><path d="M7.5 15a4.2 4.2 0 0 1-.6-8.4A5.4 5.4 0 0 1 17.4 7.8 3.6 3.6 0 0 1 17 15H7.5Z" fill="currentColor" /><path d="M8.5 18l-1 2.4M12.5 18l-1 2.4M16.5 18l-1 2.4" {...stroke} /></svg>;
export const Dry = (p) => <svg {...base} {...p}><path d="M3 18.5h18M3 18.5l4-3.5 3 2 4-4.5 3 2.5 4-3" {...stroke} /><path d="M7 11.5l1.8 2M12 8.5l-1 2.2M16.5 11l2-1.4" {...stroke} /></svg>;
export const Quake = (p) => <svg {...base} {...p}><path d="M2.5 12h4l2-5.5 3.5 11 2.5-8 1.7 2.5h5.3" {...stroke} /></svg>;
export const Leaf = (p) => <svg {...base} {...p}><path d="M5 19c0-8 4-13.5 14-14.5-.5 10-6 14.5-14 14.5Z" fill="currentColor" /><path d="M5 19c3-4.5 6-7 9.5-9" fill="none" stroke="rgba(12,22,52,.55)" strokeWidth="1.6" strokeLinecap="round" /></svg>;
export const Haze = (p) => <svg {...base} {...p}><path d="M4 8h16M6 12.5h13M4 17h16" {...stroke} /></svg>;
export const Lights = (p) => <svg {...base} {...p}><path d="M12 3.5a5.7 5.7 0 0 0-3.4 10.3c.6.5.9 1.2.9 2V17h5v-1.2c0-.8.3-1.5.9-2A5.7 5.7 0 0 0 12 3.5Z" fill="currentColor" /><path d="M9.8 20.2h4.4" {...stroke} /></svg>;

export const Snow = (p) => <svg {...base} {...p}><path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9M9.5 4.8L12 7.2l2.5-2.4M9.5 19.2L12 16.8l2.5 2.4" {...stroke} /></svg>;

export const CATEGORY_ICONS = { sun: Sun, rain: Rain, dry: Dry, quake: Quake, leaf: Leaf, haze: Haze, lights: Lights };
