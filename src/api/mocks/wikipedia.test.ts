import { describe, expect, it } from 'vitest';
import { createMockApi } from './adapter';

describe('entityWikipedia (mock)', () => {
  it('returns the summary with its attribution, and null without an article', async () => {
    const api = createMockApi();
    const w = await api.entityWikipedia('Q12560');
    expect(w?.attribution).toContain('CC BY-SA 4.0');
    expect(w?.license_url).toMatch(/^https:/);
    expect(await api.entityWikipedia('Q0')).toBeNull();
  });
});
