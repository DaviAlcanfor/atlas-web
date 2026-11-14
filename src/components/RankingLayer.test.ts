import { describe, expect, it } from 'vitest';
import { rankRamp } from '../lib/palette';
import { bucketOf, rankColors } from './RankingLayer';

describe('ranking layer (spec 027)', () => {
  it('puts rank 1 in the brightest bucket and the last rank in the darkest', () => {
    expect(bucketOf(1, 190)).toBe(rankRamp.length - 1);
    expect(bucketOf(190, 190)).toBe(0);
    const counts = Array.from({ length: 190 }, (_, i) => bucketOf(i + 1, 190)).reduce((m, b) => m.set(b, (m.get(b) ?? 0) + 1), new Map<number, number>());
    expect([...counts.values()].every((c) => c >= 26 && c <= 29)).toBe(true); // septiles
  });
  it('maps every ranked country to a ramp colour', () => {
    const items = ['NO', 'JP', 'BR'].map((iso2, i) => ({ iso2, value: 1 - i / 10, year: 2023, rank: i + 1 }));
    const c = rankColors({ id: 'x', label: 'x', unit: '0-1', items, sources: [] });
    expect(c.get('NO')).toBe(rankRamp.at(-1));
    expect(c.get('BR')).toBe(rankRamp[0]);
  });
});
