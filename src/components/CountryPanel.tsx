import { useState, type CSSProperties, type ReactNode } from 'react';
import { api } from '../api';
import { isNotFound } from '../api/client';
import type { CountryDetail, Event, PolityDetail, Source } from '../api/types';
import { useAsync } from '../hooks/useAsync';
import { kindColor } from '../lib/palette';
import { plonkitUrl } from '../lib/plonkit';
import { STREETVIEW } from '../lib/streetview';
import { X } from '@phosphor-icons/react/dist/csr/X';
import { Hint } from './Hint';
import { CountUp } from './CountUp';
import { LabelIcon } from './icons';
import { CurrentLeaders, LeadersSection, PeopleSection } from './PeopleSections';
import { CurrencyChip } from './CurrencyChip';
import { LanguagesSection } from './Languages';
import { ProfileSection } from './Profile';
import { HistorySummary, KIND_LABEL } from './HistorySummary';
import { SubdivisionCard } from './SubdivisionCard';
import { IdeologySection } from './Ideologies';
import type { StateRef } from './Globe';
import type { Subdivision } from '../api/types';
import { Section } from './Section';
import { Term } from './Term';
import { splitLeaders } from '../lib/leaders';
import { day, safeHref } from '../lib/url';
import { formatRange, formatYear } from '../lib/years';

interface Props {
  iso2: string;
  name: string; // from the polygon, shown while loading and when the API has nothing
  inApi: boolean; // the country is in GET /v1/countries (has a record, curated or not)
  initial?: CountryDetail; // already fetched on the server (/pais/[iso2]); without it the panel fetches in the browser
  lat?: number; // latitude of the country's label point (globe data); feeds the hemisphere clue
  subdivision?: { ref: StateRef; facts: Subdivision | undefined }; // spec 024: clicked state
  onCloseSubdivision?: () => void;
  onClose: () => void;
}

const nf = (n: number) => n.toLocaleString('pt-BR');
// Stable formatters for CountUp (module scope so its effect does not restart on every render).
const fmtInt = (n: number) => nf(Math.round(n));
const fmtKm2 = (n: number) => `${nf(Math.round(n))} km²`;
const fmtDensity = (n: number) => `${nf(Math.round(n))} hab/km²`;
const NoData = () => <span className="nodata">sem dados</span>;

function SourceNote({ ids, sources }: { ids: string[]; sources: Source[] }) {
  const used = sources.filter((s) => ids.includes(s.id));
  if (!used.length) return null;
  return <p className="src">Fonte: {used.map((s) => s.title).join('; ')}</p>;
}

function Chips({ items, render }: { items: string[]; render?: (t: string) => ReactNode }) {
  if (!items.length) return <NoData />;
  return (
    <ul className="chips">
      {items.map((t) => <li key={t}>{render ? render(t) : t}</li>)}
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

export function CountryPanel({ iso2, name, inApi, initial, lat, subdivision, onCloseSubdivision, onClose }: Props) {
  // Not in the API's list (e.g. polygons without an ISO code) or already loaded on the server: nothing to fetch (key null = idle).
  const fetched = useAsync(() => api.country(iso2), inApi && !initial ? iso2 : null);
  const state: typeof fetched = initial ? { status: 'ok', data: initial } : fetched;
  const title = state.status === 'ok' ? state.data.name : name;

  let body: ReactNode;
  if (!inApi || (state.status === 'error' && isNotFound(state.error))) {
    body = <p className="empty">Ainda não há dados para este território.</p>;
  } else if (state.status === 'error') {
    body = <p role="alert" className="empty">Não foi possível carregar {name}: {state.error.message}</p>;
  } else if (state.status !== 'ok') {
    body = <Skeleton />;
  } else {
    body = <Details c={state.data} lat={lat} />;
  }

  return (
    <aside lang="pt-BR" className="panel bracketed" aria-label={`Detalhes de ${title}`}>
      <header className="panel__head">
        <div className="panel__title">
          <span className="panel__code">{iso2}</span>
          <h2>{title}</h2>
        </div>
        <div className="panel__actions">
          <button className="icon-btn" onClick={onClose} aria-label="Fechar painel"><X size={16} weight="light" aria-hidden="true" /></button>
        </div>
      </header>
      {subdivision && <SubdivisionCard key={subdivision.ref.id ?? subdivision.ref.name} name={subdivision.ref.name} facts={subdivision.facts} onClose={() => onCloseSubdivision?.()} />}
      {body}
    </aside>
  );
}

function Details({ c, lat }: { c: CountryDetail; lat?: number }) {
  const pop = c.population;
  const density = pop && c.area_km2 ? pop.value / c.area_km2 : null;
  const flag = safeHref(c.flag_url);
  const plonk = plonkitUrl(c.iso2);
  // v1.1 endpoints: production may still be v1.0, so an error (404, network) just means "no leaders" and the sections stay hidden.
  const leadersState = useAsync(() => api.leaders(c.iso2), c.iso2);
  const leaders = leadersState.status === 'ok' ? leadersState.data : [];
  const current = splitLeaders(leaders).current;
  const clues = c.clues;
  const clueRows: [string, string][] = clues
    ? ([
        ['Lado da direção', clues.driving_side === 'left' ? 'esquerda' : clues.driving_side === 'right' ? 'direita' : ''],
        ['DDI', clues.calling_code ?? ''],
        ['Domínio', clues.tld ?? ''],
        ['Placa', clues.plate_code ?? ''],
        [clues.scripts.length > 1 ? 'Alfabetos' : 'Alfabeto', clues.scripts.join(', ')],
      ] as [string, string][]).filter(([, v]) => v)
    : [];
  const sv = STREETVIEW[c.iso2];
  const geoRows: [string, string][] = [
    ['Street View', sv === 'full' ? 'cobertura pública' : sv === 'partial' ? 'cobertura restrita' : 'sem cobertura oficial'],
    ...(lat !== undefined ? [hemisphere(lat)] : []),
  ];
  const newsHref =`https://news.google.com/search?q=${encodeURIComponent(c.name)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;

  return (
    <>
      <div className="hero">
        {flag ? <img className="flag" src={flag} alt={`Bandeira: ${c.name}`} /> : <div className="flag flag--none">sem bandeira</div>}
        <div>
          {c.official_name && <p className="official">{c.official_name}</p>}
          <ul className="tags">
            {c.region && <li>Região<Hint k="Região" />: <Term label={c.region}>{c.region}</Term></li>}
            {c.capital && <li>Capital<Hint k="Capital" />: {c.capital}</li>}
          </ul>
        </div>
      </div>
      {c.summary && <p className="lead">{c.summary}</p>}

      <div className="stats">
        <Stat label="População" value={pop && <CountUp value={pop.value} format={fmtInt} />}
          foot={pop && <>{pop.year !== null && `em ${pop.year}. `}<SourceNote ids={[pop.source_id]} sources={c.sources} /></>} />
        <Stat label="Área" value={c.area_km2 !== null && <CountUp value={c.area_km2} format={fmtKm2} />} />
        <Stat label="Densidade" value={density !== null && <CountUp value={density} format={fmtDensity} />} foot="calculada: população ÷ área" />
        <Stat label="Regime" value={c.regime && <Term id={c.regime_id}>{c.regime}</Term>} small foot={c.regime && !c.regime_id && 'texto não verificado'} />
      </div>

      <ProfileSection iso2={c.iso2} />

      {c.languages_spoken?.length ? <LanguagesSection items={c.languages_spoken} /> : (
        <Section title="Idiomas">
          <Chips items={c.languages.map((l) => l.name)} />
        </Section>
      )}
      <Section title="Moedas">
        {c.currencies.length ? <ul className="chips">{c.currencies.map((x) => <li key={x.code} className="chips__li"><CurrencyChip cur={x} /></li>)}</ul> : <NoData />}
      </Section>
      <Section title="Organizações">
        <Chips items={c.memberships} render={(m) => <Term label={m}>{m}</Term>} />
      </Section>

      <Section title="Política hoje">
        {(c.politics && (c.politics.system || c.politics.note)) || current.length ? (
          <div className="card">
            <CurrentLeaders items={current} />
            {c.politics?.system && <p>{c.politics.system}</p>}
            {c.politics?.note && <p className="note">{c.politics.note}</p>}
            {c.politics && <p className="src">{c.politics.updated_at ? `Atualizado em ${day(c.politics.updated_at)}` : 'Data de atualização: sem dados'}</p>}
          </div>
        ) : <NoData />}
      </Section>

      <LeadersSection items={leaders} />
      <IdeologySection iso2={c.iso2} />
      <PeopleSection iso2={c.iso2} />

      <Section title="História">
        <HistorySummary iso2={c.iso2} curated={c.timeline}
          renderTimeline={(events, sources) => <Timeline events={events} sources={sources.length ? sources : c.sources} />} />
      </Section>

      <Lineage polityId={c.polity_id} />

      <Section title="Notícias">
        {/* The Atlas API has no news endpoint yet (contract v1.0); we only link out, we never fetch or invent news. */}
        <p className="note">A API do Atlas ainda não fornece notícias.</p>
        <a className="news-link" href={newsHref} target="_blank" rel="noreferrer noopener">Ver notícias sobre {c.name} no Google Notícias ↗</a>
      </Section>

      {(plonk || clueRows.length > 0 || geoRows.length > 0) && (
        <Section title="GeoGuessr">
          {plonk && (
            <>
              <a className="news-link" href={plonk} target="_blank" rel="noreferrer noopener">Guia Plonk It de {c.name} ↗</a>
              <p className="src">Plonk It é um guia da comunidade de GeoGuessr; o Atlas só aponta para ele.</p>
            </>
          )}
          <h4 className="subhead"><LabelIcon label="Pistas" />Pistas<Hint k="Pistas" /></h4>
          <dl className="clues">
            {[...geoRows, ...clueRows].map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
          </dl>
          <p className="src">Street View: Wikipedia, “Google Street View coverage” (CC BY-SA 4.0). Hemisfério: calculado pela posição do país no mapa.</p>
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

/** Hemisphere clue from the label point's latitude: in GeoGuessr the sun at midday points to the equator. */
export function hemisphere(lat: number): [string, string] {
  if (Math.abs(lat) < 10) return ['Hemisfério', 'perto do Equador: sol quase a pino ao meio-dia'];
  const most = Math.abs(lat) < 23.44 ? ' na maior parte do ano' : ''; // inside the tropics the sun crosses overhead in summer
  return lat > 0 ? ['Hemisfério', `norte: ao meio-dia o sol fica ao sul${most}`] : ['Hemisfério', `sul: ao meio-dia o sol fica ao norte${most}`];
}

function Stat({ label, value, foot, small }: { label: string; value: ReactNode; foot?: ReactNode; small?: boolean }) {
  return (
    <div className="stat">
      <span className="stat__label"><LabelIcon label={label} />{label}<Hint k={label} /></span>
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
