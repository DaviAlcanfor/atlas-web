import type { Feature, Geometry } from 'geojson';

export interface CountryProps {
  ISO2: string | null; // null for disputed/unlisted places (Somaliland, N. Cyprus...)
  NAME: string;
  micro: boolean; // too small to see: drawn as a marker
  lat: number;
  lng: number;
}
export type CountryFeature = Feature<Geometry, CountryProps>;
export type LayerId = 'content' | 'regime';
export interface Lines {
  borders: number[][][];
  coast: number[][][];
}
/** Stable id for a modern-layer polygon. */
export const idOf = (f: CountryFeature) => f.properties.ISO2 ?? f.properties.NAME;
