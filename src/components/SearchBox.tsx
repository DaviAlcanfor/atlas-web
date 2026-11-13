// Search bar: filters names already on the client (no network), accent- and case-insensitive; prefix matches first.
// ARIA combobox pattern: arrows move, Enter picks, Escape clears. The globe flies to whatever gets selected.
import { useId, useMemo, useState } from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react/dist/csr/MagnifyingGlass';
import { flagPreviewUrl } from '../lib/url';

export interface SearchItem { id: string; name: string; iso2?: string | null }

const MAX = 8;
export const norm = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();

/** Prefix matches first, then word-start, then anywhere; each group alphabetical. */
export function rank(items: SearchItem[], q: string): SearchItem[] {
  const n = norm(q);
  if (!n) return [];
  const score = (name: string) => {
    const s = norm(name);
    return s.startsWith(n) ? 0 : s.split(/[\s-]+/).some((w) => w.startsWith(n)) ? 1 : s.includes(n) ? 2 : -1;
  };
  return items
    .map((it) => ({ it, s: score(it.name) }))
    .filter((x) => x.s >= 0)
    .sort((a, b) => a.s - b.s || a.it.name.localeCompare(b.it.name, 'pt-BR'))
    .slice(0, MAX)
    .map((x) => x.it);
}

export function SearchBox({ items, placeholder, onPick }: { items: SearchItem[]; placeholder: string; onPick: (id: string) => void }) {
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const hits = useMemo(() => rank(items, q), [items, q]);
  const listId = useId();
  const pick = (it: SearchItem | undefined) => {
    if (!it) return;
    onPick(it.id);
    setQ('');
    setOpen(false);
  };
  const show = open && q.trim() !== '';
  return (
    <div className="search">
      <MagnifyingGlass className="search__icon" size={15} aria-hidden="true" />
      <input
        type="search" role="combobox" aria-label="Buscar" aria-autocomplete="list" aria-expanded={show} aria-controls={listId}
        aria-activedescendant={show && hits[active] ? `${listId}-${active}` : undefined}
        value={q} placeholder={placeholder}
        onChange={(e) => { setQ(e.target.value); setActive(0); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)} // let a click on an option land first
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, hits.length - 1)); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
          else if (e.key === 'Enter') pick(hits[active]);
          else if (e.key === 'Escape') { setQ(''); setOpen(false); }
        }}
      />
      {show && (
        <ul className="search__list" id={listId} role="listbox">
          {hits.length ? hits.map((it, i) => {
            const flag = flagPreviewUrl(it.iso2);
            return (
              <li key={it.id} id={`${listId}-${i}`} role="option" aria-selected={i === active}
                onMouseDown={(e) => { e.preventDefault(); pick(it); }} onMouseEnter={() => setActive(i)}>
                {flag ? <img src={flag} alt="" width={22} height={15} /> : <i aria-hidden="true" />}
                {it.name}
              </li>
            );
          }) : <li className="search__empty" role="presentation">Nada encontrado</li>}
        </ul>
      )}
    </div>
  );
}
