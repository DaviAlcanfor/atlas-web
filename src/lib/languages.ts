// Spec 017: language chips. Status order and labels follow the contract (official, co_official, indigenous, immigrant, sign, historical).
import type { LanguageSpoken, LanguageStatus } from '../api/types';

export const STATUS_ORDER: LanguageStatus[] = ['official', 'co_official', 'indigenous', 'immigrant', 'sign', 'historical'];
export const STATUS_LABEL: Record<LanguageStatus, string> = {
  official: 'Oficial', co_official: 'Cooficial', indigenous: 'Indígena', immigrant: 'Imigração / comunidade', sign: 'Língua de sinais', historical: 'Histórica / extinta',
};
export const VISIBLE = 12;

/** Languages in contract order (the API already sorts them; re-sorting by status keeps a stale mock honest). */
export const sortLanguages = (l: LanguageSpoken[]): LanguageSpoken[] =>
  [...l].sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status));

/** Statuses present, in legend order. */
export const statusesIn = (l: LanguageSpoken[]): LanguageStatus[] => STATUS_ORDER.filter((s) => l.some((x) => x.status === s));

/** Hover text: status, family, speakers (with year), endangerment, where. Only what exists. */
export function languageTip(l: LanguageSpoken): string {
  const lines = [`${l.name} · ${STATUS_LABEL[l.status]}`];
  if (l.where) lines.push(`Onde: ${l.where}`);
  if (l.family) lines.push(`Família: ${l.family}`);
  if (l.speakers) lines.push(`Falantes: ${l.speakers.value.toLocaleString('pt-BR')}${l.speakers.year ? ` (${l.speakers.year})` : ''}`);
  if (l.endangerment) lines.push(`Ameaça (UNESCO): ${l.endangerment}`);
  return lines.join('\n');
}
