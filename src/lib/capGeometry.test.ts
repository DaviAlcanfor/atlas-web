import { readFileSync } from 'node:fs';
import { geoBounds } from 'd3-geo';
import type { FeatureCollection, Geometry, Polygon } from 'geojson';
import { describe, expect, it } from 'vitest';
import { capGeometry, POLE_LAT, safePolygon } from './capGeometry';

// the rule three-conic-polygon-geometry uses to pick its slow spherical path
const slow = (p: Polygon) => {
  const [[minLng, minLat], [maxLng, maxLat]] = geoBounds(p);
  return minLng! > maxLng! || maxLat! >= 89 || minLat! <= -89;
};
const polysOf = (g: Geometry) => (g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : []);
// planar shoelace area, longitudes unwrapped per ring: splitting must not lose area
const area = (rings: number[][][]) => rings.reduce((s, r, k) => {
  let a = 0;
  for (let i = 1; i < r.length; i++) a += r[i - 1]![0]! * r[i]![1]! - r[i]![0]! * r[i - 1]![1]!;
  return s + (k === 0 ? Math.abs(a) : -Math.abs(a)) / 2;
}, 0);

describe('capGeometry', () => {
  it('splits a ring across the antimeridian into two in-range parts with the same area', () => {
    const ring = [[170, 60], [-170, 60], [-170, 70], [170, 70], [170, 60]];
    const parts = safePolygon([ring]);
    expect(parts).toHaveLength(2);
    for (const p of parts) for (const [x] of p[0]!) expect(Math.abs(x!)).toBeLessThanOrEqual(180);
    expect(parts.reduce((s, p) => s + area(p), 0)).toBeCloseTo(20 * 10, 6);
  });
  it('clamps polar latitudes and leaves ordinary polygons untouched (same object)', () => {
    const g: Geometry = { type: 'Polygon', coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]] };
    expect(capGeometry(g)).toBe(g);
    // Natural Earth's Antarctica: a ring of pole points + the coast going once around the globe
    const pole = [[-180, -90], [0, -90], [180, -90], [-180, -90]];
    const coast = [[-180, -70], [-90, -65], [0, -70], [90, -65], [180, -70]];
    const parts = safePolygon([pole, coast]);
    expect(parts).toHaveLength(2); // halves: neither goes around the pole
    for (const p of parts) expect(Math.min(...p[0]!.map((q) => q[1]!))).toBe(-POLE_LAT);
  });
  it('takes every real country cap off the slow path', () => {
    const fc = JSON.parse(readFileSync('public/data/modern.geojson', 'utf8')) as FeatureCollection;
    const before = fc.features.flatMap((f) => polysOf(f.geometry)).filter((c) => slow({ type: 'Polygon', coordinates: c }));
    expect(before.length).toBeGreaterThan(0); // Russia, Antarctica
    const after = fc.features.flatMap((f) => polysOf(capGeometry(f.geometry))).filter((c) => slow({ type: 'Polygon', coordinates: c }));
    expect(after).toEqual([]);
  });
});
