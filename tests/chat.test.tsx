import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { sseParser, toChatEvent } from '../src/api/chat';
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
    expect(JSON.parse(sessionStorage.getItem('atlas.chat')!)).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Nova conversa' }));
    expect(within(log).queryByText('Fale do Brasil')).toBeNull();
  });
});
