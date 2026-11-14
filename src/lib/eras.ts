// Spec 012: map style by period. The present keeps "Signal" (dots); time travel switches the land shader, ocean, lines and
// background to evoke the cartography of each period. Colours live in palette.ts (eraTokens); this file only says which
// period gets which look. The panel keeps its own background, so text contrast never depends on the era.
import { eraTokens, palette } from './palette';

/** Land rendering mode, read by the dot shader (uStyle). */
export const LAND = { dots: 0, ink: 1, hatch: 2, flat: 3, blueprint: 4 } as const;

export interface Era {
  id: 'manuscript' | 'nautical' | 'atlas' | 'coldwar' | 'signal';
  label: string; // pt-BR, shown in the time bar
  from: number | null; // inclusive; null = open
  to: number | null;
  land: (typeof LAND)[keyof typeof LAND];
  paper: string; // land base under the ink
  ink: string; // the era's ink: entity colours are pulled toward it
  ocean: string;
  oceanRim: string;
  border: string;
  coast: string;
  grid: string;
  stars: boolean;
}

export const ERAS: Era[] = [
  { id: 'manuscript', label: 'Manuscrito', from: null, to: 1499, land: LAND.ink, stars: false, ...eraTokens.manuscript },
  { id: 'nautical', label: 'Carta náutica', from: 1500, to: 1799, land: LAND.hatch, stars: false, ...eraTokens.nautical },
  { id: 'atlas', label: 'Atlas impresso', from: 1800, to: 1944, land: LAND.flat, stars: false, ...eraTokens.atlas },
  { id: 'coldwar', label: 'Planta da Guerra Fria', from: 1945, to: 1990, land: LAND.blueprint, stars: false, ...eraTokens.coldwar },
];

/** The present ("Signal"): what the globe looks like outside time travel and from 1991 on. */
export const SIGNAL: Era = {
  id: 'signal', label: 'Atlas de hoje', from: 1991, to: null, land: LAND.dots, stars: true,
  paper: palette.landFill, ink: palette.ice, ocean: palette.ocean, oceanRim: palette.oceanRim,
  border: palette.border, coast: palette.coast, grid: palette.grid,
};

export const eraOf = (year: number): Era =>
  ERAS.find((e) => (e.from === null || year >= e.from) && (e.to === null || year <= e.to)) ?? SIGNAL;
