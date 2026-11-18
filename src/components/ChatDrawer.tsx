'use client';
// spec 025: "Perguntar ao Atlas", a drawer on the left (full-screen sheet on phones). Native <dialog> + showModal(): focus trap,
// Escape and an inert page behind come from the browser. Conversations live in this browser (localStorage, spec 036 B); the active one is resent each time.
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowUp } from '@phosphor-icons/react/dist/csr/ArrowUp';
import { ChatCircleText } from '@phosphor-icons/react/dist/csr/ChatCircleText';
import { MapPin } from '@phosphor-icons/react/dist/csr/MapPin';
import { Chats } from '@phosphor-icons/react/dist/csr/Chats';
import { Trash } from '@phosphor-icons/react/dist/csr/Trash';
import { X } from '@phosphor-icons/react/dist/csr/X';
import { streamChat } from '../api/chat';
import { ApiError } from '../api/client';
import type { Source } from '../api/types';
import { cleanMap, isMode, MODES, parseCommand, suggestions, type ChatScreen, type MapTarget, type Mode } from '../lib/chatModes';
import { loadSessions, newId, remove, saveSessions, titleOf, upsert, type Session } from '../lib/chatSessions';
import { safeHref } from '../lib/url';
import type { ToolCall } from '../lib/chatTools';
import { Markdown } from './Markdown';
import { ToolList } from './ToolList';

interface Turn { role: 'user' | 'assistant'; content: string; sources?: Source[]; error?: string; tools?: ToolCall[]; map?: MapTarget }

const MAX_MESSAGES = 20; // contract: 1..20 messages, 1..4000 chars each
const MAX_CHARS = 4000;

function errorText(e: unknown): string {
  if (e instanceof ApiError) return e.status === 503 ? 'O chat ainda não está ligado.' : e.detail || `Erro ${e.status} ao falar com o Atlas.`;
  return 'Não foi possível falar com o Atlas. Tente de novo.';
}

interface Props {
  /** countries the answer links to (first one = the globe flies there); [] when the conversation is closed/reset */
  onCountries: (iso2: string[]) => void;
  /** spec 039: the screen the chat opened over (suggestions); `known` = ISO codes on the globe (validates the `map` event) */
  screen: ChatScreen;
  known: ReadonlySet<string> | null;
  /** "mostrar no mapa": focus countries, switch layer and/or slider year */
  onMap: (m: MapTarget) => void;
}

export function ChatDrawer({ onCountries, screen, known, onMap }: Props) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const abort = useRef<AbortController | null>(null);
  const loaded = useRef(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<Mode | null>(null); // spec 039: null = no mode chosen = today's behaviour

  const [sessions, setSessions] = useState<Session<Turn>[]>([]);
  const [activeId, setActiveId] = useState(newId);
  const [showList, setShowList] = useState(false);
  useEffect(() => { // after hydration: the server has no storage. Opens the newest conversation.
    const list = loadSessions<Turn>();
    setSessions(list);
    if (list[0]) { setActiveId(list[0].id); setTurns(list[0].turns); setMode(isMode(list[0].mode) ? list[0].mode : null); }
    loaded.current = true;
  }, []);
  useEffect(() => { // every change of the active conversation is saved (empty ones are not)
    if (!loaded.current || !turns.length) return;
    setSessions((list) => {
      const next = upsert(list, { id: activeId, title: titleOf(turns), updated: Date.now(), turns, ...(mode && { mode }) });
      saveSessions(next);
      return next;
    });
  }, [turns, activeId, mode]);
  const log = useRef<HTMLDivElement>(null);
  useEffect(() => { if (log.current) log.current.scrollTop = log.current.scrollHeight; }, [turns]);

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
  const switchTo = (id: string, to: Turn[], m: Mode | null = null) => {
    abort.current?.abort();
    setActiveId(id);
    setTurns(to);
    setMode(m);
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
    const cmd = parseCommand(question); // "/learn ..." picks the mode and is not sent
    question = cmd.text.trim().slice(0, MAX_CHARS);
    if (cmd.mode) setMode(cmd.mode);
    if (!question || busy) { if (cmd.mode) setText(''); return; }
    const chosen = cmd.mode ?? mode;
    const history = [...turns.filter((t) => t.content && !t.error), { role: 'user' as const, content: question }]
      .slice(-MAX_MESSAGES).map((t) => ({ role: t.role, content: t.content.slice(0, MAX_CHARS) }));
    const patch = (f: (t: Turn) => Turn) => setTurns((ts) => [...ts.slice(0, -1), f(ts.at(-1)!)]);
    setTurns((ts) => [...ts, { role: 'user', content: question }, { role: 'assistant', content: '' }]);
    setText('');
    setBusy(true);
    const ac = new AbortController();
    abort.current = ac;
    let ended = false;
    try {
      for await (const e of streamChat(history, ac.signal, chosen)) {
        if (e.type === 'text') patch((t) => ({ ...t, content: t.content + e.delta }));
        else if (e.type === 'tool') patch((t) => ({ ...t, tools: [...(t.tools ?? []), { name: e.name, args: e.args }] }));
        else if (e.type === 'countries') { if (e.iso2.length) onCountries(e.iso2); }
        else if (e.type === 'map') { const m = cleanMap(e, known); if (m) patch((t) => ({ ...t, map: m })); }
        else if (e.type === 'done') { ended = true; patch((t) => ({ ...t, sources: e.sources })); }
        else { ended = true; patch((t) => ({ ...t, error: e.message })); }
      }
      if (!ended && !ac.signal.aborted) patch((t) => ({ ...t, error: 'A resposta foi interrompida. Tente de novo.' }));
    } catch (e) {
      if (!ac.signal.aborted) patch((t) => ({ ...t, error: errorText(e) }));
    } finally {
      if (abort.current === ac) setBusy(false);
    }
  }
  const showMap = (m: MapTarget) => {
    onMap(m);
    if (window.matchMedia?.('(max-width: 700px)').matches) close(); // the sheet covers the globe on phones
  };
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
            <div className="chat__modes" role="group" aria-label="Modo da conversa">
              {MODES.map((m) => (
                <button key={m.id} type="button" className="chat__mode" aria-pressed={mode === m.id} title={m.hint}
                  onClick={() => setMode((cur) => (cur === m.id ? null : m.id))}>{m.label}</button>
              ))}
            </div>
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
                    <button type="button" className="chat__session" onClick={() => switchTo(s.id, s.turns, isMode(s.mode) ? s.mode : null)} aria-current={s.id === activeId || undefined}>
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
                <p>Pergunte sobre países, governantes, economia, idiomas… As respostas usam só os dados do Atlas, com fonte. Dica: <code>/learn</code>, <code>/analyse</code> ou <code>/tell</code> no início escolhem o modo.</p>
                <h3 className="chat__sugg-title">O que posso explorar daqui?</h3>
                {suggestions(screen).map((q) => <button key={q} type="button" className="chat__example" onClick={() => void send(q)}>{q}</button>)}
              </div>
            )}
            {!showList && turns.map((t, i) => t.role === 'user' ? (
              <p key={i} className="chat__msg chat__msg--user">{t.content}</p>
            ) : (
              <div key={i} className="chat__msg chat__msg--assistant">
                {t.content && <Markdown text={t.content} onLink={onLink} />}
                {t.tools && <ToolList tools={t.tools} live={busy && i === turns.length - 1} />}
                {busy && i === turns.length - 1 && !t.content && !t.tools?.length && (
                  <p className="chat__tools" role="status">
                    <span className="spinner" aria-hidden="true" /> pensando…
                  </p>
                )}
                {t.map && !(busy && i === turns.length - 1) && (
                  <button type="button" className="chat__map" onClick={() => showMap(t.map!)}>
                    <MapPin size={14} weight="light" aria-hidden />Mostrar no mapa
                  </button>
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
