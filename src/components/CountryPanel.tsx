import type { CSSProperties, ReactNode } from 'react';
import { api } from '../api';
import { isNotFound } from '../api/client';
import type { CountryDetail, Event, PolityDetail, Source } from '../api/types';
import { useAsync } from '../hooks/useAsync';
import { kindColor } from '../lib/palette';
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
const NoData = () => <span className="nodata">sem dados</span>;
const KIND_LABEL: Record<Event['kind'], string> = {
  political: 'política', war: 'guerra', treaty: 'tratado', cultural: 'cultura', economic: 'economia', other: 'outro',
};

function SourceNote({ ids, sources }: { ids: string[]; sources: Source[] }) {
  const used = sources.filter((s) => ids.includes(s.id));
  if (!used.length) return null;
  return <p className="src">Fonte: {used.map((s) => s.title).join('; ')}</p>;
}

function Section({ title, accent, children }: { title: string; accent: string; children: ReactNode }) {
  return (
    <section className="psec" style={{ '--accent': accent } as CSSProperties}>
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function Chips({ items, accent }: { items: string[]; accent: string }) {
  if (!items.length) return <NoData />;
  return (
    <ul className="chips" style={{ '--accent': accent } as CSSProperties}>
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
    <aside lang="pt-BR" className={`panel${wide ? ' panel--wide' : ''}`} aria-label={`Detalhes de ${title}`}>
      <header className="panel__head">
        <h2>{title}</h2>
        <div className="panel__actions">
          <button className="icon-btn" onClick={onToggleWide} aria-pressed={wide} aria-label={wide ? 'Reduzir painel' : 'Expandir painel até metade da tela'}>
            {wide ? '⇥' : '⇤'}
          </button>
          <button className="icon-btn" onClick={onClose} aria-label="Fechar painel">×</button>
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
  const newsHref = `https://news.google.com/search?q=${encodeURIComponent(c.name)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;

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
        <Stat label="População" accent="var(--c-accent-teal)" value={pop ? nf(pop.value) : null}
          foot={pop && <>{pop.year !== null && `em ${pop.year} · `}<SourceNote ids={[pop.source_id]} sources={c.sources} /></>} />
        <Stat label="Área" accent="var(--c-accent-amber)" value={c.area_km2 !== null ? `${nf(Math.round(c.area_km2))} km²` : null} />
        <Stat label="Densidade" accent="var(--c-accent-green)" value={density !== null ? `${nf(Math.round(density))} hab/km²` : null} foot="calculada: população ÷ área" />
        <Stat label="Regime" accent="var(--c-accent-violet)" value={c.regime} small foot={c.regime && 'texto não verificado'} />
      </div>

      <Section title="Idiomas" accent="var(--c-accent-teal)">
        <Chips items={c.languages.map((l) => l.name)} accent="var(--c-accent-teal)" />
      </Section>
      <Section title="Moedas" accent="var(--c-accent-amber)">
        <Chips items={c.currencies.map((x) => `${x.name}${x.symbol ? ` (${x.symbol})` : ''}`)} accent="var(--c-accent-amber)" />
      </Section>
      <Section title="Organizações" accent="var(--c-accent-violet)">
        <Chips items={c.memberships} accent="var(--c-accent-violet)" />
      </Section>

      <Section title="Política hoje" accent="var(--c-accent-coral)">
        {c.politics && (c.politics.system || c.politics.note) ? (
          <div className="card">
            {c.politics.system && <p>{c.politics.system}</p>}
            {c.politics.note && <p className="note">{c.politics.note}</p>}
            <p className="src">{c.politics.updated_at ? `Atualizado em ${day(c.politics.updated_at)}` : 'Data de atualização: sem dados'}</p>
          </div>
        ) : <NoData />}
      </Section>

      <Section title="História" accent="var(--c-accent-violet)">
        <Timeline events={c.timeline} sources={c.sources} />
      </Section>

      <Lineage polityId={c.polity_id} />

      <Section title="Notícias" accent="var(--c-accent-coral)">
        {/* The Atlas API has no news endpoint yet (contract v1.0); we only link out, we never fetch or invent news. */}
        <p className="note">A API do Atlas ainda não fornece notícias.</p>
        <a className="news-link" href={newsHref} target="_blank" rel="noreferrer noopener">Ver notícias sobre {c.name} no Google Notícias ↗</a>
      </Section>

      <Section title="Fontes" accent="var(--c-label)">
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

function Stat({ label, value, accent, foot, small }: { label: string; value: string | null; accent: string; foot?: ReactNode; small?: boolean }) {
  return (
    <div className="stat" style={{ '--accent': accent } as CSSProperties}>
      <span className="stat__label">{label}</span>
      <span className={`stat__value${small ? ' stat__value--small' : ''}`}>{value ?? <NoData />}</span>
      {value && foot && <span className="stat__foot">{foot}</span>}
    </div>
  );
}

function Timeline({ events, sources }: { events: Event[]; sources: Source[] }) {
  if (!events.length) return <NoData />;
  return (
    <>
      {events.some((e) => !e.source_ids.length) && (
        <p className="warn">Não verificado: eventos marcados “sem fonte” ainda não têm fonte na API. Não os trate como história estabelecida.</p>
      )}
      <ol className="timeline">
        {events.map((e) => (
          <li key={e.id} style={{ '--accent': kindColor[e.kind] } as CSSProperties}>
            <span className="year">{e.year_end !== null ? formatRange(e.year_start, e.year_end, e.precision, e.precision) : formatYear(e.year_start, e.precision)}</span>
            <span className="kind">{KIND_LABEL[e.kind]}</span>
            <p className="ev-title">{e.title}</p>
            {e.summary && <p className="note">{e.summary}</p>}
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
    <Section title="Linhagem" accent="var(--c-accent-green)">
      {p.predecessors.length > 0 && <><p className="sub">Antecessores</p><Chips items={links(p.predecessors)} accent="var(--c-accent-green)" /></>}
      {p.successors.length > 0 && <><p className="sub">Sucessores</p><Chips items={links(p.successors)} accent="var(--c-accent-green)" /></>}
      {p.names.length > 1 && <><p className="sub">Nomes ao longo do tempo</p><Chips items={p.names.map((n) => `${n.name} (${formatRange(n.from_year, n.to_year)})`)} accent="var(--c-accent-green)" /></>}
      {wiki && <a className="news-link" href={wiki} target="_blank" rel="noreferrer noopener">Wikipedia: {p.wikipedia!.title} ↗</a>}
    </Section>
  );
}
