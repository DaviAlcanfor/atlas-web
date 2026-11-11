// Build-time ETL: world-atlas (Natural Earth 50m) -> static JSON in public/data/.
// Run with: npm run data
import { readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
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
