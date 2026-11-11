import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, ContractError, createClient } from '../src/api/client';
import { createMockApi } from '../src/api/mocks/adapter';
import { COUNTRIES, POLITIES } from '../src/api/mocks/fixtures';
import * as S from '../src/api/schemas';

describe('schemas', () => {
  it('accept every fixture (the mocks conform to the contract)', async () => {
    const api = createMockApi(0);
    expect((await api.countries()).length).toBeGreaterThan(5);
    for (const c of COUNTRIES) await expect(api.country(c.iso2)).resolves.toBeTruthy();
    for (const p of POLITIES) await expect(api.polity(p.id)).resolves.toBeTruthy();
    for (const y of [1815, 1914, 1945]) await expect(api.snapshotLinks(y)).resolves.toBeTruthy();
  });
  it('reject a response that breaks the contract, with a readable path', () => {
    const bad = { ...COUNTRIES[0], population: { value: 'many', year: null, source_id: 'x' } };
    const r = S.CountryDetail.safeParse(bad);
    expect(r.success).toBe(false);
    expect(r.error!.issues[0]!.path.join('.')).toBe('population.value');
  });
  it('reject year 0 and a missing required field', () => {
    expect(S.Year.safeParse(0).success).toBe(false);
    const { name: _n, ...noName } = COUNTRIES[0]!;
    expect(S.CountryDetail.safeParse(noName).success).toBe(false);
  });
});

describe('mock adapter', () => {
  const api = createMockApi(0);
  it('nearest snapshot reports distance_years', async () => {
    const n = await api.nearestSnapshot(1683);
    expect(n.snapshot.year).toBe(1815);
    expect(n.distance_years).toBe(132);
  });
  it('unknown ids are 404 ApiErrors', async () => {
    await expect(api.country('ZZ')).rejects.toBeInstanceOf(ApiError);
    await expect(api.snapshotLinks(1700)).rejects.toMatchObject({ status: 404 });
  });
  it('search is accent-insensitive', async () => {
    expect((await api.search('otoman')).map((i) => i.id)).toContain('ottoman-empire');
    expect((await api.search('austria')).length).toBeGreaterThan(0);
  });
});

describe('real client', () => {
  afterEach(() => vi.unstubAllGlobals());
  const stub = (res: Response) => vi.stubGlobal('fetch', vi.fn().mockResolvedValue(res));
  it('turns problem+json into ApiError', async () => {
    stub(new Response(JSON.stringify({ type: 'about:blank', title: 'Not Found', status: 404, detail: 'Unknown country ZZ' }),
      { status: 404, headers: { 'content-type': 'application/problem+json' } }));
    await expect(createClient('http://x').country('ZZ')).rejects.toMatchObject({ status: 404, title: 'Not Found' });
  });
  it('fails loudly with ContractError when a 200 has the wrong shape', async () => {
    stub(new Response(JSON.stringify({ items: [{ iso2: 'AT' }] }), { status: 200, headers: { 'content-type': 'application/json' } }));
    await expect(createClient('http://x').countries()).rejects.toBeInstanceOf(ContractError);
  });
  it('explains network/CORS failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(createClient('http://x').countries()).rejects.toThrow(/CORS/);
  });
});

describe('CountryPanel', () => {
  it('shows data, "no data" for missing fields, and escapes API text', async () => {
    const { CountryPanel } = await import('../src/components/CountryPanel');
    render(<CountryPanel iso2="RS" name="Sérvia" inApi onClose={() => {}} />);
    expect(await screen.findByText('Belgrado')).toBeTruthy();
    expect(screen.getAllByText('no data').length).toBeGreaterThan(3); // regime, languages, population...
  });
  it('says "No data yet" without calling the API when the country is not in the API', async () => {
    const { CountryPanel } = await import('../src/components/CountryPanel');
    render(<CountryPanel iso2="XX" name="Somaliland" inApi={false} onClose={() => {}} />);
    expect(screen.getByText('No data yet for this country.')).toBeTruthy();
  });
  it('flags events without a source as unverified', async () => {
    const { CountryPanel } = await import('../src/components/CountryPanel');
    render(<CountryPanel iso2="AT" name="Austria" inApi onClose={() => {}} />);
    expect(await screen.findByText(/Unverified/)).toBeTruthy();
    expect(screen.getAllByText('no source').length).toBe(5);
  });
});
