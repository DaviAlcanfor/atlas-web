'use client';
// spec 025: "Perguntar ao Atlas", a drawer on the left (full-screen sheet on phones). Native <dialog> + showModal(): focus trap,
// Escape and an inert page behind come from the browser. History lives only in this tab (sessionStorage) and is resent each time.
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowUp } from '@phosphor-icons/react/dist/csr/ArrowUp';
import { ChatCircleText } from '@phosphor-icons/react/dist/csr/ChatCircleText';
import { X } from '@phosphor-icons/react/dist/csr/X';
import { streamChat } from '../api/chat';
import { ApiError } from '../api/client';
import type { Source } from '../api/types';
import { safeHref } from '../lib/url';
import type { ToolCall } from '../lib/chatTools';
import { Markdown } from './Markdown';
import { ToolList } from './ToolList';

interface Turn { role: 'user' | 'assistant'; content: string; sources?: Source[]; error?: string; tools?: ToolCall[] }

const KEY = 'atlas.chat';
const MAX_MESSAGES = 20; // contract: 1..20 messages, 1..4000 chars each
const MAX_CHARS = 4000;
const EXAMPLES = ['Quais monarquias absolutas existem?', 'Compare a inflação do Brasil e da Argentina'];

function load(): Turn[] {
  try {
    const v: unknown = JSON.parse(sessionStorage.getItem(KEY) ?? '[]');
    return Array.isArray(v) ? (v as Turn[]) : [];
  } catch {
    return [];
  }
}

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
  const [busy, setBusy] = useState(false);

  useEffect(() => { setTurns(load()); loaded.current = true; }, []); // after hydration: the server has no sessionStorage
  useEffect(() => {
    if (!loaded.current) return;
    try { sessionStorage.setItem(KEY, JSON.stringify(turns)); } catch { /* private mode / quota: history just isn't kept */ }
  }, [turns]);
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
  const reset = () => {
    abort.current?.abort();
    setTurns([]);
    onCountries([]);
    input.current?.focus();
  };

  async function send(question: string) {
    question = question.trim().slice(0, MAX_CHARS);
    if (!question || busy) return;
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
      for await (const e of streamChat(history, ac.signal)) {
        if (e.type === 'text') patch((t) => ({ ...t, content: t.content + e.delta }));
        else if (e.type === 'tool') patch((t) => ({ ...t, tools: [...(t.tools ?? []), { name: e.name, args: e.args }] }));
        else if (e.type === 'countries') { if (e.iso2.length) onCountries(e.iso2); }
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
            {turns.length > 0 && <button type="button" className="chat__reset" onClick={reset}>Nova conversa</button>}
            <button type="button" className="icon-btn" onClick={close} aria-label="Fechar"><X size={14} weight="light" aria-hidden /></button>
          </header>
          <div className="chat__log" ref={log} role="log" aria-live="polite" aria-busy={busy}>
            {turns.length === 0 && (
              <div className="chat__empty">
                <p>Pergunte sobre países, governantes, economia, idiomas… As respostas usam só os dados do Atlas, com fonte.</p>
                {EXAMPLES.map((q) => <button key={q} type="button" className="chat__example" onClick={() => void send(q)}>{q}</button>)}
              </div>
            )}
            {turns.map((t, i) => t.role === 'user' ? (
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
