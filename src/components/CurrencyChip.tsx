// Spec 009: the currency chip in the country panel. Hover/focus: name, ISO code, symbol, today's rate vs USD and the 1-year change;
// click opens /moeda/<code>. If the v1.2 endpoint is missing (production on v1.1) the chip stays a plain, non-clickable chip.
import Link from 'next/link';
import { api } from '../api';
import type { CountryDetail } from '../api/types';
import { useAsync } from '../hooks/useAsync';
import { fmtRate, rateOf, signedPct } from '../lib/currency';
import { Tooltip } from './Tooltip';

export function CurrencyChip({ cur }: { cur: CountryDetail['currencies'][number] }) {
  const s = useAsync(() => api.currency(cur.code), cur.code);
  const d = s.status === 'ok' ? s.data : null;
  const vsCode = cur.code === 'USD' ? 'EUR' : 'USD';
  const rate = rateOf(d?.rates, vsCode);
  const lines = [`${cur.name} · ${cur.code}${cur.symbol ? ` · ${cur.symbol}` : ''}`];
  if (rate !== null && d?.rates) lines.push(`1 ${cur.code} = ${fmtRate(rate)} ${vsCode} (${new Date(`${d.rates.date}T00:00:00Z`).toLocaleDateString('pt-BR', { timeZone: 'UTC' })})`);
  const ch = cur.code === 'USD' ? null : signedPct(d?.stats?.change_1y);
  if (ch) lines.push(`Em 12 meses: ${ch} contra o dólar`);
  if (d) lines.push('Clique para ver câmbio e economia');
  const label = `${cur.name}${cur.symbol ? ` (${cur.symbol})` : ''}`;
  return (
    <Tooltip text={lines.join('\n')}>
      {(aria) => s.status === 'error'
        ? <span className="chip-plain" tabIndex={0} {...aria}>{label}</span>
        : <Link className="curchip" href={`/moeda/${cur.code.toLowerCase()}`} {...aria}>{label}</Link>}
    </Tooltip>
  );
}
