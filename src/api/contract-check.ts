// Compile-time contract check (spec 020): every zod schema's inferred type must be IDENTICAL to the type generated from the
// API's OpenAPI document (src/api/openapi.gen.ts, `npm run api:types`). Drift on either side makes `tsc` / `next build` fail
// with "Type 'false' does not satisfy the constraint 'true'" on the offending line; hover the two types to see the difference.
import type { z } from 'zod';
import type { components } from './openapi.gen';
import type * as S from './schemas';

type Gen = components['schemas'];
type Flat<T> = { [K in keyof T]: T[K] };
/** v1.1 fields stay optional in zod while production still serves v1.0 (remove once production is v1.1). */
type V10<T, K extends keyof T> = Flat<Omit<T, K> & { [P in K]?: T[P] }>;
type Equals<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Same<Zod extends z.ZodType, G> = Equals<z.infer<Zod>, G>;
type Assert<T extends true> = T;

type CountrySummary = V10<Gen['CountrySummary'], 'regime_id' | 'capital_coords'>;

export type ContractChecks = [
  Assert<Same<typeof S.Source, Gen['Source']>>,
  Assert<Same<typeof S.Event, Gen['Event']>>,
  Assert<Same<typeof S.Politics, Gen['Politics']>>,
  Assert<Same<typeof S.PolitySummary, Gen['PolitySummary']>>,
  Assert<Same<typeof S.Link, Gen['Link']>>,
  Assert<Same<typeof S.PolityDetail, Gen['PolityDetail']>>,
  Assert<Same<typeof S.Marker, Gen['Marker']>>,
  Assert<Same<typeof S.CapitalCoord, Gen['CapitalCoord']>>,
  Assert<Same<typeof S.Clues, Gen['Clues']>>,
  Assert<Same<typeof S.CountrySummary, CountrySummary>>,
  Assert<Same<typeof S.CountryDetail, V10<Gen['CountryDetail'], 'regime_id' | 'clues' | 'languages_spoken'>>>,
  Assert<Same<typeof S.CountryList, { items: CountrySummary[] }>>,
  Assert<Same<typeof S.SnapshotInfo, Gen['SnapshotInfo']>>,
  Assert<Same<typeof S.PolityList, Gen['PolityList']>>,
  Assert<Same<typeof S.SnapshotList, Gen['SnapshotList']>>,
  Assert<Same<typeof S.SnapshotNearest, Gen['SnapshotNearest']>>,
  Assert<Same<typeof S.SnapshotLinks, Gen['SnapshotLinks']>>,
  Assert<Same<typeof S.SearchResults, Gen['SearchResults']>>,
  Assert<Same<typeof S.Meta, Gen['Meta']>>,
  Assert<Same<typeof S.Image, Gen['Image']>>,
  Assert<Same<typeof S.GlossaryTerm, Gen['GlossaryTerm']>>,
  Assert<Same<typeof S.GlossaryList, Gen['GlossaryList']>>,
  Assert<Same<typeof S.Leader, Gen['Leader']>>,
  Assert<Same<typeof S.LeaderList, Gen['LeaderList']>>,
  Assert<Same<typeof S.Person, Gen['Person']>>,
  Assert<Same<typeof S.PeopleList, Gen['PersonList']>>,
  Assert<Same<typeof S.LanguageSpoken, Gen['LanguageSpoken']>>,
  Assert<Same<typeof S.ProfileIndicator, Gen['ProfileIndicator']>>,
  Assert<Same<typeof S.CountryProfile, Gen['CountryProfile']>>,
  Assert<Same<typeof S.CountryEconomy, Gen['CountryEconomy']>>,
  Assert<Same<typeof S.EconomyCompare, Gen['EconomyCompare']>>,
  Assert<Same<typeof S.CurrencyDetail, Gen['CurrencyDetail']>>,
  Assert<Same<typeof S.CurrencyHistory, Gen['CurrencyHistory']>>,
  Assert<Same<typeof S.Period, Gen['Period']>>,
  Assert<Same<typeof S.CountryHistory, Gen['CountryHistory']>>,
  Assert<Same<typeof S.Subdivision, Gen['Subdivision']>>,
  Assert<Same<typeof S.SubdivisionList, Gen['SubdivisionList']>>,
];
