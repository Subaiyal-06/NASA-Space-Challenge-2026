// ADAPTERS: small fixes applied to a delivered city file when it is LOADED. We never edit the data
// team's files. Each adapter takes a city and returns { city, notes }, where notes explain what changed.
// To add one: write a function below and add it to the list at the bottom.

// A projection with no named source is not allowed to reach the app: it could be made-up numbers.
function dropUnsourcedProjection(city) {
  if (city.projection && !(typeof city.projection.source === "string" && city.projection.source)) {
    const { projection, ...rest } = city;
    return { city: rest, notes: [`${city.city}: projection ignored because it has no "source" (ask the data team for the real NASA NEX-GDDP-CMIP6 numbers)`] };
  }
  return { city, notes: [] };
}

const adapters = [dropUnsourcedProjection];

export function applyAdapters(city) {
  const notes = [];
  let current = city;
  for (const adapt of adapters) {
    const result = adapt(current);
    current = result.city;
    notes.push(...result.notes);
  }
  return { city: current, notes };
}
