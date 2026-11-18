// spec 036 B: several chat conversations kept in this browser (localStorage; no login yet, so nothing goes to the server).
export interface Session<T> { id: string; title: string; updated: number; turns: T[]; mode?: string } // mode: spec 039, the chat mode chosen for this conversation

export const SESSIONS_KEY = 'atlas.chats';
export const OLD_KEY = 'atlas.chat'; // before spec 036: the single history lived in sessionStorage
export const MAX_SESSIONS = 20;
const TITLE_CHARS = 60;

/** Auto title: the first user message, cut at 60 characters. */
export function titleOf(turns: { role: string; content: string }[]): string {
  const t = (turns.find((x) => x.role === 'user')?.content ?? '').replace(/\s+/g, ' ').trim();
  return t.length > TITLE_CHARS ? `${t.slice(0, TITLE_CHARS - 1)}…` : t || 'Conversa';
}

export const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const isSession = (s: unknown): s is Session<unknown> =>
  !!s && typeof (s as Session<unknown>).id === 'string' && Array.isArray((s as Session<unknown>).turns);

/** Newest first. Reads localStorage; the old single sessionStorage history becomes the first session (once). Never throws. */
export function loadSessions<T extends { role: string; content: string }>(): Session<T>[] {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(SESSIONS_KEY) ?? 'null');
    if (Array.isArray(v)) return (v.filter(isSession) as Session<T>[]).sort((a, b) => b.updated - a.updated);
  } catch { /* corrupt or blocked: fall through to the migration */ }
  try {
    const old: unknown = JSON.parse(sessionStorage.getItem(OLD_KEY) ?? '[]');
    if (Array.isArray(old) && old.length) {
      const list = [{ id: newId(), title: titleOf(old as T[]), updated: Date.now(), turns: old as T[] }];
      saveSessions(list);
      sessionStorage.removeItem(OLD_KEY);
      return list;
    }
  } catch { /* nothing to migrate */ }
  return [];
}

export function saveSessions(list: Session<unknown>[]): void {
  try { localStorage.setItem(SESSIONS_KEY, JSON.stringify(list)); } catch { /* private mode / quota: not kept */ }
}

/** Puts `s` first (replacing the same id); beyond 20 the oldest are dropped. */
export const upsert = <T,>(list: Session<T>[], s: Session<T>): Session<T>[] =>
  [s, ...list.filter((x) => x.id !== s.id)].sort((a, b) => b.updated - a.updated).slice(0, MAX_SESSIONS);

export const remove = <T,>(list: Session<T>[], id: string): Session<T>[] => list.filter((x) => x.id !== id);
