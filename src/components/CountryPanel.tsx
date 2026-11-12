import { useState, type CSSProperties, type ReactNode } from 'react';
import { api } from '../api';
import { isNotFound } from '../api/client';
import type { CountryDetail, Event, PolityDetail, Source } from '../api/types';
import { useAsync } from '../hooks/useAsync';
import { kindColor } from '../lib/palette';
import { plonkitUrl } from '../lib/plonkit';
import { ArrowsInLineHorizontal } from '@phosphor-icons/react/dist/csr/ArrowsInLineHorizontal';
import { ArrowsOutLineHorizontal } from '@phosphor-icons/react/dist/csr/ArrowsOutLineHorizontal';
import { X } from '@phosphor-icons/react/dist/csr/X';
import { CountUp } from './CountUp';
import { LabelIcon } from './icons';
import { day, safeHref } from '../lib/url';
import { formatRange, formatYear } from '../lib/years';

interface Props {
  iso2: string;
  name: string; // from the polygon, shown while loading and when the API has nothing
  inApi: boolean; // the country is in GET /v1/countries (has a record, curated or not)
  wide: boolean;
  onToggleWide: () => void;
  onClose: () => void;
}

const nf = (n: number) => n.toLocaleString('pt-BR');
// Stable formatters for CountUp (module scope so its effect does not restart on every render).
const fmtInt = (n: number) => nf(Math.round(n));
const fmtKm2 = (n: number) => `${nf(Math.round(n))} km²`;
const fmtDensity = (n: number) => `${nf(Math.round(n))} hab/km²`;
const NoData = () => <span className="nodata">sem dados</span>;
const KIND_LABEL: Record<Event['kind'], string> = {
  political: 'política', war: 'guerra', treaty: 'tratado', cultural: 'cultura', economic: 'economia', other: 'outro',
};

function SourceNote({ ids, sources }: { ids: string[]; sources: Source[] }) {
  const used = sources.filter((s) => ids.includes(s.id));
  if (!used.length) return null;
  return <p className="src">Fonte: {used.map((s) => s.title).join('; ')}</p>;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="psec">
      <h3><LabelIcon label={title} />{title}</h3>
      {children}
    </section>
  );
}

function Chips({ items }: { items: string[] }) {
  if (!items.length) return <NoData />;
  return (
    <ul className="chips">
      {items.map((t) => <li key={t}>{t}</li>)}
    </ul>
  );
}

function Skeleton() {
  return (
    <div className="skeleton" aria-busy="true" aria-label="Carregando dados do país">
      <div className="sk sk--flag" />
      <div className="sk sk--line" style={{ width: '70%' }} />
      <div className="stats">{[0, 1, 2, 3].map((i) => <div key={i} className="sk sk--card" />)}</div>
      <div className="sk sk--line" />
      <div className="sk sk--line" style={{ width: '85%' }} />
      <div className="sk sk--line" style={{ width: '60%' }} />
      <p className="loading-text"><span className="spinner" aria-hidden="true" /> Carregando…</p>
    </div>
  );
}

export function CountryPanel({ iso2, name, inApi, wide, onToggleWide, onClose }: Props) {
  // Not in the API's list (e.g. polygons without an ISO code): nothing to fetch (key null = idle).
  const state = useAsync(() => api.country(iso2), inApi ? iso2 : null);
  const title = state.status === 'ok' ? state.data.name : name;

  let body: ReactNode;
  if (!inApi || (state.status === 'error' && isNotFound(state.error))) {
    body = <p className="empty">Ainda não há dados para este território.</p>;
  } else if (state.status === 'error') {
    body = <p role="alert" className="empty">Não foi possível carregar {name}: {state.error.message}</p>;
  } else if (state.status !== 'ok') {
    body = <Skeleton />;
  } else {
    body = <Details c={state.data} />;
  }

  return (
    <aside lang="pt-BR" className={`panel bracketed${wide ? ' panel--wide' : ''}`} aria-label={`Detalhes de ${title}`}>
      <header className="panel__head">
        <div className="panel__title">
          <span className="panel__code">{iso2}</span>
          <h2>{title}</h2>
        </div>
        <div className="panel__actions">
          <button className="icon-btn" onClick={onToggleWide} aria-pressed={wide} aria-label={wide ? 'Reduzir painel' : 'Expandir painel até metade da tela'}>
            {wide ? <ArrowsInLineHorizontal size={16} weight="light" aria-hidden="true" /> : <ArrowsOutLineHorizontal size={16} weight="light" aria-hidden="true" />}
          </button>
          <button className="icon-btn" onClick={onClose} aria-label="Fechar painel"><X size={16} weight="light" aria-hidden="true" /></button>
        </div>
      </header>
      {body}
    </aside>
  );
}

function Details({ c }: { c: CountryDetail }) {
  const pop = c.population;
  const density = pop && c.area_km2 ? pop.value / c.area_km2 : null;
  const flag = safeHref(c.flag_url);
  const plonk = plonkitUrl(c.iso2);
  const newsHref =`https://news.google.com/search?q=${encodeURIComponent(c.name)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;

  return (
    <>
      <div className="hero">
        {flag ? <img className="flag" src={flag} alt={`Bandeira: ${c.name}`} /> : <div className="flag flag--none">sem bandeira</div>}
        <div>
          {c.official_name && <p className="official">{c.official_name}</p>}
          <ul className="tags">
            {c.region && <li>{c.region}</li>}
            {c.capital && <li>Capital: {c.capital}</li>}
          </ul>
        </div>
      </div>
      {c.summary && <p className="lead">{c.summary}</p>}

      <div className="stats">
        <Stat label="População" value={pop && <CountUp value={pop.value} format={fmtInt} />}
          foot={pop && <>{pop.year !== null && `em ${pop.year}. `}<SourceNote ids={[pop.source_id]} sources={c.sources} /></>} />
        <Stat label="Área" value={c.area_km2 !== null && <CountUp value={c.area_km2} format={fmtKm2} />} />
        <Stat label="Densidade" value={density !== null && <CountUp value={density} format={fmtDensity} />} foot="calculada: população ÷ área" />
        <Stat label="Regime" value={c.regime} small foot={c.regime && 'texto não verificado'} />
      </div>

      <Section title="Idiomas">
        <Chips items={c.languages.map((l) => l.name)} />
      </Section>
      <Section title="Moedas">
        <Chips items={c.currencies.map((x) => `${x.name}${x.symbol ? ` (${x.symbol})` : ''}`)} />
      </Section>
      <Section title="Organizações">
        <Chips items={c.memberships} />
      </Section>

      <Section title="Política hoje">
        {c.politics && (c.politics.system || c.politics.note) ? (
          <div className="card">
            {c.politics.system && <p>{c.politics.system}</p>}
            {c.politics.note && <p className="note">{c.politics.note}</p>}
            <p className="src">{c.politics.updated_at ? `Atualizado em ${day(c.politics.updated_at)}` : 'Data de atualização: sem dados'}</p>
          </div>
        ) : <NoData />}
      </Section>

      <Section title="História">
        <Timeline events={c.timeline} sources={c.sources} />
      </Section>

      <Lineage polityId={c.polity_id} />

      <Section title="Notícias">
        {/* The Atlas API has no news endpoint yet (contract v1.0); we only link out, we never fetch or invent news. */}
        <p className="note">A API do Atlas ainda não fornece notícias.</p>
        <a className="news-link" href={newsHref} target="_blank" rel="noreferrer noopener">Ver notícias sobre {c.name} no Google Notícias ↗</a>
      </Section>

      {plonk && (
        <Section title="GeoGuessr">
          <a className="news-link" href={plonk} target="_blank" rel="noreferrer noopener">Guia Plonk It de {c.name} ↗</a>
          <p className="src">Plonk It é um guia da comunidade de GeoGuessr; o Atlas só aponta para ele.</p>
        </Section>
      )}

      <Section title="Fontes">
        {c.sources.length ? (
          <ul className="sources">
            {c.sources.map((s) => {
              const href = safeHref(s.url);
              return (
                <li key={s.id}>
                  {href ? <a href={href} target="_blank" rel="noreferrer noopener">{s.title}</a> : s.title}
                  {` · licença: ${s.license ?? 'sem dados'}`}
                  {s.retrieved_at && ` · obtido em ${day(s.retrieved_at)}`}
                </li>
              );
            })}
          </ul>
        ) : <NoData />}
        <p className="src">Registro atualizado em {day(c.updated_at)}</p>
      </Section>
    </>
  );
}

function Stat({ label, value, foot, small }: { label: string; value: ReactNode; foot?: ReactNode; small?: boolean }) {
  return (
    <div className="stat">
      <span className="stat__label"><LabelIcon label={label} />{label}</span>
      <span className={`stat__value${small ? ' stat__value--small' : ''}`}>{value || <NoData />}</span>
      {value && foot && <span className="stat__foot">{foot}</span>}
    </div>
  );
}

const LONG_SUMMARY = 220; // characters; longer summaries start collapsed

function LongText({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  if (text.length <= LONG_SUMMARY) return <p className="note">{text}</p>;
  return (
    <>
      <p className={`note${open ? '' : ' clamp'}`}>{text}</p>
      <button className="more-btn" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'ler menos' : 'ler mais'}</button>
    </>
  );
}

export function Timeline({ events, sources }: { events: Event[]; sources: Source[] }) {
  if (!events.length) return <NoData />;
  const kinds = [...new Set(events.map((e) => e.kind))];
  return (
    <>
      {events.some((e) => !e.source_ids.length) && (
        <p className="warn">Não verificado: eventos marcados “sem fonte” ainda não têm fonte na API. Não os trate como história estabelecida.</p>
      )}
      {kinds.length > 1 && (
        <ul className="kind-legend" aria-label="Legenda das cores">
          {kinds.map((k) => <li key={k} style={{ '--accent': kindColor[k] } as CSSProperties}>{KIND_LABEL[k]}</li>)}
        </ul>
      )}
      <ol className="timeline">
        {events.map((e) => (
          <li key={e.id} className={e.year_end !== null ? 'is-span' : undefined} style={{ '--accent': kindColor[e.kind] } as CSSProperties}>
            <span className="year">{e.year_end !== null ? formatRange(e.year_start, e.year_end, e.precision, e.precision) : formatYear(e.year_start, e.precision)}</span>
            <span className="kind">{KIND_LABEL[e.kind]}</span>
            <p className="ev-title">{e.title}</p>
            {e.summary && <LongText text={e.summary} />}
            {!e.source_ids.length && <span className="badge">sem fonte</span>}
          </li>
        ))}
      </ol>
      <SourceNote ids={[...new Set(events.flatMap((e) => e.source_ids))]} sources={sources} />
    </>
  );
}

/** Predecessors/successors/Wikipedia from GET /v1/polities/{id}. Hidden when the API has nothing to add. */
function Lineage({ polityId }: { polityId: string }) {
  const s = useAsync(() => api.polity(polityId), polityId);
  if (s.status !== 'ok') return null;
  const p: PolityDetail = s.data;
  const wiki = safeHref(p.wikipedia?.url);
  if (!p.predecessors.length && !p.successors.length && !wiki && p.names.length < 2) return null;
  const links = (xs: PolityDetail['predecessors']) => xs.map((l) => `${l.name} (${formatYear(l.year)})`);
  return (
    <Section title="Linhagem">
      {p.predecessors.length > 0 && <><p className="sub">Antecessores</p><Chips items={links(p.predecessors)} /></>}
      {p.successors.length > 0 && <><p className="sub">Sucessores</p><Chips items={links(p.successors)} /></>}
      {p.names.length > 1 && <><p className="sub">Nomes ao longo do tempo</p><Chips items={p.names.map((n) => `${n.name} (${formatRange(n.from_year, n.to_year)})`)} /></>}
      {wiki && <a className="news-link" href={wiki} target="_blank" rel="noreferrer noopener">Wikipedia: {p.wikipedia!.title} ↗</a>}
    </Section>
  );
}
