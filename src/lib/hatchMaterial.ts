import { Color, ShaderMaterial, type IUniform } from 'three';
import { hatch, palette } from './palette';

const VERT = /* glsl */ `
void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

// Stripes are computed from gl_FragCoord (screen pixels), so density never changes with zoom or rotation.
// Lines run "/" (constant x+y), like the reference. pr = renderer pixel ratio.
const HATCH_FRAG = /* glsl */ `
uniform vec3 uBase; uniform vec3 uLine; uniform float uPr; uniform float uPeriod; uniform float uWidth;
void main() {
  float s = (gl_FragCoord.x + gl_FragCoord.y) / uPr;
  float d = abs(mod(s, uPeriod) - uPeriod * 0.5);          // distance to stripe-gap centre
  float a = smoothstep(uPeriod * 0.5 - uWidth * 0.5 - 0.6, uPeriod * 0.5 - uWidth * 0.5 + 0.6, d); // 1 = on stripe
  gl_FragColor = vec4(mix(uBase, uLine, a), 1.0);
  #include <colorspace_fragment>
}
`;

const SOLID_FRAG = /* glsl */ `
uniform vec3 uBase;
void main() {
  gl_FragColor = vec4(uBase, 1.0);
  #include <colorspace_fragment>
}
`;

const pr = () => Math.min(2, window.devicePixelRatio || 1); // three-render-objects clamps DPR to 2

export const createHatchMaterial = (base: string) =>
  new ShaderMaterial({
    uniforms: {
      uBase: { value: new Color(base) },
      uLine: { value: new Color(palette.hatchLine) },
      uPr: { value: pr() },
      uPeriod: { value: hatch.periodPx },
      uWidth: { value: hatch.linePx },
    } satisfies Record<string, IUniform>,
    vertexShader: VERT,
    fragmentShader: HATCH_FRAG,
  });

export const createSolidMaterial = (color: string) =>
  new ShaderMaterial({ uniforms: { uBase: { value: new Color(color) } }, vertexShader: VERT, fragmentShader: SOLID_FRAG });

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
