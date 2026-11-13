// Spec 012 (stage 1): the year slider and the panel of a historical entity.
import Link from 'next/link';
import { X } from '@phosphor-icons/react/dist/csr/X';
import { LAST_SOURCE_YEAR, type HistProps } from '../lib/timeTravel';
import { safeHref } from '../lib/url';
import { formatYear } from '../lib/years';

export const CLIOPATRIA_CREDIT = 'Fronteiras históricas: Cliopatria (Seshat Global History Databank), CC BY 4.0, simplificadas';

interface BarProps {
  years: number[]; // snapshot years, ascending
  year: number;
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
export function TimeBar({ years, year, loading, count, error, onYear, onExit }: BarProps) {
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
      {wiki && <a className="news-link" href={wiki} target="_blank" rel="noreferrer noopener">Ler na Wikipédia ↗</a>}
      {modern && <p><Link className="news-link" href={`/pais/${modern.toLowerCase()}`}>Ver {p.name} hoje →</Link></p>}
      <p className="note">Bandeira, capital e governante da época ainda não estão no Atlas (próxima etapa da viagem no tempo).</p>
      <p className="src">{CLIOPATRIA_CREDIT}.{p.wikidata && ` Nome em português: Wikidata (${p.wikidata}), CC0.`}</p>
    </aside>
  );
}
