'use client';
// spec 025: "Perguntar ao Atlas", a drawer on the left (full-screen sheet on phones). Native <dialog> + showModal(): focus trap,
// Escape and an inert page behind come from the browser. Conversations live in this browser (localStorage, spec 036 B); the active one is resent each time.
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowUp } from '@phosphor-icons/react/dist/csr/ArrowUp';
import { ChatCircleText } from '@phosphor-icons/react/dist/csr/ChatCircleText';
import { Chats } from '@phosphor-icons/react/dist/csr/Chats';
import { Trash } from '@phosphor-icons/react/dist/csr/Trash';
import { X } from '@phosphor-icons/react/dist/csr/X';
import { streamChat } from '../api/chat';
import { ApiError } from '../api/client';
import type { Source } from '../api/types';
import { loadSessions, newId, remove, saveSessions, titleOf, upsert, type Session } from '../lib/chatSessions';
import { safeHref } from '../lib/url';
import { Markdown } from './Markdown';

interface Turn { role: 'user' | 'assistant'; content: string; sources?: Source[]; error?: string }

const MAX_MESSAGES = 20; // contract: 1..20 messages, 1..4000 chars each
const MAX_CHARS = 4000;
const EXAMPLES = ['Quais monarquias absolutas existem?', 'Compare a inflação do Brasil e da Argentina'];
const TOOL_LABEL: Record<string, string> = {
  search: 'busca', list_countries: 'lista de países', get_country: 'dados do país', get_leaders: 'governantes',
  get_people: 'pessoas', get_profile: 'perfil', get_economy: 'economia', get_trade: 'comércio', get_history: 'história',
  get_languages: 'idiomas', get_currency: 'moeda', glossary: 'glossário', list_indicators: 'indicadores', indicator_ranking: 'ranking',
};

function errorText(e: unknown): string {
  if (e instanceof ApiError) return e.status === 503 ? 'O chat ainda não está ligado.' : e.detail || `Erro ${e.status} ao falar com o Atlas.`;
  return 'Não foi possível falar com o Atlas. Tente de novo.';
}

/** `onCountries`: countries the answer links to (first one = the globe flies there); [] when the conversation is closed/reset. */
export function ChatDrawer({ onCountries }: { onCountries: (iso2: string[]) => void }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const abort = useRef<AbortController | null>(null);
  const loaded = useRef(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [text, setText] = useState('');
  const [tools, setTools] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const [sessions, setSessions] = useState<Session<Turn>[]>([]);
  const [activeId, setActiveId] = useState(newId);
  const [showList, setShowList] = useState(false);
  useEffect(() => { // after hydration: the server has no storage. Opens the newest conversation.
    const list = loadSessions<Turn>();
    setSessions(list);
    if (list[0]) { setActiveId(list[0].id); setTurns(list[0].turns); }
    loaded.current = true;
  }, []);
  useEffect(() => { // every change of the active conversation is saved (empty ones are not)
    if (!loaded.current || !turns.length) return;
    setSessions((list) => {
      const next = upsert(list, { id: activeId, title: titleOf(turns), updated: Date.now(), turns });
      saveSessions(next);
      return next;
    });
  }, [turns, activeId]);
  const log = useRef<HTMLDivElement>(null);
  useEffect(() => { if (log.current) log.current.scrollTop = log.current.scrollHeight; }, [turns, tools]);

  const open = () => {
    // owner 2026-11-17: clicking outside must not close it. Desktop = non-modal (the globe stays usable beside it);
    // phones = modal full-screen sheet (it covers everything anyway).
    if (window.matchMedia?.('(max-width: 700px)').matches) dialog.current?.showModal(); else dialog.current?.show();
    input.current?.focus();
  };
  const close = () => dialog.current?.close();
  const onLink = (href: string) => {
    router.push(href, { scroll: false }); // /pais/br: selects the country, the globe flies there
    if (window.matchMedia?.('(max-width: 700px)').matches) close(); // the sheet covers the globe on phones
  };
  const switchTo = (id: string, to: Turn[]) => {
    abort.current?.abort();
    setActiveId(id);
    setTurns(to);
    setShowList(false);
    onCountries([]);
    input.current?.focus();
  };
  const reset = () => switchTo(newId(), []); // the old conversation stays in the list
  const del = (id: string) => {
    const next = remove(sessions, id);
    saveSessions(next);
    setSessions(next);
    if (id === activeId) reset();
  };

  async function send(question: string) {
    question = question.trim().slice(0, MAX_CHARS);
    if (!question || busy) return;
    const history = [...turns.filter((t) => t.content && !t.error), { role: 'user' as const, content: question }]
      .slice(-MAX_MESSAGES).map((t) => ({ role: t.role, content: t.content.slice(0, MAX_CHARS) }));
    const patch = (f: (t: Turn) => Turn) => setTurns((ts) => [...ts.slice(0, -1), f(ts.at(-1)!)]);
    setTurns((ts) => [...ts, { role: 'user', content: question }, { role: 'assistant', content: '' }]);
    setText('');
    setTools([]);
    setBusy(true);
    const ac = new AbortController();
    abort.current = ac;
    let ended = false;
    try {
      for await (const e of streamChat(history, ac.signal)) {
        if (e.type === 'text') patch((t) => ({ ...t, content: t.content + e.delta }));
        else if (e.type === 'tool') setTools((x) => [...x, TOOL_LABEL[e.name] ?? e.name]);
        else if (e.type === 'countries') { if (e.iso2.length) onCountries(e.iso2); }
        else if (e.type === 'done') { ended = true; patch((t) => ({ ...t, sources: e.sources })); }
        else { ended = true; patch((t) => ({ ...t, error: e.message })); }
      }
      if (!ended && !ac.signal.aborted) patch((t) => ({ ...t, error: 'A resposta foi interrompida. Tente de novo.' }));
    } catch (e) {
      if (!ac.signal.aborted) patch((t) => ({ ...t, error: errorText(e) }));
    } finally {
      if (abort.current === ac) { setBusy(false); setTools([]); }
    }
  }
  const submit = (e: FormEvent) => { e.preventDefault(); void send(text); };

  return (
    <>
      <button type="button" className="chat-open" onClick={open} aria-haspopup="dialog" aria-label="Perguntar ao Atlas">
        <ChatCircleText size={16} weight="light" aria-hidden /><span>Perguntar ao Atlas</span>
      </button>
      <dialog ref={dialog} className="chat" aria-labelledby="chat-title" onClose={() => onCountries([])}
        onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); close(); } }}>
        <div className="chat__body">
          <header className="chat__head">
            <h2 id="chat-title">Perguntar ao Atlas</h2>
            {(turns.length > 0 || showList) && <button type="button" className="chat__reset" onClick={reset}>Nova conversa</button>}
            {sessions.length > 0 && (
              <button type="button" className="icon-btn" onClick={() => setShowList((v) => !v)} aria-expanded={showList} aria-label="Conversas">
                <Chats size={14} weight="light" aria-hidden />
              </button>
            )}
            <button type="button" className="icon-btn" onClick={close} aria-label="Fechar"><X size={14} weight="light" aria-hidden /></button>
          </header>
          <div className="chat__log" ref={log} role="log" aria-live="polite" aria-busy={busy}>
            {showList && (
              <ul className="chat__sessions" aria-label="Conversas">
                {sessions.map((s) => (
                  <li key={s.id} className={s.id === activeId ? 'is-active' : undefined}>
                    <button type="button" className="chat__session" onClick={() => switchTo(s.id, s.turns)} aria-current={s.id === activeId || undefined}>
                      <span>{s.title}</span>
                      <small>{new Date(s.updated).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</small>
                    </button>
                    <button type="button" className="icon-btn" onClick={() => del(s.id)} aria-label={`Apagar conversa: ${s.title}`}>
                      <Trash size={14} weight="light" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {!showList && turns.length === 0 && (
              <div className="chat__empty">
                <p>Pergunte sobre países, governantes, economia, idiomas… As respostas usam só os dados do Atlas, com fonte.</p>
                {EXAMPLES.map((q) => <button key={q} type="button" className="chat__example" onClick={() => void send(q)}>{q}</button>)}
              </div>
            )}
            {!showList && turns.map((t, i) => t.role === 'user' ? (
              <p key={i} className="chat__msg chat__msg--user">{t.content}</p>
            ) : (
              <div key={i} className="chat__msg chat__msg--assistant">
                {t.content && <Markdown text={t.content} onLink={onLink} />}
                {busy && i === turns.length - 1 && (
                  <p className="chat__tools" role="status">
                    <span className="spinner" aria-hidden="true" /> {tools.length ? `consultando ${tools.at(-1)}…` : 'pensando…'}
                  </p>
                )}
                {t.error && <p className="chat__err" role="alert">{t.error}</p>}
                {t.content && !(busy && i === turns.length - 1) && (
                  <p className="chat__meta">
                    Gerado por IA (gpt-6-luna) com dados do Atlas
                    {t.sources?.length ? <> · Fontes: {t.sources.map((s, j) => {
                      const href = safeHref(s.url);
                      return <span key={s.id}>{j > 0 && ', '}{href ? <a href={href} target="_blank" rel="noopener noreferrer">{s.title}</a> : s.title}</span>;
                    })}</> : null}
                  </p>
                )}
              </div>
            ))}
          </div>
          <form className="chat__form" onSubmit={submit}>
            <textarea ref={input} value={text} onChange={(e) => setText(e.target.value)} maxLength={MAX_CHARS} rows={2}
              aria-label="Sua pergunta" placeholder="Pergunte ao Atlas (Enter envia, Shift+Enter quebra a linha)"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void send(text); }
              }} />
            <button type="submit" className="chat__send" disabled={busy || !text.trim()} aria-label="Enviar"><ArrowUp size={16} aria-hidden /></button>
          </form>
        </div>
      </dialog>
    </>
  );
}
