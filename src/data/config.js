// Data-layer settings. Change a value here, nothing else needs editing.
export const DATA_CONFIG = {
  // Earthquakes smaller than this are kept in the data files but not reported by the data API.
  // Reason: within 300 km of Peshawar there are about 3-4 quakes of magnitude 4.5+ every month, so every
  // month would "shake". 5.5 keeps the notable ones. Set to 0 to report everything.
  minQuakeMagnitude: 5.5,

  // Layers the core app already understands. Any other layer in a city file is an "extra layer"
  // (for example vegetation, aqi, nightlights) and is exposed through getExtras() / getSeries().
  coreLayers: ["temperature", "rainfall", "drought", "air", "earthquakes"],
};
