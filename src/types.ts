import type { Feature, Geometry } from 'geojson';

export interface CountryProps {
  ISO2: string | null; // null for disputed/unlisted places (Somaliland, N. Cyprus...)
  NAME: string;
  micro: boolean; // set by mergeCountries() from the API's `marker`; not present in modern.geojson
  lat: number;
  lng: number;
}
export type CountryFeature = Feature<Geometry, CountryProps>;
export type LayerId = 'content' | 'regime' | 'flags' | 'geoguessr' | 'ranking';
export interface Lines {
  borders: number[][][];
  coast: number[][][];
}
/** Stable id for a modern-layer polygon. */
export const idOf = (f: CountryFeature) => f.properties.ISO2 ?? f.properties.NAME;
