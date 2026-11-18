import { compact } from './currency';

export interface TradeArcLine { iso: string; label: string; detail: string }
interface Flow { iso2: string; value_usd: number }

/**
 * Spec 040: the named line behind each trade arc. Same ranking as the arcs (destinations + origins summed by value, top `limit`),
 * so the legend and the globe never disagree. Arrow: "→" only exports, "←" only imports, "⇄" both.
 */
export function tradeArcLines(
  destinations: Flow[], origins: Flow[], selfName: string, nameOf: (iso2: string) => string | undefined, limit = 10,
): TradeArcLine[] {
  const m = new Map<string, { out: number; inn: number }>();
  for (const p of destinations) m.set(p.iso2, { out: p.value_usd, inn: m.get(p.iso2)?.inn ?? 0 });
  for (const p of origins) m.set(p.iso2, { out: m.get(p.iso2)?.out ?? 0, inn: p.value_usd });
  return [...m].sort((a, b) => b[1].out + b[1].inn - (a[1].out + a[1].inn)).slice(0, limit).map(([iso, v]) => {
    const arrow = v.out && v.inn ? '⇄' : v.out ? '→' : '←';
    const parts = [v.out && `exporta US$ ${compact(v.out)}`, v.inn && `importa US$ ${compact(v.inn)}`].filter(Boolean);
    return { iso, label: `${selfName} ${arrow} ${nameOf(iso) ?? iso}`, detail: parts.join(' · ') };
  });
}
