import { describe, expect, it } from 'vitest';
import type { FeatureCollection, Geometry } from 'geojson';
import { tintOf, toSnapshot, uniqueSegments, type HistProps } from './timeTravel';

const sq = (x: number): Geometry => ({ type: 'Polygon', coordinates: [[[x, 0], [x, 1], [x + 1, 1], [x + 1, 0], [x, 0]]] }); // clockwise: d3-geo's exterior
const p = (name_en: string): HistProps => ({ name: name_en, name_en, wikidata: null, from_year: 1, to_year: 2, member_of: null, wikipedia_url: null });

describe('time travel (spec 012)', () => {
  it('draws a border shared by two neighbours once', () => {
    expect(uniqueSegments([sq(0)])).toHaveLength(4);
    expect(uniqueSegments([sq(0), sq(1)])).toHaveLength(7); // 4 + 4 - the shared edge (opposite winding)
  });
  it('keeps one colour per entity', () => {
    expect(tintOf('Ottoman Empire')).toBe(tintOf('Ottoman Empire'));
    expect(tintOf('Ottoman Empire')).toMatch(/^#[0-9a-f]{6}$/);
  });
  it('turns a snapshot file into globe features keyed by the English name', () => {
    const fc: FeatureCollection<Geometry, HistProps> = { type: 'FeatureCollection', features: [
      { type: 'Feature', geometry: sq(0), properties: { ...p('Tibet'), name: 'Tibete' } },
      { type: 'Feature', geometry: sq(1), properties: p('Tibet') }, // duplicate id: dropped
      { type: 'Feature', geometry: sq(5), properties: p('Nepal') },
    ] };
    const s = toSnapshot(1914, fc);
    expect([...s.ids]).toEqual(['Tibet', 'Nepal']);
    expect(s.props.get('Tibet')?.name).toBe('Tibete');
    expect(s.features[0]!.properties).toMatchObject({ ISO2: null, NAME: 'Tibet', micro: false });
    expect(s.features[0]!.properties.lat).toBeCloseTo(0.5, 1);
  });
});
