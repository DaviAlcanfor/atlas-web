import { useState, type ReactNode } from 'react';
import { api } from '../api';
import type { CountryHistory, Event, Source } from '../api/types';
import { useAsync } from '../hooks/useAsync';
import { safeHref } from '../lib/url';
import { formatRange, formatYear } from '../lib/years';

type HistoryEvent = CountryHistory['events'][number];

export const KIND_LABEL: Record<Event['kind'], string> = {
  political: 'política', war: 'guerra', treaty: 'tratado', cultural: 'cultura', economic: 'economia', other: 'outro',
};

const years = (a: number | null, b: number | null) =>
  a !== null ? (a === b ? formatYear(a) : formatRange(a, b)) : b !== null ? `até ${formatYear(b)}` : null; // end null = "presente"

/** Same rule as the API's event_count: a period without any year holds no events. */
export const inPeriod = (y: number, start: number | null, end: number | null) =>
  (start !== null || end !== null) && (start === null || y >= start) && (end === null || y <= end);

/** Wikidata event -> the curated timeline's shape, so the same Timeline component draws both. */
const asEvent = (e: HistoryEvent): Event => ({
  id: e.id, year_start: e.year_start, year_end: e.year_end, precision: 'exact', title: e.title, summary: e.summary ?? '',
  kind: e.kind, source_ids: ['wikidata'],
});

function SourceLine({ src, prefix }: { src: Source | undefined; prefix: string }) {
  if (!src) return null;
  const href = safeHref(src.url);
  return (
    <p className="src">
      {prefix} {href ? <a href={href} target="_blank" rel="noreferrer noopener">{src.title}</a> : src.title}
      {src.license && ` · licença: ${src.license}`}{src.retrieved_at && ` · obtido em ${src.retrieved_at.slice(0, 10)}`}
    </p>
  );
}

/**
 * Spec 016: the "História" section.
 * Stage 1: running-text summary + periods, condensed from the pt.wikipedia "História de X" article (exact revision linked).
 * Stage 2: notable events from Wikidata (automatic, labelled so), listed inside the periods they fall in and as the "Marcos" timeline.
 * `curated` (CountryDetail.timeline) is shown when the API has no events; any failure of /history = the curated timeline alone.
 */
export function HistorySummary({ iso2, curated, renderTimeline }: {
  iso2: string;
  curated: Event[];
  renderTimeline: (events: Event[], sources: Source[]) => ReactNode;
}) {
  const s = useAsync(() => api.history(iso2), iso2);
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Event['kind'] | null>(null); // spec 016: filter of the "Marcos" timeline
  const h = s.status === 'ok' ? s.data : null;
  const events = h?.events ?? [];
  const wiki = h?.sources.find((x) => x.id === 'wikipedia-pt');
  const wikidata = h?.sources.find((x) => x.id === 'wikidata');
  const paras = h?.summary?.split(/\n\s*\n/) ?? [];
  const kinds = (Object.keys(KIND_LABEL) as Event['kind'][]).filter((k) => events.some((e) => e.kind === k));
  return (
    <div className="hsum">
      {paras.length > 0 && (
        <>
          <div className={open ? 'hsum__text' : 'hsum__text is-short'}>{paras.map((p, i) => <p key={i}>{p}</p>)}</div>
          <button className="more-btn" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'ler menos' : 'ler o resumo inteiro'}</button>
        </>
      )}
      {h && h.periods.length > 0 && (
        <>
          <p className="sub">Períodos</p>
          <ol className="periods">
            {h.periods.map((p) => {
              const y = years(p.year_start, p.year_end);
              const mine = events.filter((e) => inPeriod(e.year_start, p.year_start, p.year_end));
              return (
                <li key={p.id}>
                  <details>
                    <summary>
                      <span className="periods__title">{p.title}</span>
                      {p.event_count > 0 && <span className="periods__n">{p.event_count} {p.event_count === 1 ? 'marco' : 'marcos'}</span>}
                      {y && <span className="periods__years mono">{y}</span>}
                    </summary>
                    {p.summary.split(/\n\s*\n/).map((t, i) => <p key={i}>{t}</p>)}
                    {mine.length > 0 && (
                      <ul className="periods__events">
                        {mine.map((e) => {
                          const href = safeHref(e.wikipedia_url);
                          return (
                            <li key={e.id}>
                              <span className="mono">{formatYear(e.year_start)}</span>
                              {href ? <a href={href} target="_blank" rel="noreferrer noopener">{e.title}</a> : e.title}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </details>
                </li>
              );
            })}
          </ol>
        </>
      )}
      <SourceLine src={wiki} prefix="Texto condensado de" />
      {events.length > 0 ? (
        <>
          <p className="sub">Marcos</p>
          <p className="note">Eventos mais citados do país e dos Estados que o antecederam, reunidos automaticamente do Wikidata (sem revisão humana).</p>
          {kinds.length > 1 && (
            <div className="filters" role="group" aria-label="Filtrar marcos por tipo">
              <button aria-pressed={kind === null} onClick={() => setKind(null)}>Todos</button>
              {kinds.map((k) => <button key={k} aria-pressed={kind === k} onClick={() => setKind(k)}>{KIND_LABEL[k]}</button>)}
            </div>
          )}
          {renderTimeline(events.filter((e) => !kind || e.kind === kind).map(asEvent), wikidata ? [wikidata] : [])}
        </>
      ) : curated.length > 0 && (
        <>
          <p className="sub">Marcos</p>
          {renderTimeline(curated, [])}
        </>
      )}
    </div>
  );
}
