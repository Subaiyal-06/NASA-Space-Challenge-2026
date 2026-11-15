/**
 * WEATHER LAYER SLOT
 * Pastel Mint & White 3D Diorama edition with Framer Motion + Lucide icons.
 * Contract props:
 *   { cityId, selected, year, month, conditions, ghost, isProjection, reduceMotion }
 */
import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Activity, CloudRain, Sparkles, Sun, Thermometer, Wind } from "lucide-react";
import { WeatherDiorama3D } from "./Artifacts3D.jsx";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const CITY_LABELS = {
  karachi: "Karachi",
  lahore: "Lahore",
  islamabad: "Islamabad",
  peshawar: "Peshawar",
  quetta: "Quetta",
};

export default function WeatherLayer({
  cityId = "karachi",
  selected = true,
  year = 1981,
  month = 0,
  isProjection = false,
  conditions = {},
  ghost = null,
  reduceMotion = false,
}) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const dropsRef = useRef([]);

  const heatAnomaly = conditions?.heatAnomaly ?? 0;
  const rainPercentile = conditions?.rainPercentile ?? 50;
  const spi = conditions?.spi ?? 0;
  const aod = conditions?.aod ?? 0;
  const quake = conditions?.quake ?? null;

  const isHot = heatAnomaly >= 0.4;
  const isCool = heatAnomaly <= -0.35;
  const isRaining = rainPercentile >= 60;
  const rainLevel = isRaining ? Math.max(0.15, Math.min(1, (rainPercentile - 50) / 50)) : 0;
  const droughtLevel = spi < -0.5 ? Math.min(1, Math.abs(spi) / 2.2) : 0;
  const airLevel = aod > 0.3 ? Math.min(1, (aod - 0.25) / 0.75) : 0;

  const ghostDiff =
    ghost && conditions?.heatAnomaly != null && ghost.heatAnomaly != null
      ? Math.round((conditions.heatAnomaly - ghost.heatAnomaly) * 10) / 10
      : null;

  // Rain Canvas Animation (pastel teal raindrops, guarded against jsdom)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || reduceMotion) return;
    if (typeof navigator !== "undefined" && /jsdom/i.test(navigator.userAgent)) return;
    let ctx = null;
    try {
      ctx = canvas.getContext("2d");
    } catch {
      return;
    }
    if (!ctx) return;

    function resize() {
      canvas.width = canvas.offsetWidth || 280;
      canvas.height = canvas.offsetHeight || 240;
    }
    resize();

    function spawnDrop() {
      return {
        x: Math.random() * canvas.width,
        y: -10,
        len: 8 + Math.random() * 14,
        speed: 3.4 + Math.random() * 4 + rainLevel * 5.5,
        opacity: 0.28 + rainLevel * 0.4,
      };
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const targetDrops = Math.floor(rainLevel * 64);
      while (dropsRef.current.length < targetDrops) dropsRef.current.push(spawnDrop());
      if (dropsRef.current.length > targetDrops + 12) dropsRef.current.length = targetDrops;

      dropsRef.current.forEach((drop, i) => {
        ctx.strokeStyle = `rgba(14, 116, 144, ${drop.opacity})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x + drop.len * 0.1, drop.y + drop.len);
        ctx.stroke();
        drop.y += drop.speed;
        if (drop.y > canvas.height + 16) {
          dropsRef.current[i] = spawnDrop();
        }
      });

      if (isRaining) {
        animRef.current = requestAnimationFrame(animate);
      }
    }

    if (isRaining) {
      animate();
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isRaining, rainLevel, reduceMotion]);

  const cityName = CITY_LABELS[cityId] ?? cityId ?? "City";
  const summaryText = describeWeather({ isHot, isCool, isRaining, rainPercentile, droughtLevel, airLevel, quake });

  return (
    <motion.div
      data-testid={`weather-layer-${cityId}`}
      aria-label={`Weather scene for ${cityName}`}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.35 }}
      className="ej-card-3d"
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: "268px",
        borderRadius: "18px",
        overflow: "hidden",
        background: skyGradient(isHot, isCool, isRaining, airLevel),
        border: selected ? "1.5px solid #34D399" : "1px solid var(--ej-border, #BCEAD5)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {/* Raindrop Canvas Overlay */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          opacity: isRaining ? 1 : 0,
          transition: reduceMotion ? "none" : "opacity 0.5s ease",
          zIndex: 4,
        }}
      />

      {/* Top Labels */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 14px 4px 14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: isHot ? "#EA580C" : isRaining ? "#0284C7" : "#10B981",
              boxShadow: "0 0 0 3px rgba(255,255,255,0.75)",
            }}
          />
          <span style={{ fontWeight: 700, fontSize: "15px", color: "#064E3B" }}>{cityName}</span>
        </div>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            fontSize: "11.5px",
            fontWeight: 700,
            color: isProjection ? "#9A3412" : "#047857",
            background: isProjection ? "#FFEDD5" : "#FFFFFF",
            border: `1px solid ${isProjection ? "#FDBA74" : "#BCEAD5"}`,
            padding: "3px 9px",
            borderRadius: "9999px",
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          }}
        >
          {isProjection && <Sparkles size={12} />}
          {isProjection ? `${year} (Projection)` : `${MONTHS[month] ?? "Jan"} ${year}`}
        </span>
      </div>

      {/* Center 3D Weather Diorama */}
      <div
        style={{
          position: "relative",
          zIndex: 5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2px 12px",
        }}
      >
        <WeatherDiorama3D
          isHot={isHot}
          isCool={isCool}
          isRaining={isRaining}
          rainLevel={rainLevel}
          droughtLevel={droughtLevel}
          airLevel={airLevel}
          quake={quake}
          ghost={ghost}
          reduceMotion={reduceMotion}
        />

        {/* Ghost Weather Badge (1981-1990 baseline comparison) */}
        {ghost && (
          <motion.div
            data-testid="ghost-weather"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              position: "absolute",
              top: "4px",
              left: "12px",
              zIndex: 8,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 10px",
              borderRadius: "12px",
              background: "rgba(255, 255, 255, 0.9)",
              border: "1.5px dashed #10B981",
              boxShadow: "0 4px 12px rgba(6, 78, 59, 0.08)",
            }}
          >
            <Sun size={15} color="#059669" />
            <div style={{ fontSize: "10.5px", lineHeight: 1.3 }}>
              <div style={{ color: "#065F46", fontWeight: 600 }}>1980s normal ghost</div>
              {ghostDiff != null && (
                <div style={{ color: ghostDiff >= 0 ? "#C2410C" : "#0369A1", fontWeight: 700 }}>
                  {ghostDiff >= 0 ? `+${ghostDiff}` : ghostDiff}°C vs 1980s
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Bottom Condition Summary */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          margin: "0 12px 12px 12px",
          background: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(6px)",
          padding: "9px 12px",
          borderRadius: "12px",
          border: "1px solid #D1FAE5",
        }}
      >
        <div style={{ fontSize: "12px", fontWeight: 700, color: "#064E3B" }}>{summaryText}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "6px", fontSize: "11px" }}>
          {conditions?.heatAnomaly != null && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "2px 7px",
                borderRadius: "9999px",
                background: isHot ? "#FFEDD5" : "#E0F2FE",
                color: isHot ? "#9A3412" : "#075985",
                fontWeight: 600,
              }}
            >
              <Thermometer size={12} />
              {conditions.heatAnomaly >= 0 ? `+${conditions.heatAnomaly}` : conditions.heatAnomaly}°C vs normal
            </span>
          )}
          {conditions?.rainPercentile != null && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "2px 7px",
                borderRadius: "9999px",
                background: "#ECFEFF",
                color: "#0E7490",
                fontWeight: 600,
              }}
            >
              <CloudRain size={12} />
              {conditions.rainPercentile}th pct rain
            </span>
          )}
          {airLevel > 0.25 && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "2px 7px",
                borderRadius: "9999px",
                background: "#F1F5F9",
                color: "#334155",
                fontWeight: 600,
              }}
            >
              <Wind size={12} />
              Elevated aerosols
            </span>
          )}
          {quake && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "2px 7px",
                borderRadius: "9999px",
                background: "#FEF3C7",
                color: "#92400E",
                fontWeight: 700,
              }}
            >
              <Activity size={12} />
              M{quake.magnitude} ({quake.source || "USGS, non-NASA"})
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function skyGradient(isHot, isCool, isRaining, airLevel) {
  if (isRaining) return "linear-gradient(165deg, #E0F2FE 0%, #ECFDF5 65%, #FFFFFF 100%)";
  if (airLevel > 0.45) return "linear-gradient(165deg, #F1F5F9 0%, #ECFDF5 70%, #FFFFFF 100%)";
  if (isHot) return "linear-gradient(165deg, #FFF7ED 0%, #ECFDF5 65%, #FFFFFF 100%)";
  if (isCool) return "linear-gradient(165deg, #ECFEFF 0%, #F0FDF4 65%, #FFFFFF 100%)";
  return "linear-gradient(165deg, #D1FAE5 0%, #ECFDF5 58%, #FFFFFF 100%)";
}

function describeWeather({ isHot, isCool, isRaining, rainPercentile, droughtLevel, airLevel, quake }) {
  const parts = [];
  if (quake) parts.push(`Earthquake M${quake.magnitude} (USGS)`);
  if (isRaining) parts.push(rainPercentile >= 85 ? "Heavy monsoon rain" : "Above-normal rainfall");
  if (isHot) parts.push("Warmer than normal");
  if (isCool) parts.push("Cooler than normal");
  if (droughtLevel > 0.35) parts.push("Dry / drought stress");
  if (airLevel > 0.35) parts.push("Hazy / elevated aerosols");
  return parts.length ? parts.join(" · ") : "Near-normal seasonal conditions";
}
