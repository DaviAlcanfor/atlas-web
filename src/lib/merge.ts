import type { CountrySummary } from '../api/types';
import type { CountryFeature } from '../types';

/**
 * Combine the static polygons with the API's country list:
 *  - contentIds = countries where has_content is true
 *  - features whose country has a `marker` become micro-state markers at the API's position (polygon untouched)
 * Pure function: no mutation of the input features.
 */
export function mergeCountries(features: CountryFeature[], countries: CountrySummary[]) {
  const byIso = new Map(countries.map((c) => [c.iso2, c]));
  const contentIds = new Set(countries.filter((c) => c.has_content).map((c) => c.iso2)); // curated text exists (globe color)
  const knownIds = new Set(countries.map((c) => c.iso2)); // the API has a record (facts), curated or not
  const regimes = new Map(countries.flatMap((c) => (c.regime ? [[c.iso2, c.regime] as const] : [])));
  const merged = features.map((f): CountryFeature => {
    const marker = f.properties.ISO2 ? byIso.get(f.properties.ISO2)?.marker : null;
    return marker
      ? { ...f, properties: { ...f.properties, micro: true, lat: marker.lat, lng: marker.lng } }
      : { ...f, properties: { ...f.properties, micro: false } };
  });
  const capitals = new Map(countries.flatMap((c) => (c.capital_coords?.length ? [[c.iso2, c.capital_coords] as const] : []))); // v1.1
  const names = new Map(countries.map((c) => [c.iso2, c.name])); // pt-BR names (the polygons carry English ones)
  return { features: merged, contentIds, knownIds, regimes, capitals, names };
}
