// Data-layer settings. Change a value here, nothing else needs editing.
export const DATA_CONFIG = {
  // Earthquakes smaller than a city's "floor" are kept in the data files but not reported by the data API.
  // The floor is chosen per city so that no more than about one month in eight "shakes" (Peshawar has 3-4 quakes of
  // magnitude 4.5+ every month, Karachi very few). The first of these that keeps the city under the share is used.
  quakeFloors: [5.0, 5.5, 6.0],
  maxQuakeMonthShare: 0.12,
  minQuakeMagnitude: 6.0, // the highest floor (used when none of the lower ones fit)

  // Layers the core app already understands. Any other layer in a city file is an "extra layer"
  // (for example vegetation, aqi, nightlights) and is exposed through getExtras() / getSeries().
  coreLayers: ["temperature", "rainfall", "drought", "air", "earthquakes"],
};
