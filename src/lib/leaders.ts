import type { Leader } from '../api/types';

export const ROLE_LABEL: Record<Leader['role'], string> = { head_of_state: 'Chefe de Estado', head_of_government: 'Chefe de governo' };

const startKey = (l: Leader) => l.start ?? '';

/**
 * Split the API's list (sorted by start ascending, unknown start last) into:
 *  - current: per role, the latest term with a known start and no end ("end null" = in office or unknown, so an undated
 *    legendary ruler never counts as current);
 *  - history: everything else, newest first, unknown start last.
 */
export function splitLeaders(items: Leader[]): { current: Leader[]; history: Leader[] } {
  const current: Leader[] = [];
  for (const role of ['head_of_state', 'head_of_government'] as const) {
    const open = items.filter((l) => l.role === role && l.end === null && l.start !== null).sort((a, b) => startKey(b).localeCompare(startKey(a)));
    if (open[0]) current.push(open[0]);
  }
  const history = items.filter((l) => !current.includes(l)).sort((a, b) => {
    if ((a.start === null) !== (b.start === null)) return a.start === null ? 1 : -1;
    return startKey(b).localeCompare(startKey(a));
  });
  return { current, history };
}

/** "2019–atual", "1889–1891", "sem datas". Years only: months in Wikidata are often missing and would suggest precision we lack. */
export function termRange(l: Pick<Leader, 'start' | 'end'>): string {
  const y = (d: string) => d.slice(0, 4);
  if (!l.start) return l.end ? `até ${y(l.end)}` : 'sem datas';
  return `${y(l.start)}–${l.end ? y(l.end) : 'atual'}`;
}

export const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('');
