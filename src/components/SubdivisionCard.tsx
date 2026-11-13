import { X } from '@phosphor-icons/react/dist/csr/X';
import type { Subdivision } from '../api/types';
import { safeHref } from '../lib/url';

const nf = (n: number) => n.toLocaleString('pt-BR');

/** Spec 024: the clicked state at the top of the country panel. `facts` undefined = the API has nothing (polygon name only). */
export function SubdivisionCard({ name, facts, onClose }: { name: string; facts: Subdivision | undefined; onClose: () => void }) {
  const flag = facts?.flag;
  const src = safeHref(flag?.url);
  const rows: [string, string][] = facts
    ? ([
        ['Capital', facts.capital ?? ''],
        ['População', facts.population ? `${nf(facts.population.value)}${facts.population.year ? ` (${facts.population.year})` : ''}` : ''],
        ['Área', facts.area_km2 !== null ? `${nf(Math.round(facts.area_km2))} km²` : ''],
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
        Fonte: Wikidata (CC0){flag && src && ` · bandeira: ${flag.credit} · ${flag.license}`}
      </p>
    </section>
  );
}
