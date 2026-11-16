// Spec 029 phase 2: "O que exporta" and "Com quem negocia" (BACI, CEPII). The route is not in the contract yet: any failure
// (404, route missing, network) hides both sections, with no banner.
import Link from 'next/link';
import type { ReactNode } from 'react';
import { api } from '../api';
import type { CountryTrade } from '../api/types';
import { useAsync } from '../hooks/useAsync';
import { compact } from '../lib/currency';
import { pct } from '../lib/profile';
import { safeHref } from '../lib/url';
import { countryPath } from '../state';
import { FlagName } from './Block';
import { Section } from './Section';

// One request per country per page load, shared by the panel and the globe arcs (Shell). Failures are cached too: no retry storm on a 404.
const cache = new Map<string, Promise<CountryTrade>>();
export const loadTrade = (iso2: string) => { let p = cache.get(iso2); if (!p) cache.set(iso2, (p = api.trade(iso2))); return p; };

const regionNames = new Intl.DisplayNames(['pt-BR'], { type: 'region' });
const nameOf = (iso: string) => { try { return regionNames.of(iso) ?? iso; } catch { return iso; } };

/** Rows of label + share, each with a bar scaled to the list's largest share. */
function ShareList({ items }: { items: { key: string; label: ReactNode; share: number; value: number }[] }) {
  const max = Math.max(...items.map((i) => i.share), 1e-9);
  return (
    <ul className="shares">
      {items.map((i) => (
        <li key={i.key}>
          <span className="shares__label">{i.label}</span>
          <span className="shares__value">{pct(i.share)} <small>US$ {compact(i.value)}</small></span>
          <i className="shares__bar" style={{ width: `${(i.share / max) * 100}%` }} aria-hidden="true" />
        </li>
      ))}
    </ul>
  );
}

const partners = (xs: CountryTrade['top_destinations']) => xs.map((p) => ({
  key: p.iso2, share: p.share, value: p.value_usd,
  label: <Link href={countryPath(p.iso2)} scroll={false} className="shares__link"><FlagName iso={p.iso2} name={nameOf(p.iso2)} /></Link>,
}));

function Foot({ t }: { t: CountryTrade }) {
  return (
    <p className="src">
      {t.year} · {t.sources.length ? t.sources.map((s, n) => {
        const href = safeHref(s.url);
        return <span key={s.id}>{n > 0 && '; '}{href ? <a href={href} target="_blank" rel="noreferrer noopener">{s.title}</a> : s.title}{s.license && ` (${s.license})`}</span>;
      }) : 'fonte: sem dados'}
    </p>
  );
}

export function TradeSection({ iso2 }: { iso2: string }) {
  const s = useAsync(() => loadTrade(iso2), iso2);
  if (s.status !== 'ok') return null;
  const t = s.data;
  return (
    <>
      {t.top_exports.length > 0 && (
        <Section title="O que exporta">
          <p className="note">Exportou US$ {compact(t.exports_usd)} e importou US$ {compact(t.imports_usd)} em mercadorias em {t.year}. Principais produtos (fatia das exportações):</p>
          <ShareList items={t.top_exports.map((x) => ({ key: x.hs, label: <>{x.label} <small className="mono">SH {x.hs}</small></>, share: x.share, value: x.value_usd }))} />
          <Foot t={t} />
        </Section>
      )}
      {(t.top_destinations.length > 0 || t.top_origins.length > 0) && (
        <Section title="Com quem negocia">
          {t.top_destinations.length > 0 && <><h4 className="subhead">Para onde vende (fatia das exportações)</h4><ShareList items={partners(t.top_destinations)} /></>}
          {t.top_origins.length > 0 && <><h4 className="subhead">De onde compra (fatia das importações)</h4><ShareList items={partners(t.top_origins)} /></>}
          <Foot t={t} />
        </Section>
      )}
    </>
  );
}
