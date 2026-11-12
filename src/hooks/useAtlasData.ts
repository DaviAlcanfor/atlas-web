import { useEffect, useState } from 'react';
import { api } from '../api';
import type { CountrySummary, GlossaryTerm } from '../api/types';
import { mergeCountries } from '../lib/merge';
import type { CountryFeature, Lines } from '../types';

interface Data {
  features: CountryFeature[];
  lines: Lines;
  contentIds: Set<string>;
  knownIds: Set<string>;
  regimes: Map<string, string>;
  capitals: ReturnType<typeof mergeCountries>['capitals'];
  names: ReturnType<typeof mergeCountries>['names'];
  glossary: GlossaryTerm[];
}

/** What the loading screen can show before `data` is complete (spec 021). */
export interface LoadProgress {
  geo: number; // 0..1, bytes of modern.geojson + lines.json received
  countries: CountrySummary[] | null; // the API list, as soon as it arrives
  glossaryDone: boolean;
}

// Approximate decoded sizes (bytes) of the static map files, for the progress bar (Content-Length is the compressed size, or missing).
// If they drift the bar just reaches the end a bit early or waits at 99% until the file is done.
const GEO_BYTES = { 'modern.geojson': 1_350_000, 'lines.json': 1_175_000 } as const;
const GEO_TOTAL = GEO_BYTES['modern.geojson'] + GEO_BYTES['lines.json'];

/** fetch + JSON.parse, reporting bytes received through a ReadableStream (falls back to a plain read without streams). */
async function getJson(file: keyof typeof GEO_BYTES, onBytes: (n: number) => void) {
  const r = await fetch('/data/' + file); // public/data/
  if (!r.ok) throw new Error(`${file}: HTTP ${r.status}`);
  if (!r.body) return r.json();
  const reader = r.body.getReader();
  const chunks: Uint8Array[] = [];
  let got = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    got += value.length;
    onBytes(Math.min(got, GEO_BYTES[file] * 0.99));
  }
  onBytes(GEO_BYTES[file]);
  return JSON.parse(await new Blob(chunks as BlobPart[]).text());
}

/**
 * Static geometry (public/data) + the country list from the API ("has content", micro-state markers, regime).
 * `enabled = false` (pages without the globe, e.g. /glossario opened directly) loads nothing until it turns true.
 */
export function useAtlasData(enabled = true) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [progress, setProgress] = useState<LoadProgress>({ geo: 0, countries: null, glossaryDone: false });

  useEffect(() => {
    if (!enabled) return;
    const got = { 'modern.geojson': 0, 'lines.json': 0 };
    const get = (f: keyof typeof GEO_BYTES) =>
      getJson(f, (n) => {
        got[f] = n;
        setProgress((p) => ({ ...p, geo: (got['modern.geojson'] + got['lines.json']) / GEO_TOTAL }));
      });
    // The API being down must not take the map with it: geometry is static, so show the globe (all hatched) plus a banner.
    const countries = api
      .countries()
      .catch((e: Error) => { setApiError(e.message); return [] as CountrySummary[]; })
      .then((l) => { setProgress((p) => ({ ...p, countries: l })); return l; });
    // v1.1 endpoint: production may still be v1.0 (404). No glossary just means no info icons, never an error banner.
    const glossary = api
      .glossary()
      .catch(() => [] as GlossaryTerm[])
      .then((t) => { setProgress((p) => ({ ...p, glossaryDone: true })); return t; });
    Promise.all([get('modern.geojson'), get('lines.json'), countries, glossary])
      .then(([geo, lines, list, terms]) => setData({ ...mergeCountries(geo.features, list), lines, glossary: terms }))
      .catch((e: Error) => setError(e.message));
  }, [enabled]);

  return { data, error, apiError, progress };
}
