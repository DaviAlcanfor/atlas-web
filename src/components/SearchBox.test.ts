import { describe, expect, it } from 'vitest';
import { rank } from './SearchBox';

const items = ['Brasil', 'Belarus', 'Estados Unidos', 'Áustria', 'Coreia do Sul', 'Burundi'].map((name) => ({ id: name, name }));

describe('search ranking', () => {
  it('ignores accents and case, prefix first', () => {
    expect(rank(items, 'aus').map((i) => i.id)).toEqual(['Áustria']);
    expect(rank(items, 'B').map((i) => i.id)).toEqual(['Belarus', 'Brasil', 'Burundi']);
  });
  it('then word starts, then anywhere', () => {
    expect(rank(items, 'su').map((i) => i.id)).toEqual(['Coreia do Sul']);
    expect(rank(items, 'ru').map((i) => i.id)).toEqual(['Belarus', 'Burundi']);
    expect(rank(items, '  ')).toEqual([]);
  });
});
