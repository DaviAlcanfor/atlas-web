'use client';
import Link from 'next/link';
import type { IdeologyDetail } from '../api/types';
import { safeHref } from '../lib/url';
import { formatYear } from '../lib/years';
import { FigureList } from './Ideologies';

/** spec 018: /ideias/[id], the current worldwide: verbete, best-known figures (declared only), where it governed. */
export function IdeologyPage({ detail, names }: { detail: IdeologyDetail | null; names: Record<string, string> }) {
  const back = <button className="gpage__back" onClick={() => history.back()}>← Voltar</button>;
  if (!detail) return <main className="cpage" lang="pt-BR">{back}<p className="note">Esta corrente não está disponível agora.</p></main>;
  const { term, founders, governed } = detail;
  const byCountry = new Map<string, string[]>();
  for (const g of governed) {
    const span = g.to_year === null ? `${formatYear(g.from_year)}–hoje` : g.to_year === g.from_year ? formatYear(g.from_year) : `${formatYear(g.from_year)}–${formatYear(g.to_year)}`;
    byCountry.set(g.iso2, [...(byCountry.get(g.iso2) ?? []), span]);
  }
  const countries = [...byCountry].sort((a, b) => (names[a[0]] ?? a[0]).localeCompare(names[b[0]] ?? b[0], 'pt-BR'));
  return (
    <main className="cpage" lang="pt-BR">
      {back}
      <p className="gpage__kind">Corrente política</p>
      <h1>{term.label}</h1>
      <p className="lead">{term.short}</p>
      {term.body.split(/\n+/).map((p, i) => <p key={i}>{p}</p>)}
      <p className="warn">Verbete escrito para o Atlas a partir das fontes abaixo; rascunho em revisão humana.</p>

      {founders.length > 0 && (
        <section className="psec">
          <h3>Figuras mais conhecidas no mundo</h3>
          <p className="note">Pessoas já falecidas que o Wikidata registra, com referência, como adeptas desta corrente; ordenadas pelo número de edições da Wikipédia.</p>
          <FigureList figures={founders} />
        </section>
      )}

      {countries.length > 0 && (
        <section className="psec">
          <h3>Onde governou</h3>
          <p className="note">Períodos em que um chefe de Estado ou de governo era filiado a um partido desta corrente (governantes e partidos do Wikidata).</p>
          <ul className="sources">
            {countries.map(([iso2, spans]) => (
              <li key={iso2}><Link href={`/pais/${iso2.toLowerCase()}`}>{names[iso2] ?? iso2}</Link>: {spans.join(', ')}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="psec">
        <h3>Fontes</h3>
        <ul className="sources">
          {term.sources.map((s) => {
            const href = safeHref(s.url);
            return <li key={s.id}>{href ? <a href={href} target="_blank" rel="noreferrer noopener">{s.title}</a> : s.title}{s.license && ` · licença: ${s.license}`}</li>;
          })}
          <li>Wikidata (CC0): figuras, partidos e governantes</li>
        </ul>
      </section>
    </main>
  );
}
