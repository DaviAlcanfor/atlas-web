import { describe, expect, it } from 'vitest';
import type { MultiPolygon } from 'geojson';
import type { Vector4 } from 'three';
import { boxGap, flagBox, MAX_BOXES } from './flagMaterial';

// a 1x1 degree island with its south-west corner at (lng, lat); exterior ring clockwise, as d3-geo expects (the other way round it
// is the whole sphere minus the square)
const sq = (lng: number, lat: number) => [[[lng, lat], [lng, lat + 1], [lng + 1, lat + 1], [lng + 1, lat], [lng, lat]]];
const mp = (...rings: number[][][][]): MultiPolygon => ({ type: 'MultiPolygon', coordinates: rings });
const real = (b: Vector4[]) => b.filter((v) => v.y !== 200); // drop the NO_BOX padding

describe('flagBox: one flag per group of nearby islands', () => {
  it('islands 1 degree apart share one box spanning both (an archipelago)', () => {
    const b = real(flagBox(mp(sq(100, 0), sq(102, 0)))!);
    expect(b).toHaveLength(1);
    expect(b[0]!.x).toBeCloseTo(100);
    expect(b[0]!.z).toBeCloseTo(3); // 100..103
  });
  it('a far part gets its own box, the larger group first; always MAX_BOXES slots', () => {
    const all = flagBox(mp(sq(10, 0), sq(40, 0), sq(41, 0)))!;
    expect(all).toHaveLength(MAX_BOXES);
    const b = real(all);
    expect(b).toHaveLength(2);
    expect(b[0]!.x).toBeCloseTo(40); // the two-island group is larger
    expect(b[1]!.x).toBeCloseTo(10);
  });
  it('measures longitude gaps the short way across the antimeridian', () => {
    expect(boxGap({ w: 179, s: 0, n: 1, span: 0.5 }, { w: -179.5, s: 0, n: 1, span: 1 })).toBeCloseTo(1); // 179.5 -> 180.5
  });
});
