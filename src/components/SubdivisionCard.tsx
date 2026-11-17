import { X } from '@phosphor-icons/react/dist/csr/X';
import type { Source, Subdivision } from '../api/types';
import { safeHref } from '../lib/url';

const nf = (n: number) => n.toLocaleString('pt-BR');
const date = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

/**
 * Spec 024: the clicked state at the top of the country panel. `facts` undefined = the API has nothing (polygon name only).
 * Phase 2 (CR-011): HDI (Global Data Lab) and the current head (Wikipedia list, linked by `head.source_id` in `sources`).
 */
export function SubdivisionCard({ name, facts, sources = [], onClose }: { name: string; facts: Subdivision | undefined; sources?: Source[]; onClose: () => void }) {
  const flag = facts?.flag;
  const src = safeHref(flag?.url);
  const { hdi, head } = facts ?? {};
  const headSrc = head ? sources.find((x) => x.id === head.source_id) : undefined;
  const headHref = safeHref(headSrc?.url);
  const rows: [string, string][] = facts
    ? ([
        ['Capital', facts.capital ?? ''],
        ['População', facts.population ? `${nf(facts.population.value)}${facts.population.year ? ` (${facts.population.year})` : ''}` : ''],
        ['Área', facts.area_km2 !== null ? `${nf(Math.round(facts.area_km2))} km²` : ''],
        [head?.office ?? 'Chefe do governo', head ? `${head.name}${head.since ? ` (desde ${date(head.since)})` : ''}` : ''],
        ['IDH', hdi ? `${hdi.value.toLocaleString('pt-BR', { minimumFractionDigits: 3 })} (${hdi.year})` : ''],
        ['DDD (código de área)', facts.area_codes.join(', ')],
        ['Código', facts.code ?? ''],
      ] as [string, string][]).filter(([, v]) => v)
    : [];
  return (
    <section className="subcard" aria-label={`Estado: ${facts?.name ?? name}`}>
      <header className="subcard__head">
        {src ? <img className="subcard__flag" src={src} alt={`Bandeira: ${facts?.name ?? name}`} /> : <div className="subcard__flag subcard__flag--none">sem bandeira</div>}
        <div className="subcard__title">
          <span className="subcard__kind">Estado / província</span>
          <h3>{facts?.name ?? name}</h3>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="Voltar ao país"><X size={14} weight="light" aria-hidden="true" /></button>
      </header>
      {rows.length ? (
        <dl className="clues">{rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
      ) : <p className="nodata">sem dados</p>}
      <p className="src">
        Fonte: Wikidata (CC0){(facts?.area_codes.length ?? 0) > 0 && facts?.code?.startsWith('BR-') ? '; DDD: Anatel' : ''}{flag && src && ` · bandeira: ${flag.credit} · ${flag.license}`}
        {hdi && ' · IDH: Global Data Lab (Smits & Permanyer), Radboud University'}
        {head && <> · {(head.office ?? 'chefe do governo').toLowerCase()}: {headHref ? <a href={headHref} target="_blank" rel="noopener noreferrer">{headSrc!.title}</a> : headSrc?.title ?? 'Wikipedia'}</>}
      </p>
    </section>
  );
}
