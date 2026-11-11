// Runtime validation of every API response, written from contract/CONTRACT.md v1.0.
// zod = "a schema that checks data when the program runs" (TypeScript types vanish at runtime, so they can't
// catch a server that sends the wrong shape). If the API drifts from the contract, parse() throws with a readable path.
import { z } from 'zod';

// Years are signed integers with NO year 0 (1 BCE = -1, 1 CE = 1).
export const Year = z.number().int().refine((n) => n !== 0, 'year 0 does not exist');
const Str = z.string();
const NStr = z.string().nullable();

export const Precision = z.enum(['exact', 'circa', 'decade', 'century']);

export const Source = z.object({ id: Str, title: Str, url: NStr, license: NStr, retrieved_at: NStr });
export const Event = z.object({
  id: Str,
  year_start: Year,
  year_end: Year.nullable(),
  precision: Precision,
  title: Str,
  summary: Str,
  kind: z.enum(['political', 'war', 'treaty', 'cultural', 'economic', 'other']),
  source_ids: z.array(Str),
});
export const Politics = z.object({ system: NStr, note: NStr, updated_at: NStr });
const PolityType = z.enum(['empire', 'kingdom', 'republic', 'federation', 'confederation', 'colony', 'protectorate', 'city_state', 'other']);
export const PolitySummary = z.object({
  id: Str, name: Str, type: PolityType, start_year: Year, end_year: Year.nullable(), iso2: NStr,
});
export const Link = z.object({
  polity_id: Str, name: Str, year: Year,
  kind: z.enum(['renamed', 'succeeded', 'split', 'merged', 'absorbed', 'conquered']),
});
export const PolityDetail = PolitySummary.extend({
  start_precision: Precision,
  end_precision: Precision.nullable(),
  names: z.array(z.object({ name: Str, from_year: Year, to_year: Year.nullable() })),
  predecessors: z.array(Link),
  successors: z.array(Link),
  regime: NStr,
  summary: NStr,
  politics: Politics.nullable(),
  timeline: z.array(Event),
  wikipedia: z.object({ title: Str, url: Str }).nullable(),
  sources: z.array(Source),
  updated_at: Str,
});
export const Marker = z.object({ lat: z.number(), lng: z.number() });
export const CountrySummary = z.object({
  iso2: Str, polity_id: Str, name: Str, capital: NStr, region: NStr, regime: NStr,
  has_content: z.boolean(), marker: Marker.nullable(),
});
export const CountryDetail = z.object({
  iso2: Str, polity_id: Str, name: Str, official_name: NStr, capital: NStr, flag_url: NStr, region: NStr, regime: NStr, summary: NStr,
  languages: z.array(z.object({ code: Str, name: Str })),
  currencies: z.array(z.object({ code: Str, name: Str, symbol: NStr })),
  population: z.object({ value: z.number().int(), year: Year.nullable(), source_id: Str }).nullable(),
  area_km2: z.number().nullable(),
  memberships: z.array(Str),
  politics: Politics.nullable(),
  timeline: z.array(Event),
  sources: z.array(Source),
  updated_at: Str,
});
export const SnapshotInfo = z.object({
  year: Year, geometry_url: Str, feature_count: z.number().int(), link_coverage: z.number().min(0).max(1),
});

export const CountryList = z.object({ items: z.array(CountrySummary) });
export const PolityList = z.object({ year: Year.nullable(), items: z.array(PolitySummary), total: z.number().int() });
export const SnapshotList = z.object({ items: z.array(SnapshotInfo) });
export const SnapshotNearest = z.object({ requested_year: Year, snapshot: SnapshotInfo, distance_years: z.number().int() });
export const SnapshotLinks = z.object({
  snapshot_year: Year,
  links: z.array(z.object({ source_name: Str, polity_id: NStr, status: z.enum(['curated', 'auto', 'unresolved']) })),
});
export const SearchResults = z.object({
  items: z.array(z.object({ kind: z.enum(['country', 'polity']), id: Str, name: Str, iso2: NStr, start_year: Year, end_year: Year.nullable() })),
});
export const Meta = z.object({
  data_version: Str, generated_at: Str, year_min: Year, year_max: Year, snapshot_years: z.array(Year),
  counts: z.object({ countries: z.number().int(), polities: z.number().int(), events: z.number().int() }),
});
export const ProblemJson = z.object({ type: Str, title: Str, status: z.number(), detail: Str });
