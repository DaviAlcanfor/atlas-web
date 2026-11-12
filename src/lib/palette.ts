// Single source of design tokens: design system "Signal" (specs/013-design-system.md).
// Cold neutral base + ice cyan for data + signal red as the ONLY accent.
// applyCssVars() mirrors them to CSS custom properties (--c-kebab-name) so stylesheets never hardcode colors.
export const palette = {
  // surfaces
  abyss: '#03070c', // page / space
  ocean: '#061321',
  oceanRim: '#0f3446',
  atmosphere: '#2f8fa3',
  panel: 'rgba(5, 14, 23, 0.88)',
  panelSolid: '#07111b',
  // data (ice cyan family)
  ice: '#8fdbe3', // land dots, primary data
  iceBright: '#d6f6f8', // hovered / focused data
  iceDim: '#2f6873', // land without content
  landFill: '#0a1f2b', // under the dots
  grid: 'rgba(110, 200, 214, 0.10)', // graticule
  border: 'rgba(120, 212, 224, 0.38)', // country borders
  coast: 'rgba(120, 212, 224, 0.55)',
  admin1Line: 'rgba(6, 19, 33, 0.85)', // internal borders, drawn over the selected (bright or flag-tinted) country
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

// Fills for the "Political regime" layer: a single cyan ramp (one hue, varying lightness), assigned in sorted order.
export const regimePalette = ['#d6f6f8', '#8fdbe3', '#5cb8c4', '#3b93a1', '#2a737f', '#7aa9b0', '#b4cfd3', '#4f7f88'] as const;

const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());

export function applyCssVars(root: HTMLElement = document.documentElement) {
  for (const [k, v] of Object.entries(palette)) root.style.setProperty(`--c-${kebab(k)}`, v);
}
