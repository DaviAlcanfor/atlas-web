import { geoArea, geoBounds } from 'd3-geo';
import type { Geometry, Polygon } from 'geojson';
import { LinearFilter, ShaderMaterial, SRGBColorSpace, TextureLoader, Vector4, type Texture } from 'three';
import { DOT_GLSL, DOT_VERT, dotUniforms, type DotOpts, type DotShared } from './dotMaterial';

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
uniform sampler2D uFlag; uniform vec4 uBox; uniform float uMix;
void main() {
  vec2 ll = latLng();
  vec2 uv = vec2(mod(ll.y - uBox.x + 720.0, 360.0) / uBox.z, (ll.x - uBox.y) / uBox.w);
  float inside = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
  vec3 flag = texture2D(uFlag, clamp(uv, 0.0, 1.0)).rgb;
  gl_FragColor = vec4(mix(dotColor(ll), flag, uMix * inside), 1.0);
  #include <colorspace_fragment>
}
`;

export const createFlagMaterial = (dots: DotOpts, shared: DotShared) =>
  new ShaderMaterial({
    uniforms: { ...dotUniforms(dots, shared), uFlag: { value: null }, uBox: { value: new Vector4(0, 0, 1, 1) }, uMix: { value: 0 } },
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
