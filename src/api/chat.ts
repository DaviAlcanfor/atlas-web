// spec 025 (CR-012, contract v1.10): POST /v1/chat answers with a Server-Sent Events stream. Read with fetch + ReadableStream
// (EventSource cannot POST). Mock mode (no NEXT_PUBLIC_API_URL) streams a canned answer from src/api/mocks/chat.ts.
import { z } from 'zod';
import { ApiError } from './client';
import * as S from './schemas';
import { cleanMap, type MapTarget, type Mode } from '../lib/chatModes';
import type { Source } from './types';

export type ChatMessage = z.infer<typeof S.ChatMessage>;
export type ChatEvent =
  | { type: 'text'; delta: string }
  | { type: 'tool'; name: string; args: Record<string, unknown> }
  | { type: 'countries'; iso2: string[] }
  | ({ type: 'map' } & MapTarget)
  | { type: 'done'; sources: Source[] }
  | { type: 'error'; message: string };

const EVENTS = {
  text: z.object({ delta: z.string() }),
  tool: z.object({ name: z.string(), args: z.record(z.string(), z.unknown()) }),
  countries: z.object({ iso2: z.array(z.string()) }),
  // spec 039: loose on purpose, cleanMap drops what the app does not know (an unknown layer must not hide valid countries)
  map: z.object({ iso2: z.array(z.unknown()), layer: z.unknown().optional(), year: z.unknown().optional() }),
  done: z.object({ sources: z.array(S.Source) }),
  error: z.object({ message: z.string() }),
};

/** Returns a function that takes text chunks of an SSE stream and returns the events completed so far (a chunk may end mid-event). */
export function sseParser() {
  let buf = '';
  return (chunk: string): { event: string; data: string }[] => {
    buf += chunk;
    const out: { event: string; data: string }[] = [];
    for (let m = /\r?\n\r?\n/.exec(buf); m; m = /\r?\n\r?\n/.exec(buf)) {
      const block = buf.slice(0, m.index);
      buf = buf.slice(m.index + m[0].length);
      let event = 'message';
      const data: string[] = [];
      for (const line of block.split(/\r?\n/)) {
        if (!line || line.startsWith(':')) continue; // comment / heartbeat
        const i = line.indexOf(':');
        const field = i < 0 ? line : line.slice(0, i);
        const value = i < 0 ? '' : line.slice(i + 1).replace(/^ /, '');
        if (field === 'event') event = value;
        else if (field === 'data') data.push(value);
      }
      if (data.length) out.push({ event, data: data.join('\n') });
    }
    return out;
  };
}

/** One raw SSE event -> a typed ChatEvent; unknown or malformed events are skipped. */
export function toChatEvent({ event, data }: { event: string; data: string }): ChatEvent | null {
  const schema = EVENTS[event as keyof typeof EVENTS];
  if (!schema) return null;
  try {
    const r = schema.safeParse(JSON.parse(data));
    if (!r.success) return null;
    if (event === 'map') { const m = cleanMap(r.data as Parameters<typeof cleanMap>[0], null); return m && { type: 'map', ...m }; }
    return { type: event, ...r.data } as ChatEvent;
  } catch {
    return null;
  }
}

/** Streams the answer to `messages` (1..20, last one from the user). Throws ApiError on 422/429/503. */
export async function* streamChat(messages: ChatMessage[], signal?: AbortSignal, mode?: Mode | null): AsyncGenerator<ChatEvent> {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    yield* (await import('./mocks/chat')).mockChat(messages, signal, mode);
    return;
  }
  const res = await fetch(`${url.replace(/\/+$/, '')}/v1/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream, application/problem+json' },
    body: JSON.stringify(mode ? { messages, mode } : { messages }),
    signal,
  });
  if (!res.ok || !res.body) {
    const p = S.ProblemJson.safeParse(await res.json().catch(() => null));
    throw p.success ? new ApiError(p.data.status, p.data.title, p.data.detail) : new ApiError(res.status, res.statusText, '');
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  const parse = sseParser();
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    for (const raw of parse(dec.decode(value, { stream: true }))) {
      const e = toChatEvent(raw);
      if (e) yield e;
    }
  }
}
