// Pure helpers for the "Como vive o povo" section (spec 015). Contract v1.2: `rank` 1 = HIGHEST value; the front decides how to read it.
import type { ProfileIndicator } from '../api/types';

const nf = (n: number, d: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });

/** Indicators where a LOW value is the good end: the rank text counts from the lowest value ("5º menor de 177"). */
export const LOWER_IS_BETTER: ReadonlySet<string> = new Set([
  'SP.DYN.IMRT.IN', 'VC.IHR.PSRC.P5', 'SI.POV.DDAY', 'SL.UEM.TOTL.ZS', 'SI.POV.GINI', 'EN.GHG.CO2.PC.CE.AR5',
]);

/** "34º de 190" (1º = highest value) or, for indicators where less is better, "5º menor de 177". null = no rank. */
export function rankText(id: string, rank: number | null, of: number | null): string | null {
  if (rank === null || of === null) return null;
  if (LOWER_IS_BETTER.has(id)) return `${of - rank + 1}º menor de ${of}`;
  return `${rank}º de ${of}`;
}

/** Decimals by magnitude so a homicide rate of 0.23 and a GDP of 23433 both read well. */
export function decimals(id: string, v: number): number {
  if (id === 'HDR.HDI') return 3;
  const a = Math.abs(v);
  return a >= 100 ? 0 : a >= 1 ? 1 : 2;
}

/** Value + unit for display. Percent units become a suffix ("88,2%") with the rest as `note`; US$ units a prefix. */
export function formatIndicator(i: Pick<ProfileIndicator, 'id' | 'unit' | 'value'>, v = i.value): { text: string; note: string } {
  const n = nf(v, decimals(i.id, v));
  const u = i.unit.trim();
  if (u.startsWith('%')) return { text: `${n}%`, note: u.slice(1).replace(/^[\s(]+|[)\s]+$/g, '') };
  if (u.startsWith('US$')) return { text: `US$ ${n}`, note: '' };
  if (!u || /^0-\d+$/.test(u)) return { text: n, note: '' };
  return { text: n, note: u };
}

/** Position of `v` on the min-max ruler, 0..1 (clamped). A flat ruler (min = max) centres the marker. */
export function rulerPos(v: number, w: { min: number; max: number }): number {
  if (w.max <= w.min) return 0.5;
  return Math.min(1, Math.max(0, (v - w.min) / (w.max - w.min)));
}

/** Tooltip body for an indicator row. Only the parts that exist are listed. */
export function indicatorTip(i: ProfileIndicator): string {
  const rt = rankText(i.id, i.rank, i.rank_of);
  const lines: string[] = [];
  if (rt) lines.push(`${rt} países${LOWER_IS_BETTER.has(i.id) ? ' (menos é melhor)' : ' (1º = maior valor)'}`);
  if (i.region_avg !== null) lines.push(`Média da região: ${formatIndicator(i, i.region_avg).text}`);
  if (i.world) {
    lines.push(`Mediana mundial: ${formatIndicator(i, i.world.median).text}`);
    lines.push(`Mundo: de ${formatIndicator(i, i.world.min).text} a ${formatIndicator(i, i.world.max).text}`);
  }
  return lines.join('\n');
}

export interface Slice { label: string; share: number }
/** Top `n` groups of a composition + one "outros" slice summing the other listed groups. Shares are fractions 0-1. */
export function topSlices(items: Slice[], n = 5): Slice[] {
  const sorted = [...items].sort((a, b) => b.share - a.share);
  const top = sorted.slice(0, n);
  const rest = sorted.slice(n).reduce((s, x) => s + x.share, 0); // only listed groups: the unlisted remainder stays unlabelled
  return rest > 0 ? [...top, { label: 'outros', share: rest }] : top;
}

/** Fraction 0-1 -> "47,7%". */
export function pct(f: number, d = 1): string {
  return `${nf(f * 100, d)}%`;
}

// Spec 029 phase 1: the one-line summary of what the economy lives on. Fixed rules over the numbers shown below it (never a guess):
// the biggest share of merchandise exports; oil when its rent is 10% of GDP or more; high tech above 25% of manufactured exports.
export const ECONOMY_SUMMARY_RULE = 'Frase montada pelo Atlas com regras fixas sobre os números abaixo: a maior fatia das exportações de mercadorias; o petróleo quando rende 10% do PIB ou mais; a alta tecnologia quando passa de 25% das exportações de manufaturados.';
const EXPORT_PARTS: Readonly<Record<string, string>> = {
  'TX.VAL.FUEL.ZS.UN': 'combustíveis', 'TX.VAL.FOOD.ZS.UN': 'alimentos', 'TX.VAL.AGRI.ZS.UN': 'matérias-primas agrícolas',
  'TX.VAL.MMTL.ZS.UN': 'minérios e metais', 'TX.VAL.MANF.ZS.UN': 'manufaturados',
};
type Ind = Pick<ProfileIndicator, 'id' | 'value' | 'year'>;
const whole = (v: number) => Math.round(v).toLocaleString('pt-BR');
export function economySummary(items: Ind[]): string | null {
  const by = new Map(items.map((i) => [i.id, i]));
  const top = items.filter((i) => i.id in EXPORT_PARTS).sort((a, b) => b.value - a.value)[0];
  if (!top) return null;
  const out = [`${top.value >= 50 ? 'Mais da metade' : 'A maior fatia'} das exportações de mercadorias é de ${EXPORT_PARTS[top.id]} (${whole(top.value)}% em ${top.year}).`];
  const oil = by.get('NY.GDP.PETR.RT.ZS');
  if (oil && oil.value >= 10) out.push(`O petróleo rende ${whole(oil.value)}% do PIB (${oil.year}).`);
  const tech = by.get('TX.VAL.TECH.MF.ZS');
  if (tech && tech.value > 25) out.push(`${whole(tech.value)}% das exportações de manufaturados são de alta tecnologia (${tech.year}).`);
  return out.join(' ');
}
