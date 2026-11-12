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
export const regimeOther = '#8da4ad'; // not a data hue: neutral gray for the folded regimes

const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());

/** Tokens as CSS custom properties; the root layout puts them on <html> at render time (no flash, works without JS). */
export const cssVars = (): Record<string, string> => Object.fromEntries(Object.entries(palette).map(([k, v]) => [`--c-${kebab(k)}`, v]));

export function applyCssVars(root: HTMLElement = document.documentElement) {
  for (const [k, v] of Object.entries(cssVars())) root.style.setProperty(k, v);
}
