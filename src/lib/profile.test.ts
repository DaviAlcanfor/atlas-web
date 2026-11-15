import { describe, expect, it } from 'vitest';
import { economySummary } from './profile';

const i = (id: string, value: number, year = 2025) => ({ id, value, year });

describe('economySummary (spec 029)', () => {
  it('names the biggest export share, and says "mais da metade" only from 50%', () => {
    expect(economySummary([i('TX.VAL.FOOD.ZS.UN', 41), i('TX.VAL.MANF.ZS.UN', 24)]))
      .toBe('A maior fatia das exportações de mercadorias é de alimentos (41% em 2025).');
    expect(economySummary([i('TX.VAL.FUEL.ZS.UN', 79), i('NY.GDP.PETR.RT.ZS', 24, 2021)]))
      .toBe('Mais da metade das exportações de mercadorias é de combustíveis (79% em 2025). O petróleo rende 24% do PIB (2021).');
  });
  it('adds high tech above 25% of manufactured exports; nothing without export data', () => {
    expect(economySummary([i('TX.VAL.MANF.ZS.UN', 88), i('TX.VAL.TECH.MF.ZS', 36, 2024), i('NY.GDP.PETR.RT.ZS', 0, 2021)]))
      .toBe('Mais da metade das exportações de mercadorias é de manufaturados (88% em 2025). 36% das exportações de manufaturados são de alta tecnologia (2024).');
    expect(economySummary([i('NV.SRV.TOTL.ZS', 60)])).toBeNull();
  });
});
