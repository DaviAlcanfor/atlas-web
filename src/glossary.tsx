import { createContext, useContext, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Bank } from '@phosphor-icons/react/dist/csr/Bank';
import { Coins } from '@phosphor-icons/react/dist/csr/Coins';
import { Crown } from '@phosphor-icons/react/dist/csr/Crown';
import { Gear } from '@phosphor-icons/react/dist/csr/Gear';
import { GlobeHemisphereWest } from '@phosphor-icons/react/dist/csr/GlobeHemisphereWest';
import { Handshake } from '@phosphor-icons/react/dist/csr/Handshake';
import { Lightbulb } from '@phosphor-icons/react/dist/csr/Lightbulb';
import { Question } from '@phosphor-icons/react/dist/csr/Question';
import { ShieldWarning } from '@phosphor-icons/react/dist/csr/ShieldWarning';
import type { Icon } from '@phosphor-icons/react/lib';
import { regimeOther, regimePalette } from './lib/palette';
import { X } from '@phosphor-icons/react/dist/csr/X';
import type { GlossaryTerm } from './api/types';
import { safeHref } from './lib/url';

export const KIND_LABEL: Record<GlossaryTerm['kind'], string> = {
  regime: 'Regime político', system: 'Sistema', region: 'Região', membership: 'Organização', currency: 'Moeda', ideology: 'Corrente política', other: 'Outro',
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
          {term.body.split(/\n+/).map((p, i) => <p key={i}>{p}</p>)}
          {term.kind === 'ideology' && <p><a href={`/ideias/${term.id}`}>A corrente no mundo: figuras e onde governou →</a></p>}
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

// Spec 023: the catalog is organized by theme (regimes split into families), each with its own hue and icon, plus a sticky index.
// Hues come from the validated categorical palette (regimePalette); they only tell themes apart, the label always says which.
interface Theme { id: string; label: string; blurb: string; color: string; icon: Icon; match: (t: GlossaryTerm) => boolean }
const isRegime = (t: GlossaryTerm) => t.kind === 'regime';
export const THEMES: Theme[] = [
  { id: 'republicas', label: 'Repúblicas', blurb: 'O chefe de Estado é escolhido, não herda o cargo. Muda quem governa e como o poder se divide.', color: regimePalette[0], icon: Bank,
    match: (t) => isRegime(t) && /^(republica|sistema-diretorial)/.test(t.id) },
  { id: 'monarquias', label: 'Monarquias', blurb: 'Há um monarca hereditário; a diferença está em quanto poder ele tem.', color: regimePalette[3], icon: Crown,
    match: (t) => isRegime(t) && t.id.startsWith('monarquia') },
  { id: 'excecao', label: 'Partido único, militares e religião', blurb: 'Regimes em que o poder fica com um partido, as Forças Armadas, autoridades religiosas ou um governo de transição.',
    color: regimePalette[1], icon: ShieldWarning, match: isRegime },
  { id: 'correntes', label: 'Correntes políticas', blurb: 'Ideias e movimentos políticos, no mesmo formato para todos: o que defendem, de onde vieram e o que dizem defensores e críticos.',
    color: regimePalette[7], icon: Lightbulb, match: (t) => t.kind === 'ideology' },
  { id: 'sistemas', label: 'Sistemas de governo', blurb: 'Como as instituições funcionam no dia a dia.', color: regimePalette[6], icon: Gear, match: (t) => t.kind === 'system' },
  { id: 'regioes', label: 'Regiões do mundo', blurb: 'Grandes regiões usadas para agrupar os países.', color: regimePalette[2], icon: GlobeHemisphereWest, match: (t) => t.kind === 'region' },
  { id: 'organizacoes', label: 'Organizações', blurb: 'Organizações internacionais e blocos de que os países fazem parte.', color: regimePalette[4], icon: Handshake, match: (t) => t.kind === 'membership' },
  { id: 'moedas', label: 'Moedas', blurb: 'Moedas e termos de câmbio.', color: regimePalette[5], icon: Coins, match: (t) => t.kind === 'currency' },
  { id: 'outros', label: 'Outros', blurb: '', color: regimeOther, icon: Question, match: () => true },
];
/** Each term lands in the first theme that matches (order above); A-Z inside it. Empty themes are dropped. */
export function byTheme(terms: GlossaryTerm[]) {
  const groups = new Map(THEMES.map((th) => [th.id, [] as GlossaryTerm[]]));
  for (const t of terms) groups.get(THEMES.find((th) => th.match(t))!.id)!.push(t);
  return THEMES.map((th) => ({ theme: th, items: groups.get(th.id)!.sort((a, b) => a.label.localeCompare(b.label, 'pt-BR')) })).filter((g) => g.items.length);
}

/** Catalog page (/glossario): terms by theme, sticky index, local accent-insensitive search. */
export function GlossaryPage({ terms, onBack }: { terms: GlossaryTerm[]; onBack: () => void }) {
  const { open } = useGlossary();
  const [q, setQ] = useState('');
  const n = norm(q.trim());
  const shown = terms.filter((t) => !n || norm(`${t.label} ${t.short} ${t.body}`).includes(n));
  const groups = byTheme(shown);
  return (
    <main className="gpage" lang="pt-BR">
      <header className="gpage__head">
        <div>
          <span className="gdialog__kind">Atlas</span>
          <h1>Glossário</h1>
          <p className="gpage__intro">{terms.length} termos usados no Atlas, por tema. Toque num termo para ler a explicação completa e ver exemplos.</p>
        </div>
        <button className="gpage__back" onClick={onBack}>← Voltar ao globo</button>
      </header>
      <div className="gpage__layout">
        <nav className="gpage__index" aria-label="Índice do glossário">
          <p className="gpage__index-title">Índice</p>
          <ol>
            {groups.map(({ theme: th, items }) => (
              <li key={th.id} style={{ '--accent': th.color } as CSSProperties}>
                <a href={`#${th.id}`}><th.icon size={15} weight="light" aria-hidden="true" />{th.label}<span>{items.length}</span></a>
              </li>
            ))}
          </ol>
        </nav>
        <div className="gpage__main">
          <input className="gpage__search" type="search" placeholder="Buscar termo…" aria-label="Buscar no glossário" value={q} onChange={(e) => setQ(e.target.value)} />
          {!terms.length && <p className="note">O glossário não está disponível agora.</p>}
          {terms.length > 0 && !shown.length && <p className="note">Nenhum termo encontrado.</p>}
          {groups.map(({ theme: th, items }) => (
            <section key={th.id} id={th.id} className="gpage__group" style={{ '--accent': th.color } as CSSProperties} aria-labelledby={`h-${th.id}`}>
              <h2 id={`h-${th.id}`} className="gtheme"><th.icon size={20} weight="light" aria-hidden="true" />{th.label}<span>{items.length}</span></h2>
              {th.blurb && <p className="gtheme__blurb">{th.blurb}</p>}
              <ul className="gcards">
                {items.map((t) => (
                  <li key={t.id}><button onClick={() => open(t.id)}><strong>{t.label}</strong><span>{t.short}</span></button></li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
