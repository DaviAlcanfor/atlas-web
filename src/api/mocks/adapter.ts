import { ApiError, parse } from '../client';
import * as S from '../schemas';
import type { AtlasApi } from '../types';
import { nearestYear } from '../../lib/snapshots';
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
