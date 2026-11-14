// Single source of design tokens: design system "Signal" (specs/013-design-system.md).
// Cold neutral base + ice cyan for data + signal red as the ONLY accent.
// applyCssVars() mirrors them to CSS custom properties (--c-kebab-name) so stylesheets never hardcode colors.
export const palette = {
  // surfaces
  abyss: '#03070c', // page / space
  ocean: '#061321',
  oceanRim: '#0f3446',
  atmosphere: '#2f8fa3',
  panel: 'rgba(5, 14, 23, 0.96)',
  panelSolid: '#07111b',
  // data (ice cyan family)
  ice: '#8fdbe3', // land dots, primary data
  iceBright: '#d6f6f8', // hovered / focused data
  iceMid: '#5aa8b3', // in between: partial coverage in the GeoGuessr layer
  iceDim: '#2f6873', // land without content
  landFill: '#0a1f2b', // under the dots
  grid: 'rgba(110, 200, 214, 0.10)', // graticule
  border: 'rgba(130, 222, 233, 0.62)', // country borders (spec 021: readable over ocean, dots and flags)
  coast: 'rgba(130, 222, 233, 0.78)',
  admin1Line: 'rgba(214, 246, 248, 0.42)', // internal borders: one thin translucent light stroke (spec 023)
  line: 'rgba(143, 219, 227, 0.16)', // UI hairlines
  lineStrong: 'rgba(143, 219, 227, 0.42)',
  // text
  text: '#e2ecef',
  textDim: '#8da4ad',
  textFaint: '#5a717a',
  // the single accent
  signal: '#ff5a4e',
  signalDim: 'rgba(255, 90, 78, 0.22)',
  focus: '#d6f6f8',
} as const;

/** Timeline dot color per event kind. One accent: only war uses the signal red; the rest are cyan tints. */
export const kindColor = {
  political: 'var(--c-ice)',
  war: 'var(--c-signal)',
  treaty: 'var(--c-ice-bright)',
  cultural: 'var(--c-text-dim)',
  economic: 'var(--c-ice-dim)',
  other: 'var(--c-text-faint)',
} as const;

// Fills for the "Political regime" layer (spec 021): 8 categorical hues (blue, orange, aqua, amber, magenta, green, violet, red), given in
// fixed order to the regimes with most countries. Validated with the dataviz skill (dark mode, surface landFill #0a1f2b): lightness band,
// chroma floor, adjacent CVD dE 8.4 (protan), normal-vision dE 19.3, contrast >= 3:1. All-pairs CVD cannot clear the floor for 8 hues on a
// map, so the legend (swatch + name + count) and the hover readout are the secondary encoding. Rare regimes fold into a neutral "Outros".
export const regimePalette = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'] as const;
export const regimeOther = '#8da4ad';
// Time travel map styles (spec 012, lib/eras.ts). Kept mid-dark so the white chrome text (info card, time bar) stays readable
// when it overlaps the globe; the panel has its own background. Lines are rgba like `border`/`coast` above.
export const eraTokens = {
  manuscript: { paper: '#3a2f1f', ink: '#d8b77a', ocean: '#221a10', oceanRim: '#4a3a22',
    border: 'rgba(216, 183, 122, 0.55)', coast: 'rgba(216, 183, 122, 0.85)', grid: 'rgba(216, 183, 122, 0.0)' },
  nautical: { paper: '#4a3d27', ink: '#ead7a8', ocean: '#24312f', oceanRim: '#4b5e55',
    border: 'rgba(234, 215, 168, 0.5)', coast: 'rgba(234, 215, 168, 0.85)', grid: 'rgba(234, 215, 168, 0.2)' },
  atlas: { paper: '#c9bb94', ink: '#efe4c8', ocean: '#3a505b', oceanRim: '#5d7682',
    border: 'rgba(38, 30, 20, 0.75)', coast: 'rgba(38, 30, 20, 0.9)', grid: 'rgba(235, 225, 200, 0.16)' },
  coldwar: { paper: '#123f6b', ink: '#bfe0ff', ocean: '#0a2440', oceanRim: '#174a78',
    border: 'rgba(191, 224, 255, 0.7)', coast: 'rgba(191, 224, 255, 0.9)', grid: 'rgba(191, 224, 255, 0.28)' },
} as const;
// Ranking layer (spec 027): ONE hue, dark -> light = low -> high (on a dark surface the ramp's anchor flips). Steps 600..100 of the
// dataviz skill's validated blue sequential ramp: 600 is the darkest step allowed on dark (2.15:1); the hue is distinct from the
// ice-cyan "no value" dots. Buckets are rank septiles, so each colour holds ~1/7 of the countries with a value.
export const rankRamp = ['#184f95', '#256abf', '#3987e5', '#5598e7', '#86b6ef', '#b7d3f6', '#cde2fb'] as const; // not a data hue: neutral gray for the folded regimes

const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());

/** Tokens as CSS custom properties; the root layout puts them on <html> at render time (no flash, works without JS). */
export const cssVars = (): Record<string, string> => Object.fromEntries(Object.entries(palette).map(([k, v]) => [`--c-${kebab(k)}`, v]));

export function applyCssVars(root: HTMLElement = document.documentElement) {
  for (const [k, v] of Object.entries(cssVars())) root.style.setProperty(k, v);
}
