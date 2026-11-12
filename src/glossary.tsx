import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { X } from '@phosphor-icons/react/dist/csr/X';
import type { GlossaryTerm } from './api/types';
import { safeHref } from './lib/url';

export const KIND_LABEL: Record<GlossaryTerm['kind'], string> = {
  regime: 'Regime político', system: 'Sistema', region: 'Região', membership: 'Organização', currency: 'Moeda', other: 'Outro',
};
const norm = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

interface Ctx {
  /** Term by id (regime_id) or, failing that, by exact label (regions and organizations have no id in the contract). */
  find: (id: string | null | undefined, label?: string) => GlossaryTerm | undefined;
  open: (id: string) => void;
}
const GlossaryCtx = createContext<Ctx>({ find: () => undefined, open: () => {} });
export const useGlossary = () => useContext(GlossaryCtx);

interface Props {
  terms: GlossaryTerm[];
  countryName: (iso2: string) => string | undefined;
  onPickCountry: (iso2: string) => void;
  children: ReactNode;
}

/** Holds the glossary (loaded once with the countries) and the single shared dialog. */
export function GlossaryProvider({ terms, countryName, onPickCountry, children }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const value = useMemo<Ctx>(() => {
    const byId = new Map(terms.map((t) => [t.id, t]));
    const byLabel = new Map(terms.map((t) => [norm(t.label), t]));
    return {
      find: (id, label) => (id ? byId.get(id) : undefined) ?? (label ? byLabel.get(norm(label)) : undefined),
      open: setOpenId,
    };
  }, [terms]);
  const term = openId ? terms.find((t) => t.id === openId) ?? null : null;
  return (
    <GlossaryCtx.Provider value={value}>
      {children}
      <GlossaryDialog term={term} onClose={() => setOpenId(null)} countryName={countryName} onPickCountry={(c) => { setOpenId(null); onPickCountry(c); }} />
    </GlossaryCtx.Provider>
  );
}

/** Native <dialog> + showModal(): focus trap, Esc and ::backdrop for free. Body is plain text, split on blank lines. */
function GlossaryDialog({ term, onClose, countryName, onPickCountry }: { term: GlossaryTerm | null; onClose: () => void; countryName: Props['countryName']; onPickCountry: (iso2: string) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (term && !d.open) (d.showModal ? d.showModal() : d.setAttribute('open', ''));
    if (!term && d.open) (d.close ? d.close() : d.removeAttribute('open'));
  }, [term]);
  return (
    <dialog ref={ref} className="gdialog bracketed" lang="pt-BR" aria-labelledby="gdialog-title" onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && ref.current?.close()}>
      {term && (
        <div className="gdialog__in">
          <header>
            <div>
              <span className="gdialog__kind">{KIND_LABEL[term.kind]}</span>
              <h2 id="gdialog-title">{term.label}</h2>
            </div>
            <button className="icon-btn" onClick={() => ref.current?.close()} aria-label="Fechar"><X size={16} weight="light" aria-hidden="true" /></button>
          </header>
          <p className="gdialog__short">{term.short}</p>
          {term.body.split(/\n\s*\n/).map((p, i) => <p key={i}>{p}</p>)}
          {term.examples.length > 0 && (
            <>
              <h3>Exemplos</h3>
              <ul className="chips">
                {term.examples.map((c) => <li key={c}><button className="chip-btn" onClick={() => onPickCountry(c)}>{countryName(c) ?? c}</button></li>)}
              </ul>
            </>
          )}
          {term.sources.length > 0 && (
            <>
              <h3>Fontes</h3>
              <ul className="sources">
                {term.sources.map((s) => {
                  const href = safeHref(s.url);
                  return <li key={s.id}>{href ? <a href={href} target="_blank" rel="noreferrer noopener">{s.title}</a> : s.title}{s.license && ` · licença: ${s.license}`}</li>;
                })}
              </ul>
            </>
          )}
        </div>
      )}
    </dialog>
  );
}

/** Catalog page (#/glossario): every term grouped by kind, with local accent-insensitive search. */
export function GlossaryPage({ terms, onBack }: { terms: GlossaryTerm[]; onBack: () => void }) {
  const { open } = useGlossary();
  const [q, setQ] = useState('');
  const n = norm(q.trim());
  const shown = terms.filter((t) => !n || norm(`${t.label} ${t.short} ${t.body}`).includes(n));
  const kinds = (Object.keys(KIND_LABEL) as GlossaryTerm['kind'][]).filter((k) => shown.some((t) => t.kind === k));
  return (
    <main className="gpage" lang="pt-BR">
      <header className="gpage__head">
        <div>
          <span className="gdialog__kind">Atlas</span>
          <h1>Glossário</h1>
        </div>
        <button className="gpage__back" onClick={onBack}>← Voltar ao globo</button>
      </header>
      <input className="gpage__search" type="search" placeholder="Buscar termo…" aria-label="Buscar no glossário" value={q} onChange={(e) => setQ(e.target.value)} />
      {!terms.length && <p className="note">O glossário não está disponível agora.</p>}
      {terms.length > 0 && !shown.length && <p className="note">Nenhum termo encontrado.</p>}
      {kinds.map((k) => (
        <section key={k} className="gpage__group">
          <h2 className="gpage__kind">{KIND_LABEL[k]} <span>{shown.filter((t) => t.kind === k).length}</span></h2>
          <ul>
            {shown.filter((t) => t.kind === k).map((t) => (
              <li key={t.id}><button onClick={() => open(t.id)}><strong>{t.label}</strong><span>{t.short}</span></button></li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
