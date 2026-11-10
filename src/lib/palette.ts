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
} as const;

export const hatch = { periodPx: 10, linePx: 2 } as const; // measured along screen axes (reference screenshot 3)

const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());

export function applyCssVars(root: HTMLElement = document.documentElement) {
  for (const [k, v] of Object.entries(palette)) root.style.setProperty(`--c-${kebab(k)}`, v);
}
