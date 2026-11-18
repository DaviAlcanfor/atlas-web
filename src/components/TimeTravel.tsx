// Spec 012 (stage 1): the year slider and the panel of a historical entity.
import Link from 'next/link';
import { X } from '@phosphor-icons/react/dist/csr/X';
import { LAST_SOURCE_YEAR, type HistProps } from '../lib/timeTravel';
import { useState } from 'react';
import { api } from '../api';
import type { WikipediaSummary } from '../api/types';
import { useAsync } from '../hooks/useAsync';
import { safeHref } from '../lib/url';
import { formatYear } from '../lib/years';
import type { Era } from '../lib/eras';

export const CLIOPATRIA_CREDIT = 'Fronteiras históricas: Cliopatria (Seshat Global History Databank), CC BY 4.0, simplificadas';

interface BarProps {
  years: number[]; // snapshot years, ascending
  year: number;
  era: Era; // spec 012: the map style of this year
  loading: boolean;
  count: number | null; // entities in the loaded snapshot
  error?: string;
  onYear: (y: number) => void;
  onExit: () => void;
}

/**
 * The slider moves over the LIST of snapshot years, not over time itself: recent centuries have more snapshots, so they get more
 * room. A native range input gives arrows, Home/End and PageUp/PageDown for free.
 */
export function TimeBar({ years, year, era, loading, count, error, onYear, onExit }: BarProps) {
  const i = Math.max(0, years.indexOf(year));
  const step = (d: number) => onYear(years[Math.min(years.length - 1, Math.max(0, i + d))]!);
  return (
    <div className="timebar bracketed" role="group" aria-label="Viagem no tempo">
      <div className="timebar__head">
        <span className="timebar__label">Viagem no tempo</span>
        <output className="timebar__year" htmlFor="timebar-range" aria-live="polite">{formatYear(year)}</output>
        <span className="timebar__meta" role="status">
          {error ?? (loading ? 'carregando o mapa…' : count !== null ? `${count} ${count === 1 ? 'Estado registrado' : 'Estados registrados'}` : '')}
        </span>
        <button className="timebar__exit" onClick={onExit}>Voltar ao presente</button>
      </div>
      <p className="timebar__era">Estilo do mapa: <b>{era.label}</b>
        {era.from !== null || era.to !== null ? ` (${era.from !== null ? formatYear(era.from) : 'até'}${era.from !== null && era.to !== null ? ' – ' : ' '}${era.to !== null ? formatYear(era.to) : 'em diante'})` : ''}</p>
      <div className="timebar__row">
        <button className="icon-btn" onClick={() => step(-1)} disabled={i === 0} aria-label="Retrato anterior">‹</button>
        <input id="timebar-range" type="range" min={0} max={years.length - 1} step={1} value={i}
          aria-valuetext={formatYear(year)} aria-label="Ano" onChange={(e) => onYear(years[Number(e.target.value)]!)} />
        <button className="icon-btn" onClick={() => step(1)} disabled={i === years.length - 1} aria-label="Próximo retrato">›</button>
      </div>
      <div className="timebar__ends" aria-hidden="true"><span>{formatYear(years[0]!)}</span><span>{formatYear(years.at(-1)!)}</span></div>
      <p className="timebar__src">{CLIOPATRIA_CREDIT}. Fronteiras antigas são aproximadas.</p>
    </div>
  );
}

const lifespan = (p: HistProps) =>
  `${formatYear(p.from_year)} – ${p.to_year >= LAST_SOURCE_YEAR ? 'presente' : formatYear(p.to_year)}`;

// Spec 042: one request per Q-id for the whole session (a failure is not cached, so a retry can succeed).
const wikiCache = new Map<string, Promise<WikipediaSummary | null>>();
const loadWiki = (qid: string) => {
  let r = wikiCache.get(qid);
  if (!r) wikiCache.set(qid, r = api.entityWikipedia(qid).catch((e) => { wikiCache.delete(qid); throw e; }));
  return r;
};
const WIKI_LONG = 600;

/** "Na Wikipédia": plain text of the lead + the CC BY-SA attribution. No summary / error = nothing shown (the link below stays). */
function WikiBlock({ qid }: { qid: string }) {
  const req = useAsync(() => loadWiki(qid), qid);
  const [open, setOpen] = useState(false);
  if (req.status === 'loading') return <div className="wiki__sk sk" aria-hidden="true" />;
  if (req.status !== 'ok' || !req.data) return null;
  const w = req.data, url = safeHref(w.url), licence = safeHref(w.license_url);
  const long = w.text.length > WIKI_LONG;
  return (
    <section className="wiki" aria-label="Na Wikipédia">
      <h3 className="wiki__h">Na Wikipédia</h3>
      <p id="wiki-text" lang={w.lang} className={long && !open ? 'wiki__text wiki__text--clamp' : 'wiki__text'}>{w.text}</p>
      {long && <button className="more-btn" aria-expanded={open} aria-controls="wiki-text" onClick={() => setOpen(!open)}>{open ? 'mostrar menos' : 'mostrar mais'}</button>}
      {url && <p><a className="news-link" href={url} target="_blank" rel="noreferrer noopener">Ler mais ↗</a></p>}
      <p className="src">{w.attribution}.{url && <> <a href={url} target="_blank" rel="noreferrer noopener">Artigo</a></>}{licence && <> · <a href={licence} target="_blank" rel="noreferrer noopener">{w.license}</a></>}</p>
    </section>
  );
}

/** `modern` = the present-day country with the same pt-BR name, when there is one (link back to its full panel). */
export function HistPanel({ p, year, modern, onClose }: { p: HistProps; year: number; modern?: string; onClose: () => void }) {
  const wiki = safeHref(p.wikipedia_url);
  return (
    <aside lang="pt-BR" className="panel bracketed" aria-label={`${p.name} em ${formatYear(year)}`}>
      <header className="panel__head">
        <div className="panel__title">
          <span className="panel__code">{formatYear(year)}</span>
          <h2>{p.name}</h2>
        </div>
        <div className="panel__actions">
          <button className="icon-btn" onClick={onClose} aria-label="Fechar painel"><X size={16} weight="light" aria-hidden="true" /></button>
        </div>
      </header>
      {p.name !== p.name_en && <p className="official">{p.name_en}</p>}
      <dl className="clues">
        <div><dt>Existiu de</dt><dd>{lifespan(p)}</dd></div>
        {p.member_of && <div><dt>Fazia parte de</dt><dd>{p.member_of}</dd></div>}
      </dl>
      <p className="warn">Fronteiras antigas são aproximadas: o contorno é uma reconstrução, não um limite demarcado.</p>
      {p.wikidata && <WikiBlock key={p.wikidata} qid={p.wikidata} />}
      {wiki && <a className="news-link" href={wiki} target="_blank" rel="noreferrer noopener">Ler na Wikipédia ↗</a>}
      {modern && <p><Link className="news-link" href={`/pais/${modern.toLowerCase()}`}>Ver {p.name} hoje →</Link></p>}
      <p className="note">Bandeira, capital e governante da época ainda não estão no Atlas (próxima etapa da viagem no tempo).</p>
      <p className="src">{CLIOPATRIA_CREDIT}.{p.wikidata && ` Nome em português: Wikidata (${p.wikidata}), CC0.`}</p>
    </aside>
  );
}
