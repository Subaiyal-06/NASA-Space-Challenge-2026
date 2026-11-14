// CONNECTORS FOR ALL 11 UI SLOTS (Step C8)
// Each connector reads from the clock, data API, and settings, builds pure props,
// and wraps the slot in <SlotHost name="..." {...props} />.
import React from "react";
import SlotHost from "../slots/SlotHost.jsx";
import { useClock } from "../state/clock.js";
import { useSettings } from "../settings/index.js";
import { useAppFlow } from "./flow.js";
import { getCityList, getRange, getSnapshot, getSeries, getMarkers } from "../data/api.js";
import { getLoadedCity } from "../data/loader.js";
import { getLayerGating } from "../state/pacing.js";
import {
  buildWeatherLayerProps,
  buildAmbientGlowProps,
  buildTensionMeterProps,
  buildLegendProps,
} from "./propBuilders.js";
import { buildCompareProps } from "./compare.js";

export function GlobeIntroConnector({ override }) {
  const reduceMotion = useSettings((s) => s.reduceMotion);
  const startExperience = useAppFlow((s) => s.startExperience);
  const selectCity = useClock((s) => s.selectCity);
  const cities = getCityList();

  return (
    <SlotHost
      name="GlobeIntro"
      override={override}
      cities={cities}
      onStart={() => startExperience(cities[0]?.id ?? "karachi")}
      onSelectCity={(id) => {
        selectCity(id, "A");
        startExperience(id);
      }}
      reduceMotion={reduceMotion}
    />
  );
}

export function TimelineConnector({ override }) {
  const {
    year,
    month,
    mode,
    playing,
    speed,
    pacing,
    cityA,
    scenario,
    futureEnabled,
    toggle,
    stepMonth,
    seek,
    leap,
    setMode,
    setSpeed,
  } = useClock();
  const reduceMotion = useSettings((s) => s.reduceMotion);

  const cityObj = getLoadedCity(cityA);
  const activeScenario = futureEnabled ? scenario : undefined;
  const range = cityObj ? getRange(cityObj, activeScenario) : { startYear: 1981, endYear: 2024 };
  const markers = cityObj ? getMarkers(cityObj) : { stories: [], badges: [] };

  return (
    <SlotHost
      name="Timeline"
      override={override}
      year={year}
      month={month}
      startYear={range.startYear}
      endYear={range.endYear}
      mode={mode}
      playing={playing}
      speed={speed}
      pacing={pacing}
      markers={markers}
      onToggle={toggle}
      onStep={stepMonth}
      onSeek={seek}
      onLeap={leap}
      onModeChange={setMode}
      onSpeedChange={setSpeed}
      reduceMotion={reduceMotion}
    />
  );
}

export function WeatherLayerConnector({ citySlot = "A", selected = true, override }) {
  const { year, month, cityA, cityB, scenario, futureEnabled } = useClock();
  const { reduceMotion, showGhostAlways } = useSettings();
  const cityId = citySlot === "B" ? cityB : cityA;
  const activeScenario = futureEnabled ? scenario : undefined;

  const props = buildWeatherLayerProps({
    cityId: cityId ?? "karachi",
    selected,
    year,
    month,
    scenario: activeScenario,
    showGhostAlways,
    reduceMotion,
  });

  return <SlotHost name="WeatherLayer" override={override} {...props} />;
}

export function AmbientGlowConnector({ side = "both", override }) {
  const { year, month, cityA, cityB, scenario, futureEnabled } = useClock();
  const reduceMotion = useSettings((s) => s.reduceMotion);
  const activeScenario = futureEnabled ? scenario : undefined;

  const targetCityId = side === "right" && cityB ? cityB : cityA;
  const cityObj = targetCityId ? getLoadedCity(targetCityId) : null;
  const snapshot = cityObj ? getSnapshot(cityObj, year, month, activeScenario) : null;
  const beatPhase = (month % 4) / 4;

  const props = buildAmbientGlowProps({
    snapshot,
    side,
    beatPhase,
    reduceMotion,
  });

  return <SlotHost name="AmbientGlow" override={override} {...props} />;
}

export function ChartsConnector({ override }) {
  const { year, month, mode, cityA, layers, scenario, futureEnabled } = useClock();
  const reduceMotion = useSettings((s) => s.reduceMotion);
  const cityObj = getLoadedCity(cityA);
  const activeScenario = futureEnabled ? scenario : undefined;
  const range = cityObj ? getRange(cityObj, activeScenario) : { startYear: 1981, endYear: 2024 };

  const series = {};
  if (cityObj) {
    for (const layerId of layers) {
      try {
        series[layerId] = getSeries(cityObj, layerId, range.startYear, range.endYear);
      } catch {
        series[layerId] = [];
      }
    }
  }

  return (
    <SlotHost
      name="Charts"
      override={override}
      series={series}
      year={year}
      month={month}
      layers={layers}
      mode={mode}
      reduceMotion={reduceMotion}
    />
  );
}

export function TensionMeterConnector({ override }) {
  const { tension, interest } = useClock();
  const reduceMotion = useSettings((s) => s.reduceMotion);
  const props = buildTensionMeterProps({ tension, interest, reduceMotion });

  return <SlotHost name="TensionMeter" override={override} {...props} />;
}

export function LayerTogglesConnector({ override }) {
  const { year, cityA, scenario, futureEnabled } = useClock();
  const { layers: enabledLayers, toggleLayer, reduceMotion } = useSettings();
  const activeScenario = futureEnabled ? scenario : undefined;
  const layers = getLayerGating(cityA, year, enabledLayers, activeScenario);

  return (
    <SlotHost
      name="LayerToggles"
      override={override}
      layers={layers}
      onToggle={toggleLayer}
      reduceMotion={reduceMotion}
    />
  );
}

export function StoryCardConnector({ override }) {
  const activeStory = useAppFlow((s) => s.activeStory);
  const closeStory = useAppFlow((s) => s.closeStory);
  const reduceMotion = useSettings((s) => s.reduceMotion);

  return (
    <SlotHost
      name="StoryCard"
      override={override}
      story={activeStory}
      onClose={closeStory}
      reduceMotion={reduceMotion}
    />
  );
}

export function BadgeToastConnector({ override }) {
  const activeBadge = useAppFlow((s) => s.activeBadge);
  const reduceMotion = useSettings((s) => s.reduceMotion);

  return (
    <SlotHost
      name="BadgeToast"
      override={override}
      badge={activeBadge}
      reduceMotion={reduceMotion}
    />
  );
}

export function CompareViewConnector({ override }) {
  const { year, month, cityA, cityB, scenario, futureEnabled } = useClock();
  const compareStartYear = useAppFlow((s) => s.compareStartYear);
  const setCompareStartYear = useAppFlow((s) => s.setCompareStartYear);
  const reduceMotion = useSettings((s) => s.reduceMotion);
  const activeScenario = futureEnabled ? scenario : undefined;

  const props = buildCompareProps({
    cityA,
    cityB: cityB ?? "lahore",
    startYear: compareStartYear,
    currentYear: year,
    month,
    scenario: activeScenario,
    onStartYearChange: setCompareStartYear,
    reduceMotion,
  });

  return <SlotHost name="CompareView" override={override} {...props} />;
}

export function LegendConnector({ override }) {
  const { year, month, cityA, scenario, futureEnabled } = useClock();
  const { layers: enabledLayers, reduceMotion } = useSettings();
  const activeScenario = futureEnabled ? scenario : undefined;
  const cityObj = getLoadedCity(cityA);
  const snapshot = cityObj ? getSnapshot(cityObj, year, month, activeScenario) : null;

  const props = buildLegendProps({
    cityId: cityA,
    year,
    month,
    snapshot,
    enabledLayers,
    scenario: activeScenario,
    reduceMotion,
  });

  return <SlotHost name="Legend" override={override} {...props} />;
}
