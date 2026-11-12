import { geoArea, geoBounds } from 'd3-geo';
import type { Geometry, Polygon } from 'geojson';
import { CanvasTexture, LinearFilter, ShaderMaterial, SRGBColorSpace, TextureLoader, Vector4, type Texture } from 'three';
import { DOT_GLSL, DOT_VERT, dotUniforms, type DotOpts, type DotShared } from './dotMaterial';
import { flagPreviewUrl } from './url';

export const FLAG_MIX = 0.6;

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

/** [west, south, lngSpan, latSpan] of the largest polygon; lngSpan wraps across the antimeridian (west > east). */
export function flagBox(g: Geometry): Vector4 | null {
  const best = largestPolygon(g);
  if (!best) return null;
  const [[w, s], [e, n]] = geoBounds(best);
  return new Vector4(w, s, (((e! - w!) % 360) + 360) % 360 || 360, n! - s!);
}

// Base = the dot matrix (dotMaterial.ts); the flag is blended over the largest polygon's bbox using the same lat/lng.
// Outside that bbox (other islands/exclaves) the flag weight is 0 -> plain dots.
const FRAG = /* glsl */ `
${DOT_GLSL}
uniform sampler2D uFlag; uniform vec4 uBox; uniform vec4 uCell; uniform float uMix; // uCell: [u0, v0, du, dv] of the flag in uFlag (atlas)
void main() {
  vec2 ll = latLng();
  vec2 uv = vec2(mod(ll.y - uBox.x + 720.0, 360.0) / uBox.z, (ll.x - uBox.y) / uBox.w);
  float inside = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
  vec3 flag = texture2D(uFlag, uCell.xy + clamp(uv, 0.0, 1.0) * uCell.zw).rgb;
  gl_FragColor = vec4(mix(dotColor(ll), flag, uMix * inside), 1.0);
  #include <colorspace_fragment>
}
`;

export const createFlagMaterial = (dots: DotOpts, shared: DotShared) =>
  new ShaderMaterial({
    uniforms: { ...dotUniforms(dots, shared), uFlag: { value: null }, uBox: { value: new Vector4(0, 0, 1, 1) }, uCell: { value: new Vector4(0, 0, 1, 1) }, uMix: { value: 0 } },
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

// Flag layer (spec 014 part 2): every country's w80 flag stretched into an 80x80 cell of one canvas (16 columns).
// The canvas is kept for the session (re-entering the layer is instant); the GPU texture is made/disposed per activation.
const CELL = 80;
const COLS = 16;
export interface FlagAtlas {
  canvas: HTMLCanvasElement;
  cells: Map<string, Vector4>; // iso2 -> uCell; flags that failed to load are missing (= plain dots)
}
const atlases = new Map<string, Promise<FlagAtlas>>();

export function loadFlagAtlas(ids: string[]): Promise<FlagAtlas> {
  const key = ids.join();
  let p = atlases.get(key);
  if (!p) atlases.set(key, (p = buildAtlas(ids)));
  return p;
}

async function buildAtlas(ids: string[]): Promise<FlagAtlas> {
  const canvas = document.createElement('canvas');
  canvas.width = COLS * CELL;
  canvas.height = Math.max(1, Math.ceil(ids.length / COLS)) * CELL;
  const ctx = canvas.getContext('2d')!;
  const { width: W, height: H } = canvas;
  const cells = new Map<string, Vector4>();
  let next = 0;
  const worker = async () => {
    while (next < ids.length) {
      const i = next++;
      const url = flagPreviewUrl(ids[i]);
      if (!url) continue;
      const img = new Image();
      img.crossOrigin = 'anonymous'; // flagcdn sends ACAO: *; without it the canvas would be tainted
      img.src = url;
      try {
        await img.decode();
      } catch {
        continue; // skip: that country keeps its dots
      }
      const x = (i % COLS) * CELL;
      const y = Math.floor(i / COLS) * CELL;
      ctx.drawImage(img, x, y, CELL, CELL);
      // half-texel inset so linear filtering never reads the neighbour cell; canvas y down -> texture v up (flipY)
      cells.set(ids[i]!, new Vector4((x + 0.5) / W, 1 - (y + CELL - 0.5) / H, (CELL - 1) / W, (CELL - 1) / H));
    }
  };
  await Promise.all(Array.from({ length: 8 }, worker)); // 8 requests at a time
  return { canvas, cells };
}

export function atlasTexture(canvas: HTMLCanvasElement): Texture {
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.minFilter = LinearFilter; // no mipmaps: same reason as loadFlag (stretched UVs + antimeridian wrap)
  tex.generateMipmaps = false;
  return tex;
}
