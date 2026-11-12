import type { Precision } from '../api/types';

const ROMAN: [number, string][] = [[100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
const roman = (n: number) => ROMAN.reduce((s, [v, r]) => { while (n >= v) { s += r; n -= v; } return s; }, '');

/**
 * pt-BR year label. Years are signed with NO year 0 (1 BCE = -1, 1 CE = 1).
 * exact: "1299", "300 a.C." · circa: "c. 1299" · decade: "década de 1290" · century: "século XV", "século III a.C."
 * ponytail: BCE decades are labelled by the decade's start magnitude only; refine if the API ever sends them.
 */
export function formatYear(year: number, precision: Precision = 'exact'): string {
  if (!Number.isInteger(year) || year === 0) throw new RangeError(`Invalid year ${year}: years are integers with no year 0`);
  const bce = year < 0;
  const n = Math.abs(year);
  const era = bce ? ' a.C.' : '';
  switch (precision) {
    case 'exact': return `${n}${era}`;
    case 'circa': return `c. ${n}${era}`;
    case 'decade': return `década de ${Math.floor(n / 10) * 10}${era}`;
    case 'century': return `século ${roman(Math.ceil(n / 100))}${era}`;
  }
}

/** "1815 - 1914" style range; end null = ongoing. */
export const formatRange = (start: number, end: number | null, sp: Precision = 'exact', ep: Precision = 'exact') =>
  `${formatYear(start, sp)} - ${end === null ? 'presente' : formatYear(end, ep)}`;
