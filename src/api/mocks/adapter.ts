import { ApiError, parse } from '../client';
import * as S from '../schemas';
import type { AtlasApi } from '../types';
import { nearestYear } from '../../lib/snapshots';
import v12 from './v12.json';
import { COUNTRIES, COUNTRY_SUMMARIES, GLOSSARY, LEADERS, LINKS, PEOPLE, POLITIES, SNAPSHOTS } from './fixtures';

const notFound = (what: string) => new ApiError(404, 'Not Found', what);
const norm = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

/** In-memory API. Every answer goes through the same zod check as real responses, so a bad fixture fails loudly. */
export function createMockApi(delayMs = 150): AtlasApi {
  const wait = <T>(v: () => T) => new Promise<T>((res, rej) => setTimeout(() => { try { res(v()); } catch (e) { rej(e); } }, delayMs));
  return {
    countries: () => wait(() => parse(S.CountryList, { items: COUNTRY_SUMMARIES }, 'mock /v1/countries').items),
    country: (iso2) => wait(() => {
      const c = COUNTRIES.find((x) => x.iso2 === iso2);
      if (!c) throw notFound(`Unknown country ${iso2}`);
      return parse(S.CountryDetail, c, `mock /v1/countries/${iso2}`);
    }),
    nearestSnapshot: (year) => wait(() => {
      const n = nearestYear(SNAPSHOTS.map((s) => s.year), year);
      if (!n) throw notFound('No snapshots');
      return parse(S.SnapshotNearest, { requested_year: year, snapshot: SNAPSHOTS.find((s) => s.year === n.year), distance_years: n.distance }, 'mock nearest');
    }),
    snapshotLinks: (year) => wait(() => {
      const l = LINKS[year];
      if (!l) throw notFound(`No snapshot for year ${year}`);
      return parse(S.SnapshotLinks, l, `mock /v1/snapshots/${year}/links`);
    }),
    polity: (id) => wait(() => {
      const p = POLITIES.find((x) => x.id === id);
      if (!p) throw notFound(`Unknown polity ${id}`);
      return parse(S.PolityDetail, p, `mock /v1/polities/${id}`);
    }),
    glossary: () => wait(() => parse(S.GlossaryList, { items: GLOSSARY }, 'mock /v1/glossary').items),
    leaders: (iso2) => wait(() => {
      if (!COUNTRIES.some((x) => x.iso2 === iso2)) throw notFound(`Unknown country ${iso2}`);
      return parse(S.LeaderList, { items: LEADERS[iso2] ?? [] }, `mock leaders ${iso2}`).items;
    }),
    people: (iso2, domain, limit = 10) => wait(() => {
      if (!COUNTRIES.some((x) => x.iso2 === iso2)) throw notFound(`Unknown country ${iso2}`);
      const p = PEOPLE[iso2];
      if (!p) throw notFound(`No people for ${iso2}`); // mocks only carry BR and JP
      const items = p.items.filter((x) => !domain || x.domain === domain).slice(0, limit);
      return parse(S.PeopleList, { ...p, items }, `mock people ${iso2}`);
    }),
    // v1.2 part A: samples from the local API (BR/JP/DE profile+economy, BRL currency and history); anything else is a 404 = section hidden.
    profile: (iso2) => wait(() => {
      const p = (v12.profile as Record<string, unknown>)[iso2];
      if (!p) throw notFound(`No profile for ${iso2}`);
      return parse(S.CountryProfile, p, `mock profile ${iso2}`);
    }),
    economy: (iso2) => wait(() => {
      const p = (v12.economy as Record<string, unknown>)[iso2];
      if (!p) throw notFound(`No economy for ${iso2}`);
      return parse(S.CountryEconomy, p, `mock economy ${iso2}`);
    }),
    compareEconomy: (countries, ids) => wait(() => {
      if (countries.length < 2 || countries.length > 5) throw new ApiError(422, 'Unprocessable Entity', 'countries must have 2-5 items');
      const econ = v12.economy as Record<string, { indicators: { id: string; value: number | null; year: number | null }[] }>;
      const base = v12.compare;
      const known = new Set([...base.countries, ...Object.keys(econ)]);
      for (const c of countries) if (!known.has(c)) throw notFound(`Unknown country ${c}`);
      const indicators = base.indicators.filter((i) => !ids?.length || ids.includes(i.id)).map((i) => ({
        id: i.id, label: i.label, unit: i.unit,
        values: Object.fromEntries(countries.map((c) => {
          const v = (i.values as Record<string, unknown>)[c] ?? (() => { const e = econ[c]?.indicators.find((x) => x.id === i.id); return e && e.value !== null ? { value: e.value, year: e.year } : null; })();
          return [c, v ?? null];
        })),
      }));
      return parse(S.EconomyCompare, { countries, indicators, sources: base.sources }, 'mock compare');
    }),
    currency: (code) => wait(() => {
      const c = (v12.currency as Record<string, unknown>)[code];
      if (!c) throw notFound(`No country uses ${code}`);
      return parse(S.CurrencyDetail, c, `mock currency ${code}`);
    }),
    currencyHistory: (code, vs, from, to) => wait(() => {
      if (code !== v12.history.base) throw notFound(`No rates for ${code}`); // the sample is BRL only
      const keep = vs.filter((c) => c in v12.history.items[0]!.rates);
      if (!keep.length) throw notFound(`No rates for ${vs.join(',')}`);
      const items = v12.history.items.filter((i) => (!from || i.date >= from) && (!to || i.date <= to))
        .map((i) => ({ date: i.date, rates: Object.fromEntries(keep.map((c) => [c, (i.rates as Record<string, number>)[c]])) }));
      return parse(S.CurrencyHistory, { ...v12.history, vs: keep, items }, 'mock history');
    }),
    search: (q) => wait(() => {
      if (q.trim().length < 2) throw new ApiError(422, 'Unprocessable Entity', 'q must have at least 2 characters');
      const n = norm(q.trim());
      const items = POLITIES.filter((p) => norm(p.name).includes(n)).map((p) => ({
        kind: (p.iso2 ? 'country' : 'polity') as 'country' | 'polity', id: p.iso2 ?? p.id, name: p.name, iso2: p.iso2, start_year: p.start_year, end_year: p.end_year,
      }));
      return parse(S.SearchResults, { items }, 'mock search').items;
    }),
  };
}
