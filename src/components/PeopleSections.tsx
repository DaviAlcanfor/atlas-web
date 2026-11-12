import { useState } from 'react';
import { api } from '../api';
import type { Image, Leader, Person, PersonDomain } from '../api/types';
import { useAsync } from '../hooks/useAsync';
import { initials, ROLE_LABEL, splitLeaders, termRange } from '../lib/leaders';
import { DOMAIN_LABEL, occupationPt } from '../lib/occupations';
import { safeHref } from '../lib/url';
import { formatYear } from '../lib/years';
import { Section } from './Section';

const PAGE = 10;

/** One person: photo (with the credit + licence the contract requires) or initials, name, free-form lines, Wikipedia link. */
function PersonRow({ name, image, wiki, lines }: { name: string; image: Image | null; wiki: string | null; lines: (string | null | undefined)[] }) {
  const href = safeHref(wiki);
  const src = safeHref(image?.url);
  return (
    <li className="person">
      <figure>
        <span className="person__ph">
          {image && src ? <img src={src} alt="" loading="lazy" width={44} height={44} /> : <span aria-hidden="true">{initials(name)}</span>}
        </span>
        <figcaption>
          <strong className="person__name">{name}</strong>
          {lines.filter(Boolean).map((l, i) => <span key={i} className="person__line">{l}</span>)}
          {href && <a className="person__wiki" href={href} target="_blank" rel="noreferrer noopener">Wikipedia ↗</a>}
          {image && src && <small className="person__credit">Foto: {image.credit} · {image.license}</small>}
        </figcaption>
      </figure>
    </li>
  );
}

const LeaderRow = ({ l }: { l: Leader }) => (
  <PersonRow name={l.name} image={l.image} wiki={l.wikipedia_url}
    lines={[l.office ?? ROLE_LABEL[l.role], l.party?.name, termRange(l)]} />
);

/** Current head(s) inside "Política hoje". */
export function CurrentLeaders({ items }: { items: Leader[] }) {
  if (!items.length) return null;
  return (
    <ul className="current">
      {items.map((l) => (
        <li key={l.person_id + l.role}>
          <span className="current__office">{l.office ?? ROLE_LABEL[l.role]}</span> <strong>{l.name}</strong>
          {l.party && <span className="current__party"> · {l.party.name}</span>}
          <span className="current__since mono"> · desde {l.start?.slice(0, 4)}</span>
        </li>
      ))}
    </ul>
  );
}

/** Spec 006 (list only): current head(s) first, then history newest first, 10 at a time. Nothing to show = no section. */
export function LeadersSection({ items }: { items: Leader[] }) {
  const [all, setAll] = useState(false);
  if (!items.length) return null;
  const { current, history } = splitLeaders(items);
  const shown = all ? history : history.slice(0, PAGE);
  return (
    <Section title="Governantes">
      {current.length > 0 && (
        <>
          <p className="sub">Atuais</p>
          <ul className="plist plist--current">{current.map((l) => <LeaderRow key={l.person_id + l.role} l={l} />)}</ul>
        </>
      )}
      {history.length > 0 && (
        <>
          <p className="sub">Histórico</p>
          <ul className="plist">{shown.map((l, i) => <LeaderRow key={`${l.person_id}-${l.role}-${l.start ?? i}`} l={l} />)}</ul>
          {history.length > PAGE && (
            <button className="more-btn" aria-expanded={all} onClick={() => setAll(!all)}>{all ? 'mostrar menos' : `mostrar mais (${history.length - PAGE})`}</button>
          )}
        </>
      )}
    </Section>
  );
}

function life(p: Person): string | null {
  const f = (y: number) => formatYear(y);
  if (p.birth_year !== null && p.death_year !== null) return `${f(p.birth_year)}–${f(p.death_year)}`;
  if (p.birth_year !== null) return `n. ${f(p.birth_year)}`;
  return p.death_year !== null ? `m. ${f(p.death_year)}` : null;
}

/** Spec 007: ranked cards, domain filter (aria-pressed buttons), method text and the CC BY-SA attribution. Any failure = hidden. */
export function PeopleSection({ iso2 }: { iso2: string }) {
  const s = useAsync(() => api.people(iso2, undefined, 50), iso2); // one request; the filter works on the top 50
  const [domain, setDomain] = useState<PersonDomain | null>(null);
  if (s.status !== 'ok' || !s.data.items.length) return null;
  const { items, method, source } = s.data;
  const domains = (Object.keys(DOMAIN_LABEL) as PersonDomain[]).filter((d) => items.some((p) => p.domain === d));
  const shown = items.filter((p) => !domain || p.domain === domain).slice(0, PAGE);
  const srcHref = safeHref(source.url);
  return (
    <Section title="Pessoas importantes">
      {domains.length > 1 && (
        <div className="filters" role="group" aria-label="Filtrar por área">
          <button aria-pressed={domain === null} onClick={() => setDomain(null)}>Todas</button>
          {domains.map((d) => <button key={d} aria-pressed={domain === d} onClick={() => setDomain(d)}>{DOMAIN_LABEL[d]}</button>)}
        </div>
      )}
      <ul className="plist">
        {shown.map((p) => (
          <PersonRow key={p.id} name={p.name} image={p.image} wiki={p.wikipedia_url}
            lines={[occupationPt(p.occupation), life(p)]} />
        ))}
      </ul>
      <p className="src">{method}</p>
      <p className="src">
        Fonte: {srcHref ? <a href={srcHref} target="_blank" rel="noreferrer noopener">{source.title}</a> : source.title}
        {source.license && ` · licença: ${source.license}`}
      </p>
    </Section>
  );
}
