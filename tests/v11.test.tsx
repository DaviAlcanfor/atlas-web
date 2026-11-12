import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { isNotFound, createClient } from '../src/api/client';
import { createMockApi } from '../src/api/mocks/adapter';
import { COUNTRIES, GLOSSARY, LEADERS } from '../src/api/mocks/fixtures';
import * as S from '../src/api/schemas';
import type { Leader } from '../src/api/types';
import { Tooltip } from '../src/components/Tooltip';
import { Term } from '../src/components/Term';
import { GlossaryPage, GlossaryProvider } from '../src/glossary';
import { initials, splitLeaders, termRange } from '../src/lib/leaders';
import { occupationPt } from '../src/lib/occupations';
import { flagPreviewUrl } from '../src/lib/url';

const leader = (role: Leader['role'], start: string | null, end: string | null, name = `${role}-${start}`): Leader =>
  ({ person_id: name, name, role, office: null, start, end, party: null, image: null, wikipedia_url: null });

describe('v1.1 schemas are backwards compatible', () => {
  it('a v1.0 country (no regime_id, clues) still parses', () => {
    const { regime_id: _r, clues: _c, ...v10 } = COUNTRIES[0]!;
    expect(S.CountryDetail.safeParse(v10).success).toBe(true);
    expect(S.CountrySummary.safeParse({ iso2: 'BR', polity_id: 'brazil', name: 'Brasil', capital: null, region: null, regime: null, has_content: true, marker: null }).success).toBe(true);
  });
  it('mock fixtures are v1.1-shaped', async () => {
    const api = createMockApi(0);
    expect((await api.glossary()).length).toBe(GLOSSARY.length);
    expect((await api.leaders('BR')).length).toBeGreaterThan(10);
    expect((await api.people('BR', 'sports')).items.every((p) => p.domain === 'sports')).toBe(true);
    const br = (await api.countries()).find((c) => c.iso2 === 'BR')!;
    expect(br.capital_coords?.[0]?.name).toBe('Brasília');
    await expect(api.people('RS')).rejects.toSatisfy(isNotFound);
  });
  it('real client: a 404 from the v1.0 production API is an ApiError the UI can swallow', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 404 })));
    await expect(createClient('http://x').glossary()).rejects.toSatisfy(isNotFound);
    vi.unstubAllGlobals();
  });
});

describe('leaders', () => {
  it('current = latest open term per role; undated rulers never count; history newest first, unknown start last', () => {
    const items = [
      leader('head_of_state', null, null, 'legend'), leader('head_of_state', '1990-01-01', '2000-01-01', 'old'),
      leader('head_of_state', '2019-05-01', null, 'now'), leader('head_of_government', '2025-10-21', null, 'pm'),
    ];
    const { current, history } = splitLeaders(items);
    expect(current.map((l) => l.person_id)).toEqual(['now', 'pm']);
    expect(history.map((l) => l.person_id)).toEqual(['old', 'legend']);
  });
  it('formats terms and initials', () => {
    expect(termRange({ start: '2023-01-01', end: null })).toBe('2023–atual');
    expect(termRange({ start: '1889-11-15', end: '1891-11-23' })).toBe('1889–1891');
    expect(termRange({ start: null, end: null })).toBe('sem datas');
    expect(initials('Luiz Inácio Lula da Silva')).toBe('LI');
    expect(LEADERS.BR!.length).toBeGreaterThan(0);
  });
});

describe('helpers', () => {
  it('translates occupations, falls back to readable original text', () => {
    expect(occupationPt('SOCCER PLAYER')).toBe('Jogador de futebol');
    expect(occupationPt('MILITARY PERSONNEL')).toBe('Militar');
    expect(occupationPt('PUPPETEER')).toBe('Puppeteer');
    expect(occupationPt(null)).toBeNull();
  });
  it('flag preview URL only for a valid ISO2', () => {
    expect(flagPreviewUrl('BR')).toBe('https://flagcdn.com/w80/br.png');
    for (const bad of ['br', 'BRA', 'B/', '../x', '', null]) expect(flagPreviewUrl(bad)).toBeUndefined();
  });
});

describe('Tooltip', () => {
  it('opens on hover and focus, links via aria-describedby, closes with Esc', () => {
    render(<Tooltip text="Explicação curta">{(a) => <button {...a}>alvo</button>}</Tooltip>);
    const btn = screen.getByRole('button', { name: 'alvo' });
    const tip = screen.getByRole('tooltip', { hidden: true });
    expect(btn.getAttribute('aria-describedby')).toBe(tip.id);
    expect(tip.className).not.toContain('is-open');
    fireEvent.mouseEnter(btn.parentElement!);
    expect(tip.className).toContain('is-open');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(tip.className).not.toContain('is-open');
    fireEvent.focus(btn);
    expect(tip.className).toContain('is-open');
  });
});

describe('glossary', () => {
  afterEach(() => vi.restoreAllMocks());
  const names = (c: string) => ({ DE: 'Alemanha' })[c];
  it('Term is plain text without an entry; with one it opens the dialog (paragraphs, clickable examples, sources)', () => {
    const picked: string[] = [];
    const term = { ...GLOSSARY.find((t) => t.id === 'republica-presidencialista')!, body: 'Primeiro.\n\nSegundo.', examples: ['DE'] };
    render(
      <GlossaryProvider terms={[term]} countryName={names} onPickCountry={(c) => picked.push(c)}>
        <Term label="Sem verbete">texto solto</Term>
        <Term id="republica-presidencialista">Regime X</Term>
      </GlossaryProvider>,
    );
    expect(screen.queryByRole('button', { name: 'texto solto' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Regime X/ }));
    const dlg = screen.getByRole('dialog', { hidden: true });
    expect(within(dlg).getByText('Primeiro.')).toBeTruthy();
    expect(within(dlg).getByText('Segundo.')).toBeTruthy();
    expect(within(dlg).getAllByRole('link', { hidden: true }).length).toBeGreaterThan(0); // sources
    fireEvent.click(within(dlg).getByRole('button', { name: 'Alemanha', hidden: true }));
    expect(picked).toEqual(['DE']);
  });
  it('matches regions and memberships by label, accent-insensitive', () => {
    render(
      <GlossaryProvider terms={GLOSSARY} countryName={names} onPickCountry={() => {}}>
        <Term label="america do sul">América do Sul</Term>
      </GlossaryProvider>,
    );
    expect(screen.getByRole('button', { name: /América do Sul/ })).toBeTruthy();
  });
  it('catalog page groups by kind and filters locally', () => {
    render(
      <GlossaryProvider terms={GLOSSARY} countryName={names} onPickCountry={() => {}}>
        <GlossaryPage terms={GLOSSARY} onBack={() => {}} />
      </GlossaryProvider>,
    );
    expect(screen.getByText('Regime político')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Buscar no glossário'), { target: { value: 'teocracia' } });
    expect(screen.queryByText('Região')).toBeNull();
    expect(screen.getByText('Teocracia')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Buscar no glossário'), { target: { value: 'zzzz' } });
    expect(screen.getByText('Nenhum termo encontrado.')).toBeTruthy();
  });
});

describe('CountryPanel v1.1 sections', () => {
  it('BR shows leaders (credit + licence), people with filter + attribution, and clues', async () => {
    const { CountryPanel } = await import('../src/components/CountryPanel');
    render(<CountryPanel iso2="BR" name="Brasil" inApi wide={false} onToggleWide={() => {}} onClose={() => {}} />);
    expect(await screen.findByRole('heading', { name: /Governantes/ })).toBeTruthy();
    expect(screen.getAllByText(/Foto: .* · CC BY 2\.0/).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /mostrar mais/ })).toBeTruthy();
    expect(await screen.findByRole('heading', { name: /Pessoas importantes/ })).toBeTruthy();
    expect(screen.getAllByText('Jogador de futebol').length).toBeGreaterThan(0); // Pelé, translated
    const sports = screen.getByRole('button', { name: 'Esportes' });
    fireEvent.click(sports);
    expect(sports.getAttribute('aria-pressed')).toBe('true');
    expect(screen.queryByText('Escritor')).toBeNull();
    expect(screen.getByText(/CC BY-SA 4\.0/)).toBeTruthy();
    expect(screen.getByText('Pistas')).toBeTruthy();
    expect(screen.getByText('+55')).toBeTruthy();
  });
  it('RS (no leaders, no people, no clues) shows none of the new sections and no error', async () => {
    const { CountryPanel } = await import('../src/components/CountryPanel');
    render(<CountryPanel iso2="RS" name="Sérvia" inApi wide={false} onToggleWide={() => {}} onClose={() => {}} />);
    expect(await screen.findByText('Capital: Belgrado')).toBeTruthy();
    await new Promise((r) => setTimeout(r, 400));
    for (const h of [/Governantes/, /Pessoas importantes/]) expect(screen.queryByRole('heading', { name: h })).toBeNull();
    expect(screen.queryByText('Pistas')).toBeNull(); // GeoGuessr stays (Plonk It guide) but without the clues block
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
