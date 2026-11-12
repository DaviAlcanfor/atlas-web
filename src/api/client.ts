import type { z } from 'zod';
import * as S from './schemas';
import type { AtlasApi } from './types';

/** The API answered with an error status (application/problem+json). */
export class ApiError extends Error {
  constructor(readonly status: number, readonly title: string, detail: string) {
    super(`${status} ${title}: ${detail}`);
  }
}
export const isNotFound = (e: unknown) => e instanceof ApiError && e.status === 404;
/** The API answered 200 but the body does not match the contract. */
export class ContractError extends Error {}

/** Same validation used by the real client and the mocks, so both fail loudly in the same way. */
export function parse<T extends z.ZodType>(schema: T, data: unknown, what: string): z.infer<T> {
  const r = schema.safeParse(data);
  if (r.success) return r.data;
  const first = r.error.issues[0];
  throw new ContractError(`Contract mismatch in ${what}: at "${first?.path.join('.') ?? ''}" ${first?.message ?? 'invalid'} (${r.error.issues.length} issue(s))`);
}

/** `timeoutMs`: abort slow calls (used on the server, so a hung API cannot stall `next build` or a page render). */
export function createClient(baseUrl: string, timeoutMs?: number): AtlasApi {
  const root = baseUrl.replace(/\/+$/, '');
  // No `cache` option on purpose: the browser's normal HTTP cache (ETag / max-age) does the caching.
  async function get<T extends z.ZodType>(path: string, schema: T): Promise<z.infer<T>> {
    let res: Response;
    try {
      res = await fetch(root + path, { headers: { Accept: 'application/json, application/problem+json' }, signal: timeoutMs ? AbortSignal.timeout(timeoutMs) : undefined });
    } catch (e) {
      // A CORS block and a dead server look identical here: the browser hides the reason from JavaScript.
      throw new Error(`Network error calling ${path} (server down, or blocked by CORS): ${(e as Error).message}`);
    }
    if (!res.ok) {
      const p = res.headers.get('content-type')?.includes('json') ? S.ProblemJson.safeParse(await res.json().catch(() => null)) : null;
      throw p?.success ? new ApiError(p.data.status, p.data.title, p.data.detail) : new ApiError(res.status, res.statusText, path);
    }
    return parse(schema, await res.json(), path);
  }
  const q = encodeURIComponent;
  return {
    countries: async () => (await get('/v1/countries', S.CountryList)).items,
    country: (iso2) => get(`/v1/countries/${q(iso2)}`, S.CountryDetail),
    nearestSnapshot: (year) => get(`/v1/snapshots/nearest?year=${year}`, S.SnapshotNearest),
    snapshotLinks: (year) => get(`/v1/snapshots/${year}/links`, S.SnapshotLinks),
    polity: (id) => get(`/v1/polities/${q(id)}`, S.PolityDetail),
    search: async (text) => (await get(`/v1/search?q=${q(text)}`, S.SearchResults)).items,
    glossary: async () => (await get('/v1/glossary', S.GlossaryList)).items,
    leaders: async (iso2) => (await get(`/v1/countries/${q(iso2)}/leaders`, S.LeaderList)).items,
    people: (iso2, domain, limit) => {
      const p = new URLSearchParams();
      if (domain) p.set('domain', domain);
      if (limit) p.set('limit', String(limit));
      return get(`/v1/countries/${q(iso2)}/people${p.size ? `?${p}` : ''}`, S.PeopleList);
    },
  };
}
