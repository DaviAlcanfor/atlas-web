import { describe, expect, it } from 'vitest';
import { toChatEvent } from '../api/chat';
import { cleanMap, parseCommand, suggestions } from './chatModes';

describe('parseCommand', () => {
  it('picks the mode and strips the command', () => {
    expect(parseCommand('/learn o que é um regime?')).toEqual({ mode: 'learn', text: 'o que é um regime?' });
    expect(parseCommand('  /Analyse   Brasil x Chile')).toEqual({ mode: 'analyse', text: 'Brasil x Chile' });
    expect(parseCommand('/tell')).toEqual({ mode: 'tell', text: '' });
  });
  it('ignores commands that are not at the start or unknown', () => {
    expect(parseCommand('explique /learn')).toEqual({ mode: null, text: 'explique /learn' });
    expect(parseCommand('/learning x')).toEqual({ mode: null, text: '/learning x' });
    expect(parseCommand('/foo')).toEqual({ mode: null, text: '/foo' });
  });
});

describe('suggestions', () => {
  it('gives 3 questions per kind of screen', () => {
    const base = { country: null, layer: 'content' as const, year: null };
    for (const s of [base, { ...base, country: 'Brasil' }, { ...base, layer: 'regime' as const }, { ...base, layer: 'ranking' as const }, { ...base, year: 1815 }])
      expect(suggestions(s)).toHaveLength(3);
    expect(suggestions({ ...base, country: 'Brasil' })[0]).toContain('Brasil');
    expect(suggestions({ ...base, year: -300 })[0]).toContain('300 a.C.');
  });
  it('time travel wins over country and layer', () => {
    expect(suggestions({ country: 'Brasil', layer: 'regime', year: 1914 })[0]).toContain('1914');
  });
});

describe('map event', () => {
  const ev = (o: unknown) => toChatEvent({ event: 'map', data: JSON.stringify(o) });
  it('parses a valid event', () => {
    expect(ev({ iso2: ['br', 'JP'], layer: 'regime', year: 1914 })).toEqual({ type: 'map', iso2: ['BR', 'JP'], layer: 'regime', year: 1914 });
  });
  it('drops invalid values silently, keeping the valid ones', () => {
    expect(ev({ iso2: ['BR', 'XYZ', 7, 'BR'], layer: 'nope', year: 0 })).toEqual({ type: 'map', iso2: ['BR'] });
    expect(ev({ iso2: [], layer: 'flags', year: 1.5 })).toEqual({ type: 'map', iso2: [], layer: 'flags' });
  });
  it('ignores events with nothing valid or malformed', () => {
    expect(ev({ iso2: ['??'], layer: 'x', year: 999999 })).toBeNull();
    expect(ev({ layer: 'regime' })).toBeNull();
    expect(toChatEvent({ event: 'map', data: 'not json' })).toBeNull();
  });
  it('cleanMap filters countries the app does not know', () => {
    expect(cleanMap({ iso2: ['BR', 'ZZ'] }, new Set(['BR']))).toEqual({ iso2: ['BR'] });
    expect(cleanMap({ iso2: ['ZZ'] }, new Set(['BR']))).toBeNull();
  });
});
