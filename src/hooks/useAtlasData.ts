import { useEffect, useState } from 'react';
import type { CountryFeature, Lines } from '../types';

// Every content/<ISO2>.json file marks that country as "has content" (curated text is loaded in a later phase).
const contentFiles = import.meta.glob('../../content/*.json');
const contentIds = new Set(Object.keys(contentFiles).flatMap((p) => /\/([A-Z]{2})\.json$/.exec(p)?.[1] ?? []));

interface Data {
  features: CountryFeature[];
  lines: Lines;
  contentIds: Set<string>;
}

export function useAtlasData() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const base = import.meta.env.BASE_URL + 'data/';
    const get = (f: string) =>
      fetch(base + f).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`${f}: HTTP ${r.status}`))));
    Promise.all([get('modern.geojson'), get('lines.json')])
      .then(([geo, lines]) => setData({ features: geo.features, lines, contentIds }))
      .catch((e: Error) => setError(e.message));
  }, []);

  return { data, error };
}
