import { describe, expect, it } from 'vitest';
import { eraOf, ERAS, LAND } from './eras';

describe('map style by period (spec 012)', () => {
  it('picks the period of a year, bounds inclusive', () => {
    expect([-3400, 1499, 1500, 1799, 1800, 1944, 1945, 1990, 1991, 2024].map((y) => eraOf(y).id)).toEqual(
      ['manuscript', 'manuscript', 'nautical', 'nautical', 'atlas', 'atlas', 'coldwar', 'coldwar', 'signal', 'signal']);
  });
  it('periods do not overlap and every one has its own land mode', () => {
    for (let i = 1; i < ERAS.length; i++) expect(ERAS[i]!.from).toBe(ERAS[i - 1]!.to! + 1);
    expect(new Set(ERAS.map((e) => e.land)).size).toBe(ERAS.length);
    expect(ERAS.every((e) => e.land !== LAND.dots)).toBe(true);
  });
});
