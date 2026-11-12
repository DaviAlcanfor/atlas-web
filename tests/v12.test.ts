import { describe, expect, it } from 'vitest';
import { convert, defaultVs, fmtEconomy, isWeekly, normalizeBase100, parseCmp, parseVs, signedPct, windowFrom } from '../src/lib/currency';
import { formatIndicator, indicatorTip, rankText, rulerPos, topSlices } from '../src/lib/profile';
import { createMockApi } from '../src/api/mocks/adapter';

describe('profile helpers', () => {
  it('rank wording: 1 = highest value; "bad" indicators count from the lowest', () => {
    expect(rankText('SP.DYN.LE00.IN', 34, 190)).toBe('34º de 190');
    expect(rankText('VC.IHR.PSRC.P5', 173, 177)).toBe('5º menor de 177'); // JP homicides: one of the lowest
    expect(rankText('SP.DYN.LE00.IN', null, null)).toBeNull();
  });
  it('formats units', () => {
    expect(formatIndicator({ id: 'x', unit: '% da população', value: 88.1773 })).toEqual({ text: '88,2%', note: 'da população' });
    expect(formatIndicator({ id: 'HDR.HDI', unit: '0-1', value: 0.76 }).text).toBe('0,760');
    expect(formatIndicator({ id: 'NY.GDP.PCAP.PP.CD', unit: 'US$ internacionais correntes', value: 23433.3 }).text).toBe('US$ 23.433');
  });
  it('ruler position is clamped', () => {
    expect(rulerPos(5, { min: 0, max: 10 })).toBe(0.5);
    expect(rulerPos(20, { min: 0, max: 10 })).toBe(1);
    expect(rulerPos(1, { min: 3, max: 3 })).toBe(0.5);
  });
  it('tooltip lists only what exists', () => {
    const tip = indicatorTip({ id: 'SP.DYN.LE00.IN', label: '', unit: 'anos', value: 76, year: 2024, source_id: 'wb', rank: 79, rank_of: 195, world: null, region_avg: 75.5 });
    expect(tip).toContain('79º de 195');
    expect(tip).toContain('75,5');
    expect(tip).not.toContain('Mediana');
  });
  it('composition: fractions, top 5 + outros', () => {
    const s = topSlices([0.3, 0.2, 0.1, 0.1, 0.05, 0.05, 0.02].map((share, i) => ({ label: `g${i}`, share })));
    expect(s).toHaveLength(6);
    expect(s[5]!.label).toBe('outros');
    expect(s[5]!.share).toBeCloseTo(0.07, 5);
    expect(topSlices([{ label: 'a', share: 0.999 }])).toHaveLength(1);
  });
});

describe('currency helpers', () => {
  it('percent from fractions', () => {
    expect(signedPct(-0.0485)).toBe('-4,9%');
    expect(signedPct(0.12)).toBe('+12,0%');
    expect(signedPct(null)).toBeNull();
  });
  it('base 100 at the first available date, no interpolation', () => {
    const items: { date: string; rates: Record<string, number> }[] = [
      { date: '2025-01-01', rates: { USD: 0.2, EUR: 0.1 } },
      { date: '2025-01-02', rates: { USD: 0.1 } }, // EUR missing: no point
      { date: '2025-01-03', rates: { USD: 0.3, EUR: 0.2 } },
    ];
    const [usd, eur] = normalizeBase100(items, ['USD', 'EUR', 'XXX']);
    expect(usd!.points.map((p) => Math.round(p.v))).toEqual([100, 50, 150]);
    expect(eur!.points.map((p) => p.v)).toEqual([100, 200]);
    expect(normalizeBase100(items, ['XXX'])).toEqual([]);
    expect(normalizeBase100(items, ['USD'], '2025-01-02')[0]!.points[0]!.v).toBe(100); // re-based at the window start
  });
  it('weekly history is detected; windows', () => {
    const daily = ['2025-01-01', '2025-01-02', '2025-01-03', '2025-01-06'].map((date) => ({ date }));
    const weekly = ['2020-01-03', '2020-01-10', '2020-01-17', '2020-01-24'].map((date) => ({ date }));
    expect(isWeekly(daily)).toBe(false);
    expect(isWeekly(weekly)).toBe(true);
    expect(windowFrom('2026-11-11', '1a')).toBe('2025-11-11');
    expect(windowFrom('2026-11-11', '5a')).toBe('2021-11-11');
    expect(windowFrom('2026-11-11', 'max')).toBeNull();
  });
  it('converter both ways through the base', () => {
    const rates = { USD: 0.2, EUR: 0.1 };
    expect(convert(100, 'BRL', 'USD', 'BRL', rates)).toBeCloseTo(20);
    expect(convert(20, 'USD', 'BRL', 'BRL', rates)).toBeCloseTo(100);
    expect(convert(20, 'USD', 'EUR', 'BRL', rates)).toBeCloseTo(10);
    expect(convert(1, 'BRL', 'XXX', 'BRL', rates)).toBeNull();
  });
  it('url params', () => {
    expect(parseVs('usd,EUR,brl,usd,xx,JPY,GBP,CHF', 'BRL')).toEqual(['USD', 'EUR', 'JPY', 'GBP']);
    expect(parseCmp('ar,mx,AR,ar1,BR', 'BR')).toEqual(['AR', 'MX']);
    expect(defaultVs('BRL')).toEqual(['USD', 'EUR']);
    expect(fmtEconomy('US$ correntes', 2.28e12)).toBe('US$ 2,28 tri');
  });
});

describe('v1.2 mocks', () => {
  const api = createMockApi(0);
  it('serve the real samples through the zod schemas', async () => {
    const p = await api.profile('BR');
    expect(p.groups.map((g) => g.id)).toEqual(['life', 'society', 'income', 'environment']);
    expect((await api.economy('BR')).indicators).toHaveLength(10);
    expect((await api.currency('BRL')).stats?.change_1y).toBeLessThan(0);
    const h = await api.currencyHistory('BRL', ['USD', 'EUR']);
    expect(h.items.length).toBeGreaterThan(200);
    const c = await api.compareEconomy(['BR', 'JP']);
    expect(c.indicators[0]!.values.JP).not.toBeNull();
    await expect(api.profile('ZZ')).rejects.toThrow();
  });
});

import { languageTip, sortLanguages, statusesIn } from '../src/lib/languages';
describe('languages', () => {
  it('orders by status, builds hover text and legend', async () => {
    const br = (await createMockApi(0).country('BR')).languages_spoken!;
    const shuffled = [...br].reverse();
    expect(sortLanguages(shuffled)[0]!.status).toBe('official');
    expect(statusesIn(br)).toEqual(['official', 'co_official', 'indigenous', 'immigrant', 'sign', 'historical']);
    const nheengatu = br.find((l) => l.name === 'nheengatu')!;
    expect(languageTip(nheengatu)).toContain('Onde: São Gabriel da Cachoeira');
    expect(languageTip({ ...nheengatu, speakers: { value: 12000, year: 2010 } })).toContain('Falantes: 12.000 (2010)');
  });
});
