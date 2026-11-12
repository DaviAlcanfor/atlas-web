// Pure helpers for the currency page (spec 009). Contract v1.2: stats are FRACTIONS (-0.12 = -12%); `rates[c]` = how many `c` for 1 base.
import type { CurrencyHistory } from '../api/types';

export const DEFAULT_VS = ['USD', 'EUR', 'BRL'];
export const MAX_VS = 4;
export const MAX_COMPARE = 5;

/** ISO 4217 code from a URL segment, or null. */
export const parseCode = (s: string): string | null => (/^[A-Za-z]{3}$/.test(s) ? s.toUpperCase() : null);
/** "USD,eur,xx" -> ["USD","EUR"]: unique, valid, without `exclude`, at most `max`. */
export function parseList(s: string | null | undefined, exclude: string, pattern: RegExp, max: number): string[] {
  const out: string[] = [];
  for (const raw of (s ?? '').split(',')) {
    const c = raw.trim().toUpperCase();
    if (pattern.test(c) && c !== exclude && !out.includes(c)) out.push(c);
  }
  return out.slice(0, max);
}
export const parseVs = (s: string | null | undefined, base: string) => parseList(s, base, /^[A-Z]{3}$/, MAX_VS);
/** `?cmp=AR,MX`: up to 4 other countries (the page's own country makes 5, the API maximum). */
export const parseCmp = (s: string | null | undefined, self?: string) => parseList(s, self ?? '', /^[A-Z]{2}$/, MAX_COMPARE - 1);
/** Default comparison set: USD, EUR, BRL without the base. */
export const defaultVs = (base: string) => DEFAULT_VS.filter((c) => c !== base);

/** Fractions -> "-12,3%" / "+4,9%" (explicit sign for changes); null = no data. */
export function signedPct(f: number | null | undefined, d = 1): string | null {
  if (f === null || f === undefined || !Number.isFinite(f)) return null;
  const s = (f * 100).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
  return f > 0 ? `+${s}%` : s + '%';
}
export function plainPct(f: number | null | undefined, d = 1): string | null {
  if (f === null || f === undefined || !Number.isFinite(f)) return null;
  return `${(f * 100).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d })}%`;
}

/** Rate for display: enough digits for both 0.18 and 5400. */
export function fmtRate(r: number): string {
  const d = r >= 100 ? 2 : r >= 1 ? 3 : r >= 0.01 ? 4 : 6;
  return r.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: d });
}

/** Converter, both directions: amount in `from` -> amount in `to`, given rates "1 base = rates[c] c" (the base itself is 1). */
export function convert(amount: number, from: string, to: string, base: string, rates: Record<string, number>): number | null {
  const rf = from === base ? 1 : rates[from];
  const rt = to === base ? 1 : rates[to];
  if (!rf || !rt) return null;
  return (amount / rf) * rt;
}

export interface Series { code: string; points: { date: string; v: number }[] }

/**
 * Normalise each currency to 100 at ITS first available date inside the window (so currencies of different scales share one axis).
 * Never interpolates: a date without a rate has no point. A currency with no rate in the window is dropped.
 */
export function normalizeBase100(items: CurrencyHistory['items'], vs: string[], from?: string | null): Series[] {
  const win = from ? items.filter((i) => i.date >= from) : items;
  return vs.flatMap((code) => {
    const pts = win.flatMap((i) => (i.rates[code] !== undefined ? [{ date: i.date, r: i.rates[code]! }] : []));
    const first = pts[0];
    if (!first) return [];
    return [{ code, points: pts.map((p) => ({ date: p.date, v: (p.r / first.r) * 100 })) }];
  });
}

/** Window start (YYYY-MM-DD) for the 1a / 5a / máx toggles, given the last date with data. null = no lower bound ("máx"). */
export function windowFrom(to: string, range: '1a' | '5a' | 'max'): string | null {
  if (range === 'max') return null;
  const d = new Date(`${to}T00:00:00Z`);
  d.setUTCFullYear(d.getUTCFullYear() - (range === '1a' ? 1 : 5));
  return d.toISOString().slice(0, 10);
}

/** The API thins windows over 2 years to one point per ISO week; the chart says so instead of implying daily data. */
export function isWeekly(items: { date: string }[]): boolean {
  if (items.length < 3) return false;
  const gaps = items.slice(1).map((x, i) => (Date.parse(x.date) - Date.parse(items[i]!.date)) / 864e5).sort((a, b) => a - b);
  return gaps[Math.floor(gaps.length / 2)]! >= 5;
}

/** Change of one series over the window, as a fraction (last / first - 1). */
export const seriesChange = (s: Series): number | null => {
  const a = s.points[0], b = s.points.at(-1);
  return a && b && s.points.length > 1 ? b.v / a.v - 1 : null;
};

/** How many `code` for 1 base, from a currency's `rates`. */
export function rateOf(rates: { items: { code: string; rate: number }[] } | null | undefined, code: string): number | null {
  return rates?.items.find((i) => i.code === code)?.rate ?? null;
}

/** Large amounts: 2,28 tri / 683 bi / 41 mi. */
export function compact(n: number): string {
  const a = Math.abs(n);
  const [v, s] = a >= 1e12 ? [n / 1e12, ' tri'] : a >= 1e9 ? [n / 1e9, ' bi'] : a >= 1e6 ? [n / 1e6, ' mi'] : [n, ''];
  return `${v.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}${s}`;
}
/** Economy indicator value by unit: "US$ 2,28 tri", "2,3%", plain number otherwise. */
export function fmtEconomy(unit: string, v: number): string {
  const u = unit.trim();
  if (u.startsWith('US$') && Math.abs(v) >= 1e6) return `US$ ${compact(v)}`;
  const n = v.toLocaleString('pt-BR', { maximumFractionDigits: Math.abs(v) >= 1000 ? 0 : 2 });
  if (u.startsWith('%')) return `${n}%`;
  if (u.startsWith('US$')) return `US$ ${n}`;
  return n;
}

/** `from` sent to the API: "máx" = 29 years back (the API accepts up to 30; older ECB data is not needed for a chart). */
export function apiFrom(to: string, range: '1a' | '5a' | 'max'): string {
  return windowFrom(to, range) ?? (() => { const d = new Date(`${to}T00:00:00Z`); d.setUTCFullYear(d.getUTCFullYear() - 29); return d.toISOString().slice(0, 10); })();
}
