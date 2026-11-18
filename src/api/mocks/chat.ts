// spec 025: offline stand-in for POST /v1/chat (mock mode and tests). Same event order as the API: tool*, text*, countries, map, done.
import type { Mode } from '../../lib/chatModes';
import type { ChatEvent, ChatMessage } from '../chat';

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((ok, fail) => {
    const t = setTimeout(ok, ms);
    signal?.addEventListener('abort', () => { clearTimeout(t); fail(signal.reason); }, { once: true });
  });

export async function* mockChat(messages: ChatMessage[], signal?: AbortSignal, mode?: Mode | null): AsyncGenerator<ChatEvent> {
  const q = messages.at(-1)?.content ?? '';
  yield { type: 'tool', name: 'search', args: { q } };
  await sleep(200, signal);
  yield { type: 'tool', name: 'get_country', args: { iso2: 'BR' } };
  await sleep(200, signal);
  const answer = `Modo offline${mode ? ` (${mode})` : ''}: esta é uma resposta de exemplo (o Atlas está sem API), não uma resposta à pergunta.\n\n`
    + `O **[Brasil](/pais/br)** é uma república federativa presidencialista; capital: Brasília (fonte: Wikidata).\n\n`
    + `- Para comparar, veja também o [Japão](/pais/jp).\n- Dados de origem: [Wikidata](https://www.wikidata.org/).`;
  for (const piece of answer.match(/\S+\s*/g) ?? []) {
    yield { type: 'text', delta: piece };
    await sleep(15, signal);
  }
  yield { type: 'countries', iso2: ['BR', 'JP'] };
  yield { type: 'map', iso2: ['BR', 'JP'], layer: 'regime' };
  yield { type: 'done', sources: [{ id: 'wikidata', title: 'Wikidata', url: 'https://www.wikidata.org/', license: 'CC0 1.0', retrieved_at: null }] };
}
