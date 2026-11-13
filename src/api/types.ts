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
export type CapitalCoord = z.infer<typeof S.CapitalCoord>;
export type Clues = z.infer<typeof S.Clues>;
export type Image = z.infer<typeof S.Image>;
export type GlossaryTerm = z.infer<typeof S.GlossaryTerm>;
export type Leader = z.infer<typeof S.Leader>;
export type CountryHistory = z.infer<typeof S.CountryHistory>;
export type Subdivision = z.infer<typeof S.Subdivision>;
export type IdeologyFigure = z.infer<typeof S.IdeologyFigure>;
export type CountryIdeologies = z.infer<typeof S.CountryIdeologies>;
export type IdeologyDetail = z.infer<typeof S.IdeologyDetail>;
export type SubdivisionList = z.infer<typeof S.SubdivisionList>;
export type Person = z.infer<typeof S.Person>;
export type PersonDomain = z.infer<typeof S.PersonDomain>;
export type People = z.infer<typeof S.PeopleList>;
export type LanguageSpoken = z.infer<typeof S.LanguageSpoken>;
export type LanguageStatus = z.infer<typeof S.LanguageStatus>;
export type ProfileIndicator = z.infer<typeof S.ProfileIndicator>;
export type CountryProfile = z.infer<typeof S.CountryProfile>;
export type CountryEconomy = z.infer<typeof S.CountryEconomy>;
export type EconomyCompare = z.infer<typeof S.EconomyCompare>;
export type CurrencyDetail = z.infer<typeof S.CurrencyDetail>;
export type CurrencyHistory = z.infer<typeof S.CurrencyHistory>;

/** Everything the UI needs from the API. Real client and mock adapter both implement it. */
export interface AtlasApi {
  countries(): Promise<CountrySummary[]>;
  country(iso2: string): Promise<CountryDetail>;
  nearestSnapshot(year: number): Promise<SnapshotNearest>;
  snapshotLinks(year: number): Promise<SnapshotLinks>;
  polity(id: string): Promise<PolityDetail>;
  search(q: string): Promise<SearchResults['items']>;
  // v1.1: production may still be v1.0 (404), so callers treat any failure as "no data" and hide the section.
  glossary(): Promise<GlossaryTerm[]>;
  leaders(iso2: string): Promise<Leader[]>;
  /** `limit` defaults to the API's 10. */
  people(iso2: string, domain?: PersonDomain, limit?: number): Promise<People>;
  // v1.2 part A: same rule, any failure = section hidden.
  profile(iso2: string): Promise<CountryProfile>;
  economy(iso2: string): Promise<CountryEconomy>;
  /** 2-5 countries, in the given order; `ids` = subset of the 10 economy indicator ids (default all). */
  compareEconomy(countries: string[], ids?: string[]): Promise<EconomyCompare>;
  currency(code: string): Promise<CurrencyDetail>;
  /** `vs`: 1-4 codes. `from`/`to`: YYYY-MM-DD (default: last year). */
  currencyHistory(code: string, vs: string[], from?: string, to?: string): Promise<CurrencyHistory>;
  // v1.3 proposal (spec 016 stage 1): any failure = section hidden.
  history(iso2: string): Promise<CountryHistory>;
  // v1.3 proposal (spec 024): any failure = no state facts/flags.
  subdivisions(iso2: string): Promise<SubdivisionList>;
  // v1.3 proposal (spec 018): any failure = section hidden / page says unavailable.
  ideologies(iso2: string): Promise<CountryIdeologies>;
  ideology(id: string): Promise<IdeologyDetail>;
}
