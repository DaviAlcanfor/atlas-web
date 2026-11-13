// Spec 012 (stage 1): historical snapshots (Cliopatria, CC BY 4.0) turned into what the globe already draws.
import { geoCentroid } from 'd3-geo';
import type { FeatureCollection, Geometry } from 'geojson';
import { largestPolygon } from './flagMaterial';
import { regimePalette } from './palette';
import type { CountryFeature } from '../types';

/** Properties of one entity in a snapshot file (contract CR-005). */
export interface HistProps {
  name: string; // pt-BR when Wikidata has it, else the source's English name
  name_en: string; // unique inside a snapshot: used as the id
  wikidata: string | null;
  from_year: number;
  to_year: number;
  member_of: string | null;
  wikipedia_url: string | null;
}
export interface Snapshot {
  year: number;
  features: CountryFeature[]; // id (idOf) = name_en
  props: Map<string, HistProps>;
  ids: Set<string>;
  borders: number[][][];
}

const polygonsOf = (g: Geometry) => (g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : []);

/** Every ring segment once: neighbours share their border, and drawing it twice would make shared borders brighter than coasts. */
export function uniqueSegments(geometries: Geometry[]): number[][][] {
  const seen = new Set<string>();
  const out: number[][][] = [];
  for (const g of geometries) {
    for (const ring of polygonsOf(g).flat()) {
      for (let i = 1; i < ring.length; i++) {
        const a = ring[i - 1]!, b = ring[i]!;
        const ka = `${a[0]},${a[1]}`, kb = `${b[0]},${b[1]}`;
        const key = ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push([a, b]);
      }
    }
  }
  return out;
}

/** Stable colour per entity: the same empire keeps its colour across years. Colour only tells neighbours apart; the name says who. */
export function tintOf(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return regimePalette[h % regimePalette.length]!;
}

export function toSnapshot(year: number, fc: FeatureCollection<Geometry, HistProps>): Snapshot {
  const props = new Map<string, HistProps>();
  const features: CountryFeature[] = [];
  for (const f of fc.features) {
    const p = f.properties;
    if (!p?.name_en || props.has(p.name_en)) continue;
    const main = largestPolygon(f.geometry);
    if (!main) continue;
    const [lng, lat] = geoCentroid(main);
    props.set(p.name_en, p);
    features.push({ type: 'Feature', geometry: f.geometry, properties: { ISO2: null, NAME: p.name_en, micro: false, lat, lng } });
  }
  return { year, features, props, ids: new Set(props.keys()), borders: uniqueSegments(features.map((f) => f.geometry)) };
}

// The last few snapshots stay in memory: dragging the slider back and forth does not refetch.
const CACHE_MAX = 6;
const cache = new Map<number, Promise<Snapshot>>();

export function loadSnapshot(year: number, url: string): Promise<Snapshot> {
  let p = cache.get(year);
  if (p) {
    cache.delete(year); // refresh LRU position
  } else {
    p = fetch(url).then((r) => {
      if (!r.ok) throw new Error(`${r.status} ao carregar o mapa de ${year}`);
      return r.json() as Promise<FeatureCollection<Geometry, HistProps>>;
    }).then((fc) => toSnapshot(year, fc));
    p.catch(() => cache.delete(year)); // a failed download may be retried
  }
  cache.set(year, p);
  if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value!);
  return p;
}

/** "1815 – 1918"; an entity alive in the last source year (2024) is shown as ongoing. */
export const LAST_SOURCE_YEAR = 2024;
