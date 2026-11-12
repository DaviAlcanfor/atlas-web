import { regimeOther, regimePalette } from './palette';

export interface RegimeGroup {
  label: string;
  color: string;
  count: number;
  members: string[]; // regime texts folded into this group
}

/**
 * Legend groups: the regimes with at least 2 countries get a palette hue, most countries first (ties alphabetical, so colors
 * are stable); the rest fold into one neutral "Outros". The API's `regime` is free text, so grouping is by exact string.
 */
export function regimeGroups(regimes: Map<string, string>): RegimeGroup[] {
  const n = new Map<string, number>();
  for (const r of regimes.values()) n.set(r, (n.get(r) ?? 0) + 1);
  const sorted = [...n].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const main = sorted.filter(([, c]) => c >= 2).slice(0, regimePalette.length);
  const groups: RegimeGroup[] = main.map(([label, count], i) => ({ label, color: regimePalette[i]!, count, members: [label] }));
  const rest = sorted.filter((x) => !main.includes(x));
  if (rest.length) groups.push({ label: 'Outros', color: regimeOther, count: rest.reduce((s, [, c]) => s + c, 0), members: rest.map(([l]) => l) });
  return groups;
}

/** regime text -> color (rare regimes share the "Outros" color). */
export const regimeColors = (regimes: Map<string, string>): Map<string, string> =>
  new Map(regimeGroups(regimes).flatMap((g) => g.members.map((m) => [m, g.color] as const)));
