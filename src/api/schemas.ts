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
// v1.1 additions are `.optional()`: production serves v1.0 until the API is redeployed, and a 1.0 answer must still parse.
export const CapitalCoord = z.object({ name: Str, lat: z.number(), lng: z.number() });
export const Clues = z.object({
  driving_side: z.enum(['left', 'right']).nullable(), calling_code: NStr, tld: NStr, plate_code: NStr, scripts: z.array(Str),
});
export const CountrySummary = z.object({
  iso2: Str, polity_id: Str, name: Str, capital: NStr, region: NStr, regime: NStr,
  has_content: z.boolean(), marker: Marker.nullable(),
  regime_id: NStr.optional(), capital_coords: z.array(CapitalCoord).optional(),
});
// v1.2 (optional until production is migrated)
export const LanguageStatus = z.enum(['official', 'co_official', 'indigenous', 'immigrant', 'sign', 'historical']);
export const LanguageSpoken = z.object({
  code: NStr, name: Str, status: LanguageStatus, where: NStr,
  speakers: z.object({ value: z.number().int(), year: z.number().int().nullable() }).nullable(),
  family: NStr, endangerment: NStr, wikipedia_url: NStr,
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
  regime_id: NStr.optional(), clues: Clues.nullable().optional(),
  languages_spoken: z.array(LanguageSpoken).optional(),
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

// ---- v1.1 ----
export const Image = z.object({ url: Str, credit: Str, license: Str });
export const GlossaryKind = z.enum(['regime', 'system', 'region', 'membership', 'currency', 'other']);
export const GlossaryTerm = z.object({
  id: Str, kind: GlossaryKind, label: Str, short: Str, body: Str, icon: NStr, examples: z.array(Str), sources: z.array(Source),
});
export const GlossaryList = z.object({ items: z.array(GlossaryTerm) });
export const Leader = z.object({
  person_id: Str, name: Str, role: z.enum(['head_of_state', 'head_of_government']), office: NStr, start: NStr, end: NStr,
  party: z.object({ id: Str, name: Str }).nullable(), image: Image.nullable(), wikipedia_url: NStr,
});
export const LeaderList = z.object({ items: z.array(Leader) });
export const PersonDomain = z.enum(['arts', 'business_law', 'exploration', 'humanities', 'institutions', 'public_figure', 'science_technology', 'sports']);
export const Person = z.object({
  id: Str, name: Str, occupation: NStr, domain: PersonDomain.nullable(), birth_year: z.number().int().nullable(), death_year: z.number().int().nullable(),
  image: Image.nullable(), wikipedia_url: NStr, rank: z.number().int(),
});
export const PeopleList = z.object({ items: z.array(Person), method: Str, source: Source });

// ---- v1.2 part A (profile, languages, currency, economy). Production serves v1.1 until migrated: every v1.2 field/endpoint is optional for callers. ----
export const ProfileIndicator = z.object({
  id: Str, label: Str, unit: Str, value: z.number(), year: z.number().int(), source_id: Str,
  rank: z.number().int().nullable(), rank_of: z.number().int().nullable(),
  world: z.object({ min: z.number(), median: z.number(), max: z.number() }).nullable(),
  region_avg: z.number().nullable(),
});
const Share = z.object({ label: Str, share: z.number() });
export const CountryProfile = z.object({
  groups: z.array(z.object({ id: z.enum(['life', 'society', 'income', 'environment']), indicators: z.array(ProfileIndicator) })),
  composition: z.object({ religion: z.array(Share).nullable(), ethnicity: z.array(Share).nullable(), year: z.number().int().nullable(), source_id: NStr }),
  sources: z.array(Source),
});
const Point = z.object({ year: z.number().int(), value: z.number() });
export const CountryEconomy = z.object({
  indicators: z.array(z.object({ id: Str, label: Str, unit: Str, value: z.number().nullable(), year: z.number().int().nullable(), source_id: Str, series: z.array(Point) })),
  sources: z.array(Source),
});
export const EconomyCompare = z.object({
  countries: z.array(Str),
  indicators: z.array(z.object({ id: Str, label: Str, unit: Str, values: z.record(Str, z.object({ value: z.number(), year: z.number().int() }).nullable()) })),
  sources: z.array(Source),
});
export const CurrencyDetail = z.object({
  code: Str, name: Str, symbol: NStr, countries: z.array(Str),
  rates: z.object({ date: Str, base: Str, items: z.array(z.object({ code: Str, rate: z.number() })) }).nullable(),
  stats: z.object({ change_1y: z.number().nullable(), change_5y: z.number().nullable(), volatility_1y: z.number().nullable(), max_drawdown_1y: z.number().nullable() }).nullable(),
  sources: z.array(Source),
});
export const CurrencyHistory = z.object({
  base: Str, vs: z.array(Str), items: z.array(z.object({ date: Str, rates: z.record(Str, z.number()) })), source: Source,
});

// ---- v1.3 proposal (spec 016 stage 1, CR-004): condensed pt.wikipedia history. Not in production yet: any failure = section hidden. ----
export const Period = z.object({ id: Str, title: Str, year_start: Year.nullable(), year_end: Year.nullable(), summary: Str, event_count: z.number().int() });
export const CountryHistory = z.object({ summary: NStr, periods: z.array(Period), sources: z.array(Source) });
