/**
 * WEATHER LAYER SLOT
 * Contract props:
 *   { cityId, selected, year, month, conditions, ghost, isProjection, reduceMotion }
 *   where conditions = { heatAnomaly, rainPercentile, spi, aod, quake }
 *   and ghost = null | { heatAnomaly, rainPercentile, spi, aod }
 *
 * Uses anomaly & percentile values (never raw values) and respects our C7 Ghost Weather
 * eligibility rules (`ghost` prop is already computed by `buildWeatherLayerProps`).
 */
import React, { useEffect, useRef } from "react";

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
  const heatLevel = Math.max(0, Math.min(1, (heatAnomaly + 2.5) / 5));

  const ghostDiff =
    ghost && conditions?.heatAnomaly != null && ghost.heatAnomaly != null
      ? Math.round((conditions.heatAnomaly - ghost.heatAnomaly) * 10) / 10
      : null;

  // Rain Canvas Animation
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
      canvas.height = canvas.offsetHeight || 220;
    }
    resize();

    function spawnDrop() {
      return {
        x: Math.random() * canvas.width,
        y: -10,
        len: 8 + Math.random() * 14,
        speed: 3.5 + Math.random() * 4.5 + rainLevel * 6,
        opacity: 0.35 + rainLevel * 0.45,
      };
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const targetDrops = Math.floor(rainLevel * 75);
      while (dropsRef.current.length < targetDrops) dropsRef.current.push(spawnDrop());
      if (dropsRef.current.length > targetDrops + 15) dropsRef.current.length = targetDrops;

      dropsRef.current.forEach((drop, i) => {
        ctx.strokeStyle = `rgba(147, 197, 253, ${drop.opacity})`;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x + drop.len * 0.1, drop.y + drop.len);
        ctx.stroke();
        drop.y += drop.speed;
        if (drop.y > canvas.height + 16) {
          dropsRef.current[i] = spawnDrop();
        }
      });
      animRef.current = requestAnimationFrame(animate);
    }

    if (isRaining) {
      animate();
    } else {
      dropsRef.current = [];
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isRaining, rainLevel, reduceMotion]);

  const cityName = CITY_LABELS[cityId] ?? cityId ?? "City";
  const summaryText = describeWeather({ isHot, isCool, isRaining, rainPercentile, droughtLevel, airLevel, quake });

  return (
    <div
      role="img"
      aria-label={`Weather stage for ${cityName}: ${summaryText}`}
      style={{
        position: "relative",
        minHeight: "230px",
        height: "100%",
        borderRadius: "12px",
        overflow: "hidden",
        border: selected
          ? "1px solid var(--ej-border, rgba(56, 189, 248, 0.3))"
          : "1px solid rgba(255,255,255,0.08)",
        background: skyGradient(isHot, isCool, isRaining, airLevel),
        transition: reduceMotion ? "none" : "background 0.9s ease",
      }}
    >
      {/* Rain Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          opacity: isRaining ? 1 : 0,
          transition: "opacity 0.6s ease",
          zIndex: 4,
        }}
      />

      {/* Top Labels */}
      <div
        style={{
          position: "absolute",
          top: "12px",
          left: "14px",
          right: "14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 10,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: "14.5px", color: "#ffffff", textShadow: "0 1px 6px rgba(0,0,0,0.8)" }}>
          {cityName}
        </span>
        <span style={{ fontSize: "12px", color: "#bae6fd", fontFamily: "monospace" }}>
          {isProjection ? `🔭 ${year} (Projection)` : `${MONTHS[month] ?? "Jan"} ${year}`}
        </span>
      </div>

      {/* Sun / Heat Orb */}
      {!isRaining && (
        <div
          style={{
            position: "absolute",
            top: "22%",
            right: "20%",
            width: `${42 + heatLevel * 52}px`,
            height: `${42 + heatLevel * 52}px`,
            borderRadius: "50%",
            background: isHot ? `hsl(${32 - heatLevel * 14}, 100%, 62%)` : isCool ? "#93c5fd" : "#fde68a",
            boxShadow: isHot
              ? `0 0 ${24 + heatLevel * 40}px rgba(251, 146, 60, 0.8)`
              : "0 0 20px rgba(253, 230, 138, 0.5)",
            opacity: 0.88,
            transition: reduceMotion ? "none" : "all 0.8s ease",
            zIndex: 3,
          }}
        />
      )}

      {/* Ghost Weather (1981-1990 baseline comparison) */}
      {ghost && (
        <div
          data-testid="ghost-weather"
          style={{
            position: "absolute",
            top: "22%",
            left: "16px",
            zIndex: 8,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 10px",
            borderRadius: "10px",
            background: "rgba(13, 27, 42, 0.72)",
            border: "1.5px dashed rgba(186, 230, 253, 0.5)",
          }}
        >
          <div
            style={{
              width: "22px",
              height: "22px",
              borderRadius: "50%",
              background: "rgba(254, 240, 138, 0.45)",
              border: "1px dashed rgba(255,255,255,0.6)",
            }}
          />
          <div style={{ fontSize: "10.5px", lineHeight: 1.3 }}>
            <div style={{ color: "#bae6fd", opacity: 0.85 }}>1980s normal ghost</div>
            {ghostDiff != null && (
              <div style={{ color: ghostDiff >= 0 ? "#fdba74" : "#93c5fd", fontWeight: 700 }}>
                {ghostDiff >= 0 ? `+${ghostDiff}` : ghostDiff}°C vs 1980s
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rain Clouds */}
      {isRaining && (
        <>
          {[
            { left: "12%", top: "16%", w: 72 + rainLevel * 30 },
            { left: "44%", top: "12%", w: 64 + rainLevel * 28 },
            { left: "68%", top: "20%", w: 56 + rainLevel * 24 },
          ].map((c, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: c.left,
                top: c.top,
                width: `${c.w}px`,
                height: `${c.w * 0.55}px`,
                borderRadius: "9999px",
                background: rainLevel > 0.5 ? "#334155" : "#64748b",
                opacity: 0.75,
                filter: "blur(5px)",
                zIndex: 3,
              }}
            />
          ))}
        </>
      )}

      {/* Drought Ground Cracks Overlay */}
      {droughtLevel > 0.2 && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: "36%",
            background: `linear-gradient(to top, rgba(120, 75, 18, ${droughtLevel * 0.65}), transparent)`,
            zIndex: 3,
          }}
        />
      )}

      {/* Air Haze Overlay */}
      {airLevel > 0.15 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `rgba(115, 95, 65, ${airLevel * 0.45})`,
            pointerEvents: "none",
            zIndex: 5,
          }}
        />
      )}

      {/* Earthquake Ripple (USGS labeled) */}
      {quake && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            zIndex: 7,
          }}
        >
          {[0, 1, 2].slice(0, reduceMotion ? 1 : 3).map((i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                width: `${48 + i * 34}px`,
                height: `${48 + i * 34}px`,
                borderRadius: "50%",
                border: "2px solid rgba(251, 191, 36, 0.75)",
                boxShadow: "0 0 12px rgba(251, 191, 36, 0.35)",
              }}
            />
          ))}
        </div>
      )}

      {/* Bottom Condition Summary */}
      <div
        style={{
          position: "absolute",
          bottom: "12px",
          left: "14px",
          right: "14px",
          zIndex: 10,
          background: "rgba(8, 20, 36, 0.65)",
          backdropFilter: "blur(4px)",
          padding: "8px 10px",
          borderRadius: "8px",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ fontSize: "12px", fontWeight: 600, color: "#ffffff" }}>{summaryText}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "4px", fontSize: "11px" }}>
          {conditions?.heatAnomaly != null && (
            <span style={{ color: isHot ? "#fca5a5" : "#93c5fd" }}>
              🌡 {conditions.heatAnomaly >= 0 ? `+${conditions.heatAnomaly}` : conditions.heatAnomaly}°C vs normal
            </span>
          )}
          {conditions?.rainPercentile != null && (
            <span style={{ color: "#7dd3fc" }}>🌧 {conditions.rainPercentile}th pct rain</span>
          )}
          {quake && (
            <span style={{ color: "#fde047", fontWeight: 600 }}>
              🌋 M{quake.magnitude} ({quake.source || "USGS, non-NASA"})
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function skyGradient(isHot, isCool, isRaining, airLevel) {
  if (isRaining) return "linear-gradient(to bottom, #1e293b, #334155)";
  if (airLevel > 0.45) return "linear-gradient(to bottom, #292524, #44403c)";
  if (isHot) return "linear-gradient(to bottom, #7c2d12, #1c1917)";
  if (isCool) return "linear-gradient(to bottom, #1e3a5f, #0f172a)";
  return "linear-gradient(to bottom, #0f2744, #0d1b2a)";
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
