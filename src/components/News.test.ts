import { describe, expect, it } from 'vitest';
import { ago } from './News';

describe('news (spec 008)', () => {
  it('says how long ago, in pt-BR', () => {
    const now = Date.parse('2026-11-14T12:00:00Z');
    expect(ago('2026-11-14T11:35:00Z', now)).toBe('há 25 min');
    expect(ago('2026-11-14T09:00:00Z', now)).toBe('há 3 h');
    expect(ago('2026-11-10T12:00:00Z', now)).toBe('há 4 dias');
    expect(ago('2026-11-14T12:05:00Z', now)).toBe('há 0 min'); // clock skew never goes negative
  });
});
