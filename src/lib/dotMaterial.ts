import { Color, ShaderMaterial, type IUniform } from 'three';
import { palette } from './palette';

/** Land dot grid spacing in degrees at the default zoom (~9 px between dots at 1440x900); halves per zoom octave (uZoom). */
export const DOT_SPACING = 0.9;

export const DOT_VERT = /* glsl */ `
varying vec3 vPos;
void main() { vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

// Shared GLSL: lat/lng from the object-space position (same spherical mapping as three-globe) and a dot matrix laid out
// in lat/lng, so dots stick to the globe. Each row holds a whole number of dots (no seam) spaced ~uSpacing on the ground.
// uIntro (0..1) lights the dots up in a random order (entry animation).
export const DOT_GLSL = /* glsl */ `
uniform vec3 uFill; uniform vec3 uDot; uniform float uSpacing; uniform float uRadius; uniform float uIntro; uniform float uZoom;
uniform float uStyle; uniform vec3 uPaper; uniform vec3 uInk; uniform float uEmpty; // spec 012: era style (lib/eras.ts LAND)
varying vec3 vPos;
float hash21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x), mix(hash21(i + vec2(0.0, 1.0)), hash21(i + 1.0), f.x), f.y);
}
vec2 latLng() {
  vec3 p = normalize(vPos);
  return vec2(degrees(asin(clamp(p.y, -1.0, 1.0))), 90.0 - degrees(atan(p.z, p.x)));
}
vec3 signalDots(vec2 ll) {
  float S = uSpacing * uZoom;
  float row = floor(ll.x / S + 0.5);
  float rowLat = row * S;
  float n = max(1.0, floor(360.0 * cos(radians(rowLat)) / S + 0.5));
  float stepLng = 360.0 / n;
  float col = floor(ll.y / stepLng + 0.5);
  float dist = length(vec2((ll.y - col * stepLng) * cos(radians(ll.x)), ll.x - rowLat)); // degrees on the ground
  float k = clamp(uIntro * 1.8 - fract(sin(dot(vec2(row, col), vec2(127.1, 311.7))) * 43758.5453) * 0.8, 0.0, 1.0);
  float r = uRadius * S * k;
  float px = length(vec2(dFdx(ll.x), dFdy(ll.x))) + 1e-5; // ~one pixel, in degrees
  float m = 1.0 - smoothstep(r - px, r + px, dist);
  float halo = (1.0 - smoothstep(r, max(0.5 * S, r + px), dist)) * 0.16 * k; // faint glow, zero at the cell edge (no seams)
  // sub-pixel dots shimmer: fade to their average coverage instead
  float far = smoothstep(0.35, 0.9, px / max(r, 1e-4));
  m = mix(m, 3.14159 * r * r / (S * S) * 1.2, far);
  halo *= 1.0 - far;
  return mix(uFill, uDot, clamp(m, 0.0, 1.0)) + uDot * halo;
}
// Era looks (no textures: everything procedural, in lat/lng so it sticks to the globe). uDot is the entity colour; it is pulled
// toward the era's ink so the palette reads as that period. uEmpty marks land without a recorded state: plain paper.
vec3 dotColor(vec2 ll) {
  if (uStyle < 0.5) return signalDots(ll);
  float S = uSpacing * uZoom;
  float grain = 0.5 * vnoise(ll * 2.5) + 0.5 * vnoise(ll * 9.0);
  if (uEmpty > 0.5) return uPaper * (0.82 + 0.12 * grain);
  vec3 tint = mix(uInk, uDot, 0.55);
  if (uStyle < 1.5) { // manuscript: an uneven sepia wash over parchment
    float wash = 0.3 + 0.3 * vnoise(ll * 1.3) + 0.12 * grain;
    return mix(uPaper, tint, wash) * (0.9 + 0.14 * grain);
  }
  if (uStyle < 2.5) { // nautical chart: fine diagonal ink hatching
    float h = abs(fract((ll.x + ll.y * cos(radians(ll.x))) / (S * 0.7)) - 0.5);
    float aa = fwidth((ll.x + ll.y) / (S * 0.7)) + 1e-4;
    float line = 1.0 - smoothstep(0.14 - aa, 0.14 + aa, h);
    return mix(uPaper, tint, 0.18 + 0.62 * line) * (0.94 + 0.1 * grain);
  }
  if (uStyle < 3.5) { // printed atlas: flat lithograph colour with paper grain
    return mix(uPaper, tint, 0.62) * (0.95 + 0.07 * grain);
  }
  // cold war blueprint: translucent fill with a fine technical grid
  vec2 g = abs(fract(vec2(ll.x, ll.y * cos(radians(ll.x))) / (S * 2.0)) - 0.5);
  float aa = fwidth(ll.x / (S * 2.0)) + 1e-4;
  float grid = 1.0 - smoothstep(0.47 - aa, 0.47 + aa, max(g.x, g.y));
  return mix(uPaper, tint, 0.32) + uInk * grid * 0.22;
}
`;

export interface DotOpts {
  color: string;
  radius: number; // fraction of the spacing
  spacing?: number;
  empty?: boolean; // land without data/state: drawn as bare paper in the era styles
}

/** Shared per-globe uniforms: one write animates/re-levels every land material. */
export interface DotShared {
  intro: IUniform<number>; // 0..1 entry animation
  zoom: IUniform<number>; // spacing multiplier, a power of 2 (zoom LOD)
  style: IUniform<number>; // spec 012: LAND mode of the current era (0 = Signal dots)
  paper: IUniform<Color>;
  ink: IUniform<Color>;
}

export const createDotShared = (): DotShared => ({
  intro: { value: 0 }, zoom: { value: 1 }, style: { value: 0 }, paper: { value: new Color(palette.landFill) }, ink: { value: new Color(palette.ice) },
});

export const dotUniforms = ({ color, radius, spacing = DOT_SPACING, empty = false }: DotOpts, shared: DotShared) =>
  ({
    uFill: { value: new Color(palette.landFill) },
    uDot: { value: new Color(color) },
    uSpacing: { value: spacing },
    uRadius: { value: radius },
    uIntro: shared.intro,
    uZoom: shared.zoom,
    uStyle: shared.style,
    uPaper: shared.paper,
    uInk: shared.ink,
    uEmpty: { value: empty ? 1 : 0 },
  }) satisfies Record<string, IUniform>;

export const createDotMaterial = (opts: DotOpts, shared: DotShared) =>
  new ShaderMaterial({
    uniforms: dotUniforms(opts, shared),
    vertexShader: DOT_VERT,
    fragmentShader: /* glsl */ `
      ${DOT_GLSL}
      void main() {
        gl_FragColor = vec4(dotColor(latLng()), 1.0);
        #include <colorspace_fragment>
      }`,
  });

/** Transparent dot overlay (hovered state): dots + a faint tint, so whatever is underneath (flag, dots) still shows through. */
export const createDotOverlayMaterial = (opts: DotOpts, shared: DotShared, tint = 0.3) =>
  new ShaderMaterial({
    uniforms: { ...dotUniforms(opts, shared), uFill: { value: new Color(0x000000) } },
    vertexShader: DOT_VERT,
    transparent: true,
    depthWrite: false,
    fragmentShader: /* glsl */ `
      ${DOT_GLSL}
      void main() {
        vec3 c = dotColor(latLng()); // uFill is black: what remains is the dots (+ halo)
        float a = clamp(max(c.r, max(c.g, c.b)) / max(uDot.r, max(uDot.g, uDot.b)), 0.0, 1.0);
        gl_FragColor = vec4(uDot, max(a, ${tint.toFixed(2)}));
        #include <colorspace_fragment>
      }`,
  });

// Flat ocean with a soft fresnel lift at the limb (the atmosphere shell adds the outer glow).
export const createOceanMaterial = () =>
  new ShaderMaterial({
    uniforms: { uCenter: { value: new Color(palette.ocean) }, uRim: { value: new Color(palette.oceanRim) } },
    vertexShader: /* glsl */ `
      varying vec3 vN;
      void main() { vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uCenter; uniform vec3 uRim; varying vec3 vN;
      void main() {
        float f = 1.0 - clamp(dot(normalize(vN), vec3(0.0, 0.0, 1.0)), 0.0, 1.0);
        gl_FragColor = vec4(mix(uCenter, uRim, smoothstep(0.45, 1.0, f)), 1.0);
        #include <colorspace_fragment>
      }`,
  });
