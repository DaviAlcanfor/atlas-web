import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { sseParser, toChatEvent } from '../src/api/chat';
import { MAX_SESSIONS, loadSessions, titleOf, upsert } from '../src/lib/chatSessions';
import { ChatDrawer } from '../src/components/ChatDrawer';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

describe('SSE parser (spec 025)', () => {
  it('reassembles events split across chunks, skips comments, joins multi-line data', () => {
    const parse = sseParser();
    const wire = ': heartbeat\n\nevent: text\ndata: {"delta":"Olá, "}\n\nevent: text\r\ndata: {"delta":"mundo"}\r\n\r\n'
      + 'event: countries\ndata: {"iso2":\ndata: ["BR"]}\n\nevent: done\ndata: {"sources":[]}\n\n';
    const out = [];
    for (let i = 0; i < wire.length; i += 7) out.push(...parse(wire.slice(i, i + 7))); // 7-char chunks cut events in the middle
    expect(out.map((e) => e.event)).toEqual(['text', 'text', 'countries', 'done']);
    expect(out.map(toChatEvent)).toEqual([
      { type: 'text', delta: 'Olá, ' }, { type: 'text', delta: 'mundo' }, { type: 'countries', iso2: ['BR'] }, { type: 'done', sources: [] },
    ]);
    expect(parse('event: text\ndata: {"delta":"x"}')).toEqual([]); // incomplete: waits for the blank line
    expect(toChatEvent({ event: 'text', data: 'not json' })).toBeNull();
    expect(toChatEvent({ event: 'other', data: '{}' })).toBeNull();
  });
});

describe('chat drawer on the mock (spec 025)', () => {
  it('streams the answer, flies to the cited country, navigates internal links with the router', async () => {
    // jsdom lacks <dialog> modal methods
    HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) { this.open = true; };
    HTMLDialogElement.prototype.show ??= function (this: HTMLDialogElement) { this.open = true; };
    HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) { this.open = false; this.dispatchEvent(new Event('close')); };
    const onCountries = vi.fn();
    render(<ChatDrawer onCountries={onCountries} />);
    fireEvent.click(screen.getByRole('button', { name: 'Perguntar ao Atlas' }));
    const box = screen.getByLabelText('Sua pergunta');
    fireEvent.change(box, { target: { value: 'Fale do Brasil' } });
    fireEvent.keyDown(box, { key: 'Enter' });
    const log = screen.getByRole('log');
    expect(within(log).getByText('Fale do Brasil')).toBeTruthy();
    await within(log).findByText(/consultando/);
    const external = await within(log).findByRole('link', { name: 'Wikidata' }, { timeout: 5000 });
    expect(external.getAttribute('target')).toBe('_blank');
    expect(external.getAttribute('rel')).toContain('noopener');
    await within(log).findByText(/Gerado por IA \(gpt-6-luna\)/);
    expect(onCountries).toHaveBeenCalledWith(['BR', 'JP']);
    fireEvent.click(within(log).getByRole('link', { name: 'Brasil' }));
    expect(push).toHaveBeenCalledWith('/pais/br', { scroll: false });
    expect(JSON.parse(localStorage.getItem('atlas.chats')!)[0].turns).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Nova conversa' }));
    expect(within(log).queryByText('Fale do Brasil')).toBeNull();
  });
});

describe('conversations (spec 036 B)', () => {
  const turns = (q: string) => [{ role: 'user', content: q }, { role: 'assistant', content: 'ok' }];
  it('titles with the first question (60 chars), keeps at most 20 and drops the oldest', () => {
    expect(titleOf(turns('  Olá   mundo '))).toBe('Olá mundo');
    expect(titleOf(turns('x'.repeat(100)))).toHaveLength(60);
    let list: ReturnType<typeof loadSessions> = [];
    for (let i = 0; i < MAX_SESSIONS + 3; i++) list = upsert(list, { id: `s${i}`, title: `t${i}`, updated: i, turns: [] });
    expect(list).toHaveLength(MAX_SESSIONS);
    expect(list[0]!.id).toBe(`s${MAX_SESSIONS + 2}`);
    expect(list.some((s) => s.id === 's0')).toBe(false);
  });
  it('migrates the old single sessionStorage history into the first conversation, once', () => {
    localStorage.clear();
    sessionStorage.setItem('atlas.chat', JSON.stringify(turns('Pergunta antiga')));
    const list = loadSessions();
    expect(list).toHaveLength(1);
    expect(list[0]!.title).toBe('Pergunta antiga');
    expect(sessionStorage.getItem('atlas.chat')).toBeNull();
    expect(loadSessions()).toHaveLength(1);
  });
  it('drawer: new conversation keeps the old one in the list; switch and delete', async () => {
    localStorage.clear(); sessionStorage.clear();
    sessionStorage.setItem('atlas.chat', JSON.stringify(turns('Pergunta antiga')));
    render(<ChatDrawer onCountries={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Perguntar ao Atlas' }));
    const log = screen.getByRole('log');
    await within(log).findByText('Pergunta antiga'); // migrated and opened
    fireEvent.click(screen.getByRole('button', { name: 'Nova conversa' }));
    expect(within(log).queryByText('Pergunta antiga')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Conversas', expanded: false }));
    fireEvent.click(within(log).getByRole('button', { name: /^Pergunta antiga/ }));
    expect(within(log).getByText('Pergunta antiga')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Conversas' }));
    fireEvent.click(within(log).getByRole('button', { name: 'Apagar conversa: Pergunta antiga' }));
    expect(JSON.parse(localStorage.getItem('atlas.chats')!)).toHaveLength(0);
    expect(within(log).queryByText('Pergunta antiga')).toBeNull();
  });
});
