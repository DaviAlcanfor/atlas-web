// Types are inferred from the zod schemas, so a type and its runtime check can never disagree.
// ponytail: when contract/openapi.generated.json for v1.1 exists, swap for `openapi-typescript` output (schemas.ts stays for runtime checks).
import type { z } from 'zod';
import type * as S from './schemas';

export type Precision = z.infer<typeof S.Precision>;
export type Source = z.infer<typeof S.Source>;
export type Event = z.infer<typeof S.Event>;
export type Politics = z.infer<typeof S.Politics>;
export type PolitySummary = z.infer<typeof S.PolitySummary>;
export type PolityDetail = z.infer<typeof S.PolityDetail>;
export type CountrySummary = z.infer<typeof S.CountrySummary>;
export type CountryDetail = z.infer<typeof S.CountryDetail>;
export type SnapshotInfo = z.infer<typeof S.SnapshotInfo>;
export type SnapshotNearest = z.infer<typeof S.SnapshotNearest>;
export type SnapshotLinks = z.infer<typeof S.SnapshotLinks>;
export type SearchResults = z.infer<typeof S.SearchResults>;
export type Meta = z.infer<typeof S.Meta>;

/** Everything the UI needs from the API. Real client and mock adapter both implement it. */
export interface AtlasApi {
  countries(): Promise<CountrySummary[]>;
  country(iso2: string): Promise<CountryDetail>;
  nearestSnapshot(year: number): Promise<SnapshotNearest>;
  snapshotLinks(year: number): Promise<SnapshotLinks>;
  polity(id: string): Promise<PolityDetail>;
  search(q: string): Promise<SearchResults['items']>;
}
