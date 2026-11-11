import { useEffect, useState } from 'react';
import { api } from '../api';
import { mergeCountries } from '../lib/merge';
import type { CountryFeature, Lines } from '../types';

interface Data {
  features: CountryFeature[];
  lines: Lines;
  contentIds: Set<string>;
  knownIds: Set<string>;
  regimes: Map<string, string>;
}

/** Static geometry (public/data) + the country list from the API ("has content", micro-state markers, regime). */
export function useAtlasData() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    const base = import.meta.env.BASE_URL + 'data/';
    const get = (f: string) =>
      fetch(base + f).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`${f}: HTTP ${r.status}`))));
    // The API being down must not take the map with it: geometry is static, so show the globe (all hatched) plus a banner.
    const countries = api.countries().catch((e: Error) => { setApiError(e.message); return []; });
    Promise.all([get('modern.geojson'), get('lines.json'), countries])
      .then(([geo, lines, list]) => setData({ ...mergeCountries(geo.features, list), lines }))
      .catch((e: Error) => setError(e.message));
  }, []);

  return { data, error, apiError };
}
