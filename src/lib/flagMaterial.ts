import { geoArea, geoBounds } from 'd3-geo';
import type { Geometry, Polygon } from 'geojson';
import { CanvasTexture, LinearFilter, ShaderMaterial, SRGBColorSpace, TextureLoader, Vector4, type Texture } from 'three';
import { DOT_GLSL, DOT_VERT, dotUniforms, type DotOpts, type DotShared } from './dotMaterial';
import { flagAtlasUrl } from './url';

export const FLAG_MIX = 0.6; // selected country: flag weight over the dots
export const FLAG_LAYER_MIX = 0.74; // flag layer (spec 021): fewer dots showing through, closer to the selected country's crispness

/** The polygon with the largest area (the mainland), or undefined for non-polygon geometry. */
export function largestPolygon(g: Geometry): Polygon | undefined {
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
  let best: Polygon | undefined;
  let bestArea = -1;
  for (const coordinates of polys) {
    const p: Polygon = { type: 'Polygon', coordinates };
    const a = geoArea(p);
    if (a > bestArea) [best, bestArea] = [p, a];
  }
  return best;
}

// Islands (2026-11-15): one flag per GROUP of nearby polygons, not only over the largest one (Indonesia showed its flag on Borneo
// alone). Polygons whose bounding boxes are within GROUP_GAP degrees join a group (single linkage), so an archipelago reads as one
// territory under one flag, while far parts (Alaska, Hawaii, French Guiana, Svalbard) get a whole flag of their own. 2 degrees was
// measured on the Natural Earth shapes: Indonesia's 70 polygons, the Philippines, Japan and Greece form one group each; the US
// splits into mainland / Alaska / Hawaii; Malaysia into the peninsula and Borneo. Up to MAX_BOXES groups, largest first; the rest
// (tiny remote islets) stay plain dots.
export const MAX_BOXES = 4;
const GROUP_GAP = 2;
const NO_BOX = new Vector4(0, 200, 1, 1); // latitude 200: no point is ever inside, so an unused slot never draws

type Box = { w: number; s: number; n: number; span: number };
const lngSpan = (w: number, e: number) => (((e - w) % 360) + 360) % 360 || 360;
function boxOf(g: Polygon | { type: 'MultiPolygon'; coordinates: Polygon['coordinates'][] }): Box {
  const [[w, s], [e, n]] = geoBounds(g);
  return { w: w!, s: s!, n: n!, span: lngSpan(w!, e!) };
}
/** Chebyshev distance in degrees between two boxes, longitude measured around the antimeridian. */
export function boxGap(a: Box, b: Box): number {
  let lng = Infinity;
  for (const k of [-360, 0, 360]) lng = Math.min(lng, Math.max(0, b.w + k - (a.w + a.span), a.w - (b.w + k + b.span)));
  return Math.max(0, b.s - a.n, a.s - b.n, lng);
}

/**
 * [west, south, lngSpan, latSpan] of each group of nearby polygons (see above), largest group first, padded with NO_BOX to
 * MAX_BOXES (the shader takes a fixed-size array). lngSpan wraps across the antimeridian (west > east). Null for non-polygons.
 */
export function flagBox(g: Geometry): Vector4[] | null {
  const rings = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
  if (!rings.length) return null;
  const items = rings.map((coordinates) => { const p: Polygon = { type: 'Polygon', coordinates }; return { p, area: geoArea(p), box: boxOf(p) }; });
  const parent = items.map((_, i) => i);
  const root = (i: number): number => (parent[i] === i ? i : (parent[i] = root(parent[i]!)));
  // ponytail: O(n²) pairs; the biggest country has ~100 polygons, so ~5k gap checks once per selection
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) if (boxGap(items[i]!.box, items[j]!.box) <= GROUP_GAP) parent[root(i)] = root(j);
  }
  const groups = new Map<number, { area: number; rings: Polygon['coordinates'][] }>();
  items.forEach((x, i) => {
    const gr = groups.get(root(i)) ?? { area: 0, rings: [] };
    gr.area += x.area;
    gr.rings.push(x.p.coordinates);
    groups.set(root(i), gr);
  });
  const boxes = [...groups.values()].sort((a, b) => b.area - a.area).slice(0, MAX_BOXES).map((gr) => {
    const b = boxOf({ type: 'MultiPolygon', coordinates: gr.rings });
    return new Vector4(b.w, b.s, b.span, b.n - b.s);
  });
  while (boxes.length < MAX_BOXES) boxes.push(NO_BOX);
  return boxes;
}

// Base = the dot matrix (dotMaterial.ts); the flag is blended over each group's bbox (uBox[i]) using the same lat/lng. A point takes
// the first box that contains it; outside every box (remote islets past MAX_BOXES) the flag weight is 0 -> plain dots.
const FRAG = /* glsl */ `
${DOT_GLSL}
uniform sampler2D uFlag; uniform vec4 uBox[${MAX_BOXES}]; uniform vec4 uCell; uniform float uMix; // uCell: [u0, v0, du, dv] of the flag in uFlag (atlas)
void main() {
  vec2 ll = latLng();
  vec2 uv = vec2(0.0);
  float inside = 0.0;
  for (int i = 0; i < ${MAX_BOXES}; i++) {
    vec2 b = vec2(mod(ll.y - uBox[i].x + 720.0, 360.0) / uBox[i].z, (ll.x - uBox[i].y) / uBox[i].w);
    float k = step(0.0, b.x) * step(b.x, 1.0) * step(0.0, b.y) * step(b.y, 1.0) * (1.0 - inside);
    uv = mix(uv, b, k);
    inside += k;
  }
  vec3 flag = texture2D(uFlag, uCell.xy + clamp(uv, 0.0, 1.0) * uCell.zw).rgb;
  gl_FragColor = vec4(mix(dotColor(ll), flag, uMix * inside), 1.0);
  #include <colorspace_fragment>
}
`;

export const createFlagMaterial = (dots: DotOpts, shared: DotShared) =>
  new ShaderMaterial({
    uniforms: { ...dotUniforms(dots, shared), uFlag: { value: null }, uBox: { value: Array.from({ length: MAX_BOXES }, () => NO_BOX) }, uCell: { value: new Vector4(0, 0, 1, 1) }, uMix: { value: 0 } },
    vertexShader: DOT_VERT,
    fragmentShader: FRAG,
  });

// One texture per country; the oldest is disposed past CACHE_MAX (each 640px flag is ~1 MB of GPU memory).
const CACHE_MAX = 8;
const cache = new Map<string, Promise<Texture>>();
const loader = new TextureLoader(); // crossOrigin 'anonymous' by default; flagcdn sends ACAO: *

export function loadFlag(pngUrl: string): Promise<Texture> {
  let t = cache.get(pngUrl);
  if (!t) {
    t = loader.loadAsync(pngUrl).then((tex) => {
      tex.colorSpace = SRGBColorSpace;
      // no mipmaps: the stretched UVs (and the antimeridian wrap) make the GPU pick blurry mip levels/seams
      tex.minFilter = LinearFilter;
      tex.generateMipmaps = false;
      return tex;
    });
    t.catch(() => cache.delete(pngUrl)); // a failed image may be retried on the next selection
    cache.set(pngUrl, t);
    if (cache.size > CACHE_MAX) {
      const [oldest, p] = cache.entries().next().value!;
      cache.delete(oldest);
      p.then((x) => x.dispose(), () => {});
    }
  } else {
    cache.delete(pngUrl); // refresh LRU position
    cache.set(pngUrl, t);
  }
  return t;
}

// Flag layer (spec 014 part 2, sharpened in spec 021): every country's w160 flag at its real aspect ratio, shelf-packed into one
// canvas up to ATLAS_W wide (4096 = safe on every GPU; ~200 flags need ~1000-1300 px of height, so one texture is enough).
// The canvas is kept for the session (re-entering the layer is instant); the GPU texture is made/disposed per activation.
const ATLAS_W = 4096;
const PAD = 2; // px of gutter between cells (the half-texel inset below keeps linear filtering inside the flag)
export interface FlagAtlas {
  canvas: HTMLCanvasElement;
  cells: Map<string, Vector4>; // iso2 -> uCell; flags that failed to load are missing (= plain dots)
}
const atlases = new Map<string, Promise<FlagAtlas>>();

export const loadFlagAtlas = (ids: string[]): Promise<FlagAtlas> => loadImageAtlas(ids.map((id) => [id, flagAtlasUrl(id)]));

/** Any [id, image url] list -> one shelf-packed atlas (spec 024 uses it for a country's state flags). Cached per list. */
export function loadImageAtlas(items: [string, string | undefined][]): Promise<FlagAtlas> {
  const key = items.map(([id, u]) => `${id}=${u ?? ''}`).join();
  let p = atlases.get(key);
  if (!p) atlases.set(key, (p = buildAtlas(items)));
  return p;
}

async function buildAtlas(items: [string, string | undefined][]): Promise<FlagAtlas> {
  const ids = items.map(([id]) => id);
  const imgs: (HTMLImageElement | undefined)[] = new Array(ids.length);
  let next = 0;
  const worker = async () => {
    while (next < ids.length) {
      const i = next++;
      const url = items[i]![1];
      if (!url) continue;
      const img = new Image();
      img.crossOrigin = 'anonymous'; // flagcdn and Wikimedia send ACAO: *; without it the canvas would be tainted
      img.src = url;
      try {
        await img.decode();
        imgs[i] = img;
      } catch {
        /* skip: that country keeps its dots */
      }
    }
  };
  await Promise.all(Array.from({ length: 8 }, worker)); // 8 requests at a time
  // shelf packing, in id order: a row ends when the next flag does not fit
  const place: { i: number; x: number; y: number }[] = [];
  let x = 0, y = 0, rowH = 0;
  imgs.forEach((img, i) => {
    if (!img) return;
    if (x + img.naturalWidth > ATLAS_W) [x, y, rowH] = [0, y + rowH + PAD, 0];
    place.push({ i, x, y });
    x += img.naturalWidth + PAD;
    rowH = Math.max(rowH, img.naturalHeight);
  });
  const canvas = document.createElement('canvas');
  canvas.width = ATLAS_W;
  canvas.height = Math.max(1, y + rowH);
  const ctx = canvas.getContext('2d')!;
  const { width: W, height: H } = canvas;
  const cells = new Map<string, Vector4>();
  for (const p of place) {
    const img = imgs[p.i]!;
    const { naturalWidth: w, naturalHeight: h } = img;
    ctx.drawImage(img, p.x, p.y, w, h);
    // half-texel inset so linear filtering never reads the neighbour cell; canvas y down -> texture v up (flipY)
    cells.set(ids[p.i]!, new Vector4((p.x + 0.5) / W, 1 - (p.y + h - 0.5) / H, (w - 1) / W, (h - 1) / H));
  }
  return { canvas, cells };
}

export function atlasTexture(canvas: HTMLCanvasElement): Texture {
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.minFilter = LinearFilter; // no mipmaps: same reason as loadFlag (stretched UVs + antimeridian wrap)
  tex.generateMipmaps = false;
  return tex;
}
