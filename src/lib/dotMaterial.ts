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
varying vec3 vPos;
vec2 latLng() {
  vec3 p = normalize(vPos);
  return vec2(degrees(asin(clamp(p.y, -1.0, 1.0))), 90.0 - degrees(atan(p.z, p.x)));
}
vec3 dotColor(vec2 ll) {
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
`;

export interface DotOpts {
  color: string;
  radius: number; // fraction of the spacing
  spacing?: number;
}

/** Shared per-globe uniforms: one write animates/re-levels every land material. */
export interface DotShared {
  intro: IUniform<number>; // 0..1 entry animation
  zoom: IUniform<number>; // spacing multiplier, a power of 2 (zoom LOD)
}

export const dotUniforms = ({ color, radius, spacing = DOT_SPACING }: DotOpts, shared: DotShared) =>
  ({
    uFill: { value: new Color(palette.landFill) },
    uDot: { value: new Color(color) },
    uSpacing: { value: spacing },
    uRadius: { value: radius },
    uIntro: shared.intro,
    uZoom: shared.zoom,
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
