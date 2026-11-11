// Single source of design tokens. Values sampled from the reference screenshots (see README / phase-1 report).
// applyCssVars() mirrors them to CSS custom properties so stylesheets never hardcode colors.
export const palette = {
  space: '#04060d',
  ocean: '#0c4278',
  oceanRim: '#2f6fae',
  atmosphere: '#4f9be0',
  landBase: '#56677c',
  landHover: '#66788f',
  hatchLine: '#364454',
  cream: '#e6dbc1',
  creamHover: '#f6ecd0',
  creamSelected: '#fff6dc',
  border: '#d2bf96',
  coast: '#8f8466',
  markerRing: '#1b2233',
  cardTop: '#152640',
  cardBottom: '#101e33',
  cardBorder: 'rgba(120, 160, 230, 0.35)',
  label: '#5fa8f0',
  text: '#ffffff',
  focus: '#9cc9ff',
  // panel accents (keep the app from being monochrome)
  accentTeal: '#4fd1c5',
  accentAmber: '#f6c25b',
  accentCoral: '#f08a7e',
  accentViolet: '#b49cf6',
  accentGreen: '#8fd694',
  panelCard: 'rgba(255, 255, 255, 0.045)',
  panelLine: 'rgba(160, 190, 240, 0.18)',
} as const;

/** Timeline dot color per event kind (CSS variable names, so components stay token-only). */
export const kindColor = {
  political: 'var(--c-accent-violet)',
  war: 'var(--c-accent-coral)',
  treaty: 'var(--c-accent-teal)',
  cultural: 'var(--c-accent-amber)',
  economic: 'var(--c-accent-green)',
  other: 'var(--c-label)',
} as const;

// Soft, desaturated fills for the "Political regime" layer (one per distinct regime, assigned in sorted order).
export const regimePalette = ['#c9b79c', '#9db4c8', '#b7c4a0', '#c9a6a6', '#b3a6c9', '#a6c9c0', '#d0c08a', '#a6b0c9'] as const;

export const hatch = { periodPx: 10, linePx: 2 } as const; // measured along screen axes (reference screenshot 3)

const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());

export function applyCssVars(root: HTMLElement = document.documentElement) {
  for (const [k, v] of Object.entries(palette)) root.style.setProperty(`--c-${kebab(k)}`, v);
}
