import type { ReactNode } from 'react';
import { api } from '../api';
import { isNotFound } from '../api/client';
import type { CountryDetail, Source } from '../api/types';
import { useAsync } from '../hooks/useAsync';
import { day, safeHref } from '../lib/url';
import { formatRange, formatYear } from '../lib/years';

interface Props {
  iso2: string;
  name: string; // from the polygon, shown while loading and when the API has nothing
  inApi: boolean; // the country is in GET /v1/countries (has a record, curated or not)
  onClose: () => void;
}

const NoData = () => <span className="nodata">no data</span>;
const Row = ({ label, children }: { label: string; children: ReactNode }) => (
  <>
    <dt>{label}</dt>
    <dd>{children}</dd>
  </>
);
const list = (xs: string[]) => (xs.length ? xs.join(', ') : <NoData />);

function SourceNote({ ids, sources }: { ids: string[]; sources: Source[] }) {
  const used = sources.filter((s) => ids.includes(s.id));
  if (!used.length) return null;
  return <p className="src">Source: {used.map((s) => s.title).join('; ')}</p>;
}

export function CountryPanel({ iso2, name, inApi, onClose }: Props) {
  // Not in the API's list (e.g. polygons without an ISO code): nothing to fetch (key null = idle).
  const state = useAsync(() => api.country(iso2), inApi ? iso2 : null);

  let body: ReactNode;
  if (!inApi || (state.status === 'error' && isNotFound(state.error))) {
    body = <p>No data yet for this country.</p>;
  } else if (state.status === 'error') {
    body = <p role="alert">Could not load {name}: {state.error.message}</p>;
  } else if (state.status !== 'ok') {
    body = <p aria-busy="true">Loading…</p>;
  } else {
    body = <Details c={state.data} />;
  }

  return (
    <aside className="panel" aria-label={`${name} details`}>
      <header className="panel__head">
        <h2>{name}</h2>
        <button className="panel__close" onClick={onClose} aria-label="Close panel">×</button>
      </header>
      {body}
    </aside>
  );
}

function Details({ c }: { c: CountryDetail }) {
  const pop = c.population;
  return (
    <>
      {c.flag_url && safeHref(c.flag_url) && <img className="flag" src={c.flag_url} alt={`Flag of ${c.name}`} />}
      {c.official_name && <p className="official">{c.official_name}</p>}
      {c.summary && <p>{c.summary}</p>}
      <dl>
        <Row label="Capital">{c.capital ?? <NoData />}</Row>
        <Row label="Region">{c.region ?? <NoData />}</Row>
        <Row label="Regime">{c.regime ?? <NoData />}</Row>
        <Row label="Languages">{list(c.languages.map((l) => l.name))}</Row>
        <Row label="Currencies">{list(c.currencies.map((x) => `${x.name}${x.symbol ? ` (${x.symbol})` : ''}`))}</Row>
        <Row label="Population">
          {pop ? (
            <>
              {pop.value.toLocaleString('pt-BR')}
              {pop.year !== null && ` (${pop.year})`}
              <SourceNote ids={[pop.source_id]} sources={c.sources} />
            </>
          ) : (
            <NoData />
          )}
        </Row>
        <Row label="Area">{c.area_km2 !== null ? `${c.area_km2.toLocaleString('pt-BR')} km²` : <NoData />}</Row>
        <Row label="Memberships">{list(c.memberships)}</Row>
      </dl>

      <h3>Politics today</h3>
      {c.politics && (c.politics.system || c.politics.note) ? (
        <>
          {c.politics.system && <p>{c.politics.system}</p>}
          {c.politics.note && <p className="note">{c.politics.note}</p>}
          <p className="src">{c.politics.updated_at ? `Updated ${day(c.politics.updated_at)}` : 'Update date: no data'}</p>
        </>
      ) : (
        <p><NoData /></p>
      )}

      <h3>History</h3>
      {c.timeline.length ? (
        <>
          {c.timeline.some((e) => !e.source_ids.length) && (
            <p className="warn">Unverified: events marked “no source” have no source in the API yet. Do not treat them as established history.</p>
          )}
          <ol className="timeline">
            {c.timeline.map((e) => (
              <li key={e.id}>
                <span className="year">{e.year_end !== null ? formatRange(e.year_start, e.year_end, e.precision, e.precision) : formatYear(e.year_start, e.precision)}</span>{' '}
                {e.title}
                {e.summary && <span className="note"> — {e.summary}</span>}
                {!e.source_ids.length && <span className="badge"> no source</span>}
              </li>
            ))}
          </ol>
          <SourceNote ids={[...new Set(c.timeline.flatMap((e) => e.source_ids))]} sources={c.sources} />
        </>
      ) : (
        <p><NoData /></p>
      )}

      <h3>Sources</h3>
      {c.sources.length ? (
        <ul className="sources">
          {c.sources.map((s) => {
            const href = safeHref(s.url);
            return (
              <li key={s.id}>
                {href ? <a href={href} target="_blank" rel="noreferrer noopener">{s.title}</a> : s.title}
                {` · license: ${s.license ?? 'no data'}`}
                {s.retrieved_at && ` · retrieved ${day(s.retrieved_at)}`}
              </li>
            );
          })}
        </ul>
      ) : (
        <p><NoData /></p>
      )}
      <p className="src">Record updated {day(c.updated_at)}</p>
    </>
  );
}
