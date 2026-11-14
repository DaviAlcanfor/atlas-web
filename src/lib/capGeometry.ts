// Geometry handed to three-globe for the polygon CAPS only (picking keeps the original features).
//
// Why: three-globe triangulates each cap with three-conic-polygon-geometry. A polygon whose bounds cross the antimeridian or reach
// a pole takes its slow path: d3-geo's spherical geoContains (~0.5 ms each on Russia) for thousands of points. Profiled 2026-11-13:
// 14 of the ~20 s before the first frame were Russia's mainland + Antarctica. Here those shapes are made "planar-safe":
//  - longitudes are made continuous (unwrapped) and the shape is cut at +-180 deg, each piece shifted back into range;
//  - a ring that goes once around a pole (Antarctica's coast) is closed along the POLE_LAT parallel and cut in halves;
//    rings made only of pole points (Natural Earth's degenerate "pole line") are dropped. Leaves an invisible hole at the pole.
// Everything else is returned untouched (same object), so most countries cost nothing.
import type { Geometry, Position } from 'geojson';

export const POLE_LAT = 88.9;
type Ring = Position[];

const wraps = (ring: Ring) => ring.some((p, i) => i > 0 && Math.abs(p[0]! - ring[i - 1]![0]!) > 180);
const polar = (ring: Ring) => ring.some((p) => Math.abs(p[1]!) > POLE_LAT);

/** Same ring with longitudes made continuous (may go past +-180). */
function unwrap(ring: Ring): Ring {
  const out: Ring = [];
  let shift = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x, y] = ring[i]!;
    if (i > 0) {
      const d = x! + shift - out[i - 1]![0]!;
      if (d > 180) shift -= 360;
      else if (d < -180) shift += 360;
    }
    out.push([x! + shift, Math.max(-POLE_LAT, Math.min(POLE_LAT, y!))]);
  }
  return out;
}

/** Sutherland-Hodgman against one vertical half-plane (keep x <= at, or x >= at). Closed ring in, closed ring (or []) out. */
function clipX(ring: Ring, at: number, keepBelow: boolean): Ring {
  const inside = (p: Position) => (keepBelow ? p[0]! <= at : p[0]! >= at);
  const cross = (a: Position, b: Position): Position => [at, a[1]! + ((b[1]! - a[1]!) * (at - a[0]!)) / (b[0]! - a[0]!)];
  const out: Ring = [];
  for (let i = 0; i < ring.length - 1; i++) {
    const a = ring[i]!, b = ring[i + 1]!;
    if (inside(a)) {
      out.push(a);
      if (!inside(b)) out.push(cross(a, b));
    } else if (inside(b)) out.push(cross(a, b));
  }
  if (out.length) out.push(out[0]!);
  return out.length >= 4 ? out : [];
}

/** Both sides of the line x = at; holes are clipped into each side too. */
function cut(poly: Ring[], at: number): Ring[][] {
  return [true, false].flatMap((below) => {
    const outer = clipX(poly[0]!, at, below);
    return outer.length ? [[outer, ...poly.slice(1).map((h) => clipX(h, at, below)).filter((h) => h.length)]] : [];
  });
}

/** One polygon (rings) -> zero or more planar-safe polygons. The input array itself when nothing needs fixing. */
export function safePolygon(rings: Ring[]): Ring[][] {
  if (!rings.some((r) => wraps(r) || polar(r))) return [rings];
  const kept = rings.filter((r) => r.some((p) => Math.abs(p[1]!) < POLE_LAT));
  if (!kept.length) return [];
  let aroundPole = false;
  const planar = kept.map((r) => {
    const un = unwrap(r);
    if (Math.abs(un.at(-1)![0]! - un[0]![0]!) < 180) return un; // closes on itself: ordinary ring
    aroundPole = true; // goes once around the globe: close it along the parallel next to the pole it circles
    const lat = Math.sign(un.reduce((s, p) => s + p[1]!, 0)) * POLE_LAT;
    const open = un.slice(0, -1);
    // every 1 deg: on the sphere an edge is a great-circle arc, and one long edge along the parallel would pass over the pole
    const x0 = open.at(-1)![0]!, x1 = open[0]![0]!;
    const n = Math.ceil(Math.abs(x1 - x0));
    const parallel = Array.from({ length: n + 1 }, (_, i) => [x0 + ((x1 - x0) * i) / n, lat]);
    return [...open, ...parallel, open[0]!];
  });
  const xs = planar.flat().map((p) => p[0]!);
  const hi = Math.max(...xs), lo = Math.min(...xs);
  const lines = [...(hi > 180 ? [180] : []), ...(lo < -180 ? [-180] : []), ...(aroundPole ? [(hi + lo) / 2] : [])];
  let parts: Ring[][] = [planar];
  for (const at of lines) parts = parts.flatMap((p) => cut(p, at));
  return parts.map((p) => {
    const px = p[0]!.map((q) => q[0]!);
    const mid = (Math.max(...px) + Math.min(...px)) / 2;
    const dx = mid > 180 ? -360 : mid < -180 ? 360 : 0;
    return dx ? p.map((r) => r.map(([x, y]) => [x! + dx, y!])) : p;
  });
}

const cache = new WeakMap<Geometry, Geometry>();
const polarCaps = new WeakSet<Geometry>();

/** Curvature resolution (deg) for a cap. Shapes closed around a pole get a finer grid: in lng/lat space their triangles are
 * long and thin, and the coarse default lets triangles bridge a bay (Ross, Weddell) whose centroid falls outside -> dark wedges. */
export const capResolution = (g: Geometry) => (polarCaps.has(capGeometry(g)) ? 1 : 5);

/** Cap-safe version of a (Multi)Polygon; the input object itself when nothing needs fixing. Cached per geometry object. */
export function capGeometry(g: Geometry): Geometry {
  const hit = cache.get(g);
  if (hit) return hit;
  let out: Geometry = g;
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : null;
  if (polys) {
    const fixed = polys.map((p) => safePolygon(p as Ring[]));
    if (fixed.some((f, i) => f.length !== 1 || f[0] !== polys[i])) out = { type: 'MultiPolygon', coordinates: fixed.flat() };
    if (polys.some((p) => (p as Ring[]).some(polar))) polarCaps.add(out);
  }
  cache.set(g, out);
  return out;
}
