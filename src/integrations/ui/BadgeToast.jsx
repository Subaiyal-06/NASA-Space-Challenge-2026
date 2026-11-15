/**
 * BADGE TOAST SLOT
 * Pastel Mint & Amber pill toast with Framer Motion + Lucide icons.
 * Always states "in our data" per rule.
 * Contract props: { badge, reduceMotion }
 */
import React from "react";
import { motion } from "framer-motion";
import { Activity, Award, CloudRain, Droplets, Thermometer, Wind } from "lucide-react";

const LAYER_ICON = {
  temperature: Thermometer,
  rainfall: CloudRain,
  drought: Droplets,
  air: Wind,
  earthquakes: Activity,
  quakes: Activity,
};

export default function BadgeToast({ badge = null, reduceMotion = false }) {
  if (!badge) return null;

  const LayerIcon = LAYER_ICON[badge.layer] ?? Award;
  const text = badge.text?.includes("in our data") ? badge.text : `${badge.text} (in our data)`;

  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={reduceMotion ? false : { opacity: 0, scale: 0.92, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.25 }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "7px 14px",
        borderRadius: "9999px",
        background: "linear-gradient(135deg, #FEF3C7, #ECFDF5)",
        border: "1px solid #FCD34D",
        color: "#064E3B",
        fontSize: "12.5px",
        fontWeight: 700,
        boxShadow: "0 6px 16px rgba(6, 78, 59, 0.1)",
        alignSelf: "flex-start",
      }}
    >
      <Award size={15} color="#D97706" />
      <LayerIcon size={14} color="#059669" />
      <span>{text}</span>
    </motion.div>
  );
}
