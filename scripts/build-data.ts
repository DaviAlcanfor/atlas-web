// Build-time ETL: world-atlas (Natural Earth 50m) -> static JSON in public/data/; Natural Earth 10m admin-1 -> public/data/admin1/.
// Run with: npm run data
import { existsSync, readFileSync, rmSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { feature, mesh } from 'topojson-client';
import { geoArea, geoCentroid } from 'd3-geo';
import countries from 'i18n-iso-countries';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { Feature, Geometry } from 'geojson';

const require = createRequire(import.meta.url);
const topo = JSON.parse(readFileSync(require.resolve('world-atlas/countries-50m.json'), 'utf8')) as Topology;
const obj = topo.objects.countries as GeometryCollection;

// Natural Earth ids are ISO numeric; a few disputed places have none.
const NAME_TO_ISO2: Record<string, string> = { Kosovo: 'XK' }; // XK = unofficial, used by EU/World Bank

// three-globe makes one mesh (= one draw call) per sub-polygon, so ~1000 tiny islands cost real frame time.
// Drop sub-polygons smaller than this (steradians; 1e-5 ~ 400 km2) unless it is the country's biggest part.
// Coastline paths (lines.json) keep every island, so islands still show as outlines.
const MIN_PART_SR = 1e-5;
function pruneParts(g: Geometry): Geometry {
  if (g.type !== 'MultiPolygon') return g;
  const parts = g.coordinates.map((c) => ({ c, a: geoArea({ type: 'Polygon', coordinates: c }) }));
  const biggest = Math.max(...parts.map((p) => p.a));
  return { type: 'MultiPolygon', coordinates: parts.filter((p) => p.a >= MIN_PART_SR || p.a === biggest).map((p) => p.c) };
}

const round = (_k: string, v: unknown) => (typeof v === 'number' ? Math.round(v * 100) / 100 : v);

const fc = feature(topo, obj);
// If two polygons resolve to the same ISO2 (e.g. an Australian islet), only the largest keeps it.
const iso2Of = (f: (typeof fc.features)[number]) =>
  (f.id != null ? countries.numericToAlpha2(String(f.id)) : undefined) ?? NAME_TO_ISO2[String((f.properties as { name: string }).name)] ?? null;
const biggest = new Map<string, number>();
for (const f of fc.features) {
  const c = iso2Of(f);
  if (c) biggest.set(c, Math.max(biggest.get(c) ?? 0, geoArea(f)));
}
const features = fc.features.map((f) => {
  const name = String((f.properties as { name: string }).name);
  const c = iso2Of(f);
  const iso2 = c && geoArea(f) === biggest.get(c) ? c : null;
  const [lng, lat] = geoCentroid(f);
  return {
    type: 'Feature',
    properties: { ISO2: iso2, NAME: name, lat, lng }, // micro-state markers come from the API (CountrySummary.marker), see src/lib/merge.ts
    geometry: pruneParts(f.geometry),
  } as Feature<Geometry>;
});

mkdirSync('public/data', { recursive: true });
writeFileSync('public/data/modern.geojson', JSON.stringify({ type: 'FeatureCollection', features }, round));

// Border lines: shared arcs (a !== b) vs exterior arcs (a === b = coastline). Drawn as paths, not polygon strokes,
// so that coastlines and land borders can have different colors.
const lines = (g: ReturnType<typeof mesh>) => g.coordinates as number[][][];
writeFileSync(
  'public/data/lines.json',
  JSON.stringify({ borders: lines(mesh(topo, obj, (a, b) => a !== b)), coast: lines(mesh(topo, obj, (a, b) => a === b)) }, round),
);

const kb = (p: string) => (statSync(p).size / 1024).toFixed(0) + ' KB';
console.log('modern.geojson', kb('public/data/modern.geojson'), '| lines.json', kb('public/data/lines.json'));
console.log('polygon parts:', features.reduce((n, f) => n + (f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates.length : 1), 0));
console.log('features:', features.length, '| no ISO2:', features.filter((f) => !f.properties!.ISO2).map((f) => f.properties!.NAME).join(', '));

// ---- Admin-1 (states/provinces), spec 005. Natural Earth 10m, public domain. ----
// The raw download (~40 MB) is cached in .cache/ (gitignored); output is one small file per country, loaded on select.
// Each file: MultiPolygon features { name, wikidataid } (hover picking) + one MultiLineString feature = internal borders only.
const NE_ADMIN1 = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_10m_admin_1_states_provinces.geojson';
const CACHE = '.cache/natural-earth/ne_10m_admin_1_states_provinces.geojson';
async function loadAdmin1(): Promise<Feature<Geometry | null, Record<string, unknown>>[]> {
  if (!existsSync(CACHE)) {
    console.log('downloading', NE_ADMIN1);
    const r = await fetch(NE_ADMIN1);
    if (!r.ok) throw new Error(`admin-1 download: HTTP ${r.status}`);
    mkdirSync('.cache/natural-earth', { recursive: true });
    writeFileSync(CACHE, Buffer.from(await r.arrayBuffer()));
  }
  return JSON.parse(readFileSync(CACHE, 'utf8')).features;
}

// Douglas-Peucker in plain lng/lat degrees (fine at this tolerance: drawn as thin lines and used for picking only).
const TOL = 0.03; // degrees (~3 km), drawn lines
const TOL_PICK = 0.08; // polygons are only used for hover picking, so coarser (keeps Russia < 200 KB)
function simplify(pts: number[][], tol = TOL): number[][] {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack: [number, number][] = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    const [ax, ay] = pts[a]!, [bx, by] = pts[b]!;
    const dx = bx! - ax!, dy = by! - ay!, len = Math.hypot(dx, dy);
    let max = 0, idx = -1;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = pts[i]!;
      const d = len ? Math.abs(dy * (px! - ax!) - dx * (py! - ay!)) / len : Math.hypot(px! - ax!, py! - ay!);
      if (d > max) [max, idx] = [d, i];
    }
    if (max > tol) {
      keep[idx] = 1;
      stack.push([a, idx], [idx, b]);
    }
  }
  return pts.filter((_, i) => keep[i]);
}

// Internal borders = edges shared by two different states. NE admin-1 is topologically clean (neighbours share exact
// vertices), so edges match by coordinates. Shared edges are then chained into polylines (simplified like the polygons).
function internalBorders(polysPerFeature: number[][][][][]): number[][][] {
  const owners = new Map<string, number>(); // edge key -> first feature index, or -1 once a second feature uses it
  const ekey = (a: string, b: string) => (a < b ? a + '|' + b : b + '|' + a);
  polysPerFeature.forEach((polys, i) => {
    for (const ring of polys.flat()) {
      for (let k = 1; k < ring.length; k++) {
        const key = ekey(ring[k - 1]!.join(), ring[k]!.join());
        const o = owners.get(key);
        owners.set(key, o === undefined ? i : o === i ? i : -1);
      }
    }
  });
  const adj = new Map<string, string[]>();
  for (const [key, o] of owners) {
    if (o !== -1) continue;
    const [a, b] = key.split('|') as [string, string];
    adj.set(a, [...(adj.get(a) ?? []), b]);
    adj.set(b, [...(adj.get(b) ?? []), a]);
  }
  const used = new Set<string>();
  const walk = (start: string, next: string) => {
    const line = [start];
    let [prev, cur] = [start, next];
    used.add(ekey(prev, cur));
    for (;;) {
      line.push(cur);
      const nb = adj.get(cur)!;
      if (nb.length !== 2) break; // junction of 3+ states, or dead end
      const n = nb[0] === prev ? nb[1]! : nb[0]!;
      if (used.has(ekey(cur, n))) break; // closed loop
      used.add(ekey(cur, n));
      [prev, cur] = [cur, n];
    }
    return line.map((p) => p.split(',').map(Number));
  };
  const out: number[][][] = [];
  // ends/junctions first, then the remaining closed loops (an enclave fully inside one neighbour)
  for (const pass of [(n: string[]) => n.length !== 2, () => true]) {
    for (const [v, nb] of adj) {
      if (!pass(nb)) continue;
      for (const n of nb) if (!used.has(ekey(v, n))) out.push(simplify(walk(v, n)));
    }
  }
  return out;
}

async function buildAdmin1() {
  const byIso = new Map<string, { name: string; wikidataid: unknown; polys: number[][][][] }[]>();
  for (const f of await loadAdmin1()) {
    const p = f.properties, g = f.geometry;
    const iso2 = String(p.iso_a2);
    if (!/^[A-Z]{2}$/.test(iso2) || !g) continue; // -1 = disputed/special areas without an ISO code
    const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
    const list = byIso.get(iso2) ?? [];
    list.push({ name: String(p.name_pt || p.name || ''), wikidataid: p.wikidataid ?? null, polys });
    byIso.set(iso2, list);
  }
  rmSync('public/data/admin1', { recursive: true, force: true });
  mkdirSync('public/data/admin1', { recursive: true });
  const sizes: [string, number][] = [];
  for (const [iso2, states] of byIso) {
    const features: Feature[] = [];
    for (const s of states) {
      const polys = s.polys.map((p) => p.map((r) => simplify(r, TOL_PICK)).filter((r) => r.length >= 4)).filter((p) => p.length > 0);
      if (!polys.length) continue;
      let geometry: Geometry = { type: 'MultiPolygon', coordinates: polys };
      if (geoArea(geometry) > 2 * Math.PI) geometry = { type: 'MultiPolygon', coordinates: polys.map((q) => q.map((r) => [...r].reverse())) }; // d3 winding
      geometry = pruneParts(geometry); // tiny islands only cost bytes: no internal border, rarely hovered
      features.push({ type: 'Feature', properties: { name: s.name, wikidataid: s.wikidataid }, geometry });
    }
    const lines = internalBorders(states.map((s) => s.polys));
    if (lines.length) features.push({ type: 'Feature', properties: {}, geometry: { type: 'MultiLineString', coordinates: lines } });
    const out = `public/data/admin1/${iso2}.geojson`;
    writeFileSync(out, JSON.stringify({ type: 'FeatureCollection', features }, round));
    sizes.push([iso2, statSync(out).size]);
  }
  sizes.sort((a, b) => b[1] - a[1]);
  const total = sizes.reduce((n, s) => n + s[1], 0);
  console.log(`admin1: ${sizes.length} files, total ${(total / 1024).toFixed(0)} KB; largest:`,
    sizes.slice(0, 5).map(([c, s]) => `${c} ${(s / 1024).toFixed(0)} KB`).join(', '));
}
await buildAdmin1();
