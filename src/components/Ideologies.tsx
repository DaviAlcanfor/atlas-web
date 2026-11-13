import Link from 'next/link';
import { api } from '../api';
import type { IdeologyFigure } from '../api/types';
import { useAsync } from '../hooks/useAsync';
import { formatYear } from '../lib/years';
import { PersonRow } from './PeopleSections';
import { Section } from './Section';

export const ROLE_PT: Record<IdeologyFigure['role'], string> = { thinker: 'Pensador(a)', leader: 'Líder político(a)', activist: 'Ativista', other: 'Figura' };

function life(f: IdeologyFigure): string | null {
  if (f.birth_year !== null && f.death_year !== null) return `${formatYear(f.birth_year)}–${formatYear(f.death_year)}`;
  return f.birth_year !== null ? `n. ${formatYear(f.birth_year)}` : null;
}

/** Spec 018 neutrality: say WHY someone is listed. A party member is "filiado(a) ao X", never labelled with the current itself. */
export const whyListed = (f: IdeologyFigure) => (f.via === 'party' && f.party ? `filiado(a) ao ${f.party.name}` : 'corrente declarada (com referência)');

export function FigureList({ figures }: { figures: IdeologyFigure[] }) {
  return (
    <ul className="plist">
      {figures.map((f) => (
        <PersonRow key={f.person_id} name={f.name} image={f.image} wiki={f.wikipedia_url}
          lines={[[ROLE_PT[f.role], life(f)].filter(Boolean).join(' · '), f.summary, f.works.length ? `Obras: ${f.works.join(', ')}` : null, whyListed(f)]} />
      ))}
    </ul>
  );
}

/** Spec 018: "Ideias políticas" in the country panel. Every current gets the same layout; any failure = no section. */
export function IdeologySection({ iso2 }: { iso2: string }) {
  const s = useAsync(() => api.ideologies(iso2), iso2);
  if (s.status !== 'ok' || !s.data.items.length) return null;
  return (
    <Section title="Ideias políticas">
      <p className="note">Correntes com figuras ou partidos ligados ao país no Wikidata. Cada pessoa mostra por que está na lista.</p>
      <ol className="periods">
        {s.data.items.map(({ term, figures, parties }) => (
          <li key={term.id}>
            <details>
              <summary>
                <span className="periods__title">{term.label}</span>
                <span className="periods__years mono">
                  {[figures.length && `${figures.length} ${figures.length === 1 ? 'figura' : 'figuras'}`,
                    parties.length && `${parties.length} ${parties.length === 1 ? 'partido' : 'partidos'}`].filter(Boolean).join(' · ')}
                </span>
              </summary>
              <p>{term.short} <Link href={`/ideias/${term.id}`}>A corrente no mundo →</Link></p>
              {figures.length > 0 && <FigureList figures={figures} />}
              {parties.length > 0 && (
                <>
                  <p className="sub">Partidos desta corrente no país</p>
                  <ul className="chips">{parties.map((p) => <li key={p.id}>{p.name}</li>)}</ul>
                </>
              )}
            </details>
          </li>
        ))}
      </ol>
      <p className="src">Fonte: Wikidata (CC0); fotos: Wikimedia Commons, licença em cada foto. Verbetes: rascunho em revisão.</p>
    </Section>
  );
}
