import { describe, expect, it } from 'vitest';
import { formatYear } from '../src/lib/years';
import { nearestYear } from '../src/lib/snapshots';
import { mergeCountries } from '../src/lib/merge';
import type { CountryFeature } from '../src/types';
import type { CountrySummary } from '../src/api/types';

describe('formatYear', () => {
  it('formats BCE and CE', () => {
    expect(formatYear(-300)).toBe('300 a.C.');
    expect(formatYear(-1)).toBe('1 a.C.');
    expect(formatYear(1)).toBe('1');
    expect(formatYear(1815)).toBe('1815');
  });
  it('formats precision', () => {
    expect(formatYear(1299, 'circa')).toBe('c. 1299');
    expect(formatYear(-2560, 'circa')).toBe('c. 2560 a.C.');
    expect(formatYear(1294, 'decade')).toBe('década de 1290');
    expect(formatYear(1401, 'century')).toBe('século XV');
    expect(formatYear(1400, 'century')).toBe('século XIV');
    expect(formatYear(-250, 'century')).toBe('século III a.C.');
  });
  it('rejects year 0 and non-integers', () => {
    expect(() => formatYear(0)).toThrow(RangeError);
    expect(() => formatYear(1.5)).toThrow(RangeError);
  });
});

describe('nearestYear', () => {
  const ys = [1815, 1914, 1945];
  it('picks the closest and reports distance', () => {
    expect(nearestYear(ys, 1683)).toEqual({ year: 1815, distance: 132 });
    expect(nearestYear(ys, 1930)).toEqual({ year: 1945, distance: 15 });
    expect(nearestYear(ys, 1914)).toEqual({ year: 1914, distance: 0 });
  });
  it('breaks ties toward the earlier snapshot and handles empty', () => {
    expect(nearestYear([1900, 1920], 1910)).toEqual({ year: 1900, distance: 10 });
    expect(nearestYear([], 1900)).toBeNull();
  });
});

describe('mergeCountries', () => {
  const feat = (ISO2: string | null, NAME: string): CountryFeature => ({
    type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: { ISO2, NAME, micro: false, lat: 1, lng: 2 },
  });
  const country = (iso2: string, over: Partial<CountrySummary> = {}): CountrySummary => ({
    iso2, polity_id: iso2.toLowerCase(), name: iso2, capital: null, region: null, regime: null, has_content: false, marker: null, ...over,
  });
  it('derives content ids, regimes and micro-state markers without touching polygons', () => {
    const features = [feat('AT', 'Austria'), feat('MC', 'Monaco'), feat(null, 'Somaliland')];
    const r = mergeCountries(features, [
      country('AT', { has_content: true, regime: 'Republic' }),
      country('MC', { marker: { lat: 43.7, lng: 7.4 } }),
    ]);
    expect([...r.contentIds]).toEqual(['AT']);
    expect(r.regimes.get('AT')).toBe('Republic');
    expect(r.features[1]!.properties).toMatchObject({ micro: true, lat: 43.7, lng: 7.4 });
    expect(r.features[0]!.properties.micro).toBe(false);
    expect(r.features[2]!.properties.micro).toBe(false);
    expect(r.features[1]!.geometry).toBe(features[1]!.geometry);
    expect(features[1]!.properties.micro).toBe(false); // input not mutated
  });
});

describe('parseCoverage (spec 021)', () => {
  it('reads the three markup levels and strips refs and links', async () => {
    const { parseCoverage } = await import('../scripts/streetview-parse');
    const wt = `x\n===Current coverage===\n{|\n|-\n! Country !! Continent\n|-\n|'''Albania'''*<ref name="a">{{cite web|url=x}}</ref>|| Europe ||\n|-\n|'''Afghanistan'''<ref>r</ref>\n|Asia\n|-\n| [[Narnia|Narnia land]] || Asia ||\n|-\n| '''Vietnam*'''<ref name=v/>|| Asia ||\n|}\n=== Future coverage ===`;
    expect(parseCoverage(wt)).toEqual([['Albania', 'full'], ['Afghanistan', 'partial'], ['Narnia land', 'limited'], ['Vietnam', 'full']]);
  });
});
