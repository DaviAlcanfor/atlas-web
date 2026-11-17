import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { sseParser, toChatEvent } from '../src/api/chat';
import { ChatDrawer } from '../src/components/ChatDrawer';
import { ToolList } from '../src/components/ToolList';
import { argChips, toolName } from '../src/lib/chatTools';

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
    await within(log).findByText(/Consultas \(\d\)/);
    const external = await within(log).findByRole('link', { name: 'Wikidata' }, { timeout: 5000 });
    expect(external.getAttribute('target')).toBe('_blank');
    expect(external.getAttribute('rel')).toContain('noopener');
    await within(log).findByText(/Gerado por IA \(gpt-6-luna\)/);
    const calls = within(log).getByText('Consultas (2)').closest('details')!; // spec 036: collapsed once the answer ends
    expect(calls.open).toBe(false);
    expect(within(calls).getByText('Busca')).toBeTruthy();
    expect(within(calls).getByText(/país: .*Brasil/)).toBeTruthy();
    expect(JSON.parse(sessionStorage.getItem('atlas.chat')!)[1].tools).toHaveLength(2);
    expect(onCountries).toHaveBeenCalledWith(['BR', 'JP']);
    fireEvent.click(within(log).getByRole('link', { name: 'Brasil' }));
    expect(push).toHaveBeenCalledWith('/pais/br', { scroll: false });
    expect(JSON.parse(sessionStorage.getItem('atlas.chat')!)).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Nova conversa' }));
    expect(within(log).queryByText('Fale do Brasil')).toBeNull();
  });
});

describe('tool activity (spec 036 A)', () => {
  it('names tools in pt-BR and turns arguments into chips, country codes into flag + name', () => {
    expect(toolName('get_economy')).toBe('Economia');
    expect(toolName('indicator_ranking')).toBe('Ranking de indicador');
    expect(toolName('some_new_tool')).toBe('Some new tool');
    expect(argChips({ iso2: 'BR', year: 2020, q: '', countries: ['JP', 'abc'], id: 'HDR.HDI' })).toEqual([
      { key: 'país', value: 'Brasil', flag: 'BR' },
      { key: 'ano', value: '2020' },
      { key: 'countries', value: 'Japão', flag: 'JP' },
      { key: 'countries', value: 'abc' }, // not a 2-letter code: shown as typed
      { key: 'id', value: 'HDR.HDI' },
    ]);
  });
  it('is open with a spinner on the last call while streaming, collapsed after', () => {
    const tools = [{ name: 'get_trade', args: { iso2: 'AR' } }, { name: 'get_economy', args: { iso2: 'AR' } }];
    const { container, rerender } = render(<ToolList tools={tools} live />);
    expect((container.querySelector('details') as HTMLDetailsElement).open).toBe(true);
    expect(container.querySelectorAll('.spinner')).toHaveLength(1);
    rerender(<ToolList tools={tools} live={false} />);
    expect((container.querySelector('details') as HTMLDetailsElement).open).toBe(false);
    expect(container.querySelectorAll('.spinner')).toHaveLength(0);
  });
});
