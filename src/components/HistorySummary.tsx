import { useState } from 'react';
import { api } from '../api';
import { useAsync } from '../hooks/useAsync';
import { safeHref } from '../lib/url';
import { formatRange, formatYear } from '../lib/years';

const years = (a: number | null, b: number | null) =>
  a !== null ? (a === b ? formatYear(a) : formatRange(a, b)) : b !== null ? `até ${formatYear(b)}` : null; // end null = "presente"

/**
 * Spec 016 stage 1: the country's history in running text, condensed from the pt.wikipedia "História de X" article (CC BY-SA 4.0,
 * exact revision linked). Periods are native <details> (keyboard and screen reader for free). Any failure = nothing rendered.
 */
export function HistorySummary({ iso2 }: { iso2: string }) {
  const s = useAsync(() => api.history(iso2), iso2);
  const [open, setOpen] = useState(false);
  if (s.status !== 'ok' || (!s.data.summary && !s.data.periods.length)) return null;
  const { summary, periods, sources } = s.data;
  const paras = summary?.split(/\n\s*\n/) ?? [];
  const src = sources[0];
  const href = safeHref(src?.url);
  return (
    <div className="hsum">
      {paras.length > 0 && (
        <>
          <div className={open ? 'hsum__text' : 'hsum__text is-short'}>{paras.map((p, i) => <p key={i}>{p}</p>)}</div>
          <button className="more-btn" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'ler menos' : 'ler o resumo inteiro'}</button>
        </>
      )}
      {periods.length > 0 && (
        <>
          <p className="sub">Períodos</p>
          <ol className="periods">
            {periods.map((p) => {
              const y = years(p.year_start, p.year_end);
              return (
                <li key={p.id}>
                  <details>
                    <summary><span className="periods__title">{p.title}</span>{y && <span className="periods__years mono">{y}</span>}</summary>
                    {p.summary.split(/\n\s*\n/).map((t, i) => <p key={i}>{t}</p>)}
                  </details>
                </li>
              );
            })}
          </ol>
        </>
      )}
      {src && (
        <p className="src">
          Texto condensado de {href ? <a href={href} target="_blank" rel="noreferrer noopener">{src.title}</a> : src.title}
          {src.license && ` · licença: ${src.license}`}{src.retrieved_at && ` · obtido em ${src.retrieved_at.slice(0, 10)}`}
        </p>
      )}
    </div>
  );
}
