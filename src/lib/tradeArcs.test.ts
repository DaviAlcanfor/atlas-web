import { describe, expect, it } from 'vitest';
import { tradeArcLines } from './tradeArcs';

const names: Record<string, string> = { CN: 'China', US: 'Estados Unidos', AR: 'Argentina' };

describe('tradeArcLines (spec 040)', () => {
  it('names the line, picks the arrow by direction and ranks by combined value', () => {
    const l = tradeArcLines(
      [{ iso2: 'CN', value_usd: 90e9 }, { iso2: 'US', value_usd: 40e9 }],
      [{ iso2: 'US', value_usd: 45e9 }, { iso2: 'AR', value_usd: 5e9 }],
      'Brasil', (i) => names[i], 2);
    expect(l.map((x) => x.iso)).toEqual(['CN', 'US']);
    expect(l[0]).toEqual({ iso: 'CN', label: 'Brasil → China', detail: 'exporta US$ 90 bi' });
    expect(l[1]!.label).toBe('Brasil ⇄ Estados Unidos');
    expect(l[1]!.detail).toBe('exporta US$ 40 bi · importa US$ 45 bi');
  });
  it('falls back to the iso code and marks import-only', () => {
    expect(tradeArcLines([], [{ iso2: 'ZZ', value_usd: 2e6 }], 'Brasil', () => undefined)[0]!.label).toBe('Brasil ← ZZ');
  });
});
