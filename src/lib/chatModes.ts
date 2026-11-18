// spec 039: chat modes (Aprender / Analisar / Narrar), "/learn" style commands, the fixed "O que posso explorar daqui?" suggestions
// and the validation of the SSE `map` event ("mostrar no mapa"). Nothing here calls the model.
import type { LayerId } from '../types';

export type Mode = 'learn' | 'analyse' | 'tell';
export const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: 'learn', label: 'Aprender', hint: 'Etapas curtas, ligadas aos dados' },
  { id: 'analyse', label: 'Analisar', hint: 'Compara com valor, ano, fonte e limites' },
  { id: 'tell', label: 'Narrar', hint: 'Conta em etapas, só com conteúdo do Atlas' },
];
export const isMode = (v: unknown): v is Mode => MODES.some((m) => m.id === v);

/** "/learn o que é um regime?" -> { mode: 'learn', text: 'o que é um regime?' }. Only a command at the very start counts. */
export function parseCommand(text: string): { mode: Mode | null; text: string } {
  const m = /^\s*\/(learn|analyse|tell)(?:\s+([\s\S]*))?$/i.exec(text);
  return m ? { mode: m[1]!.toLowerCase() as Mode, text: (m[2] ?? '').trim() } : { mode: null, text };
}

export interface ChatScreen { country: string | null; layer: LayerId; year: number | null } // country = pt-BR name

const DEFAULTS = ['Quais monarquias absolutas existem?', 'Compare a inflação do Brasil e da Argentina', 'Quais países têm mais de um idioma oficial?'];

/** 3 fixed questions by kind of screen: time travel > selected country > active layer > nothing selected. */
export function suggestions({ country, layer, year }: ChatScreen): string[] {
  if (year !== null) {
    const y = year < 0 ? `${-year} a.C.` : String(year);
    return [`O que mudou no mapa por volta de ${y}?`, `Quais impérios e reinos existiam em ${y}?`, 'Conte a história deste período'];
  }
  if (country) return [`Resuma a história de ${country}`, `Como é a economia de ${country}?`, `Com quais países ${country} mais comercia?`];
  if (layer === 'regime') return ['Quais regimes políticos existem hoje?', 'Quais monarquias absolutas existem?', 'Quais países são repúblicas semipresidencialistas?'];
  if (layer === 'ranking') return ['O que este ranking mede?', 'Quais países lideram este ranking?', 'Compare o Brasil e a Argentina neste indicador'];
  return DEFAULTS;
}

// ---- SSE `map` event: {iso2[], layer?, year?}; anything unknown is dropped silently ----
export interface MapTarget { iso2: string[]; layer?: LayerId; year?: number }
const LAYERS: readonly string[] = ['content', 'regime', 'flags', 'geoguessr', 'ranking'] satisfies LayerId[];
const YEAR_MIN = -123000, YEAR_MAX = 2100; // historical-basemaps range; the slider then snaps to the nearest snapshot

/** `known` = ISO codes the app has on the globe (null = format check only). null result = nothing valid left, no button. */
export function cleanMap(raw: { iso2?: unknown; layer?: unknown; year?: unknown }, known: ReadonlySet<string> | null): MapTarget | null {
  const iso2 = [...new Set((Array.isArray(raw.iso2) ? raw.iso2 : []).flatMap((c): string[] =>
    typeof c === 'string' && /^[A-Za-z]{2}$/.test(c) && (!known || known.has(c.toUpperCase())) ? [c.toUpperCase()] : []))].slice(0, 10);
  const layer = typeof raw.layer === 'string' && LAYERS.includes(raw.layer) ? (raw.layer as LayerId) : undefined;
  const year = Number.isInteger(raw.year) && raw.year !== 0 && (raw.year as number) >= YEAR_MIN && (raw.year as number) <= YEAR_MAX ? (raw.year as number) : undefined;
  return iso2.length || layer || year !== undefined ? { iso2, ...(layer && { layer }), ...(year !== undefined && { year }) } : null;
}
