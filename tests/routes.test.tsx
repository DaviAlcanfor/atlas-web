import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { COUNTRIES } from '../src/api/mocks/fixtures';
import { CountryPanel } from '../src/components/CountryPanel';
import { countryPath, selectionFromPath } from '../src/state';

describe('selection <-> path (spec 020)', () => {
  it('maps ids to paths and back', () => {
    expect(countryPath('BR')).toBe('/pais/br');
    expect(countryPath('N. Cyprus')).toBe('/pais/N.%20Cyprus');
    expect(selectionFromPath('/pais/br')).toBe('BR');
    expect(selectionFromPath('/pais/N.%20Cyprus')).toBe('N. Cyprus');
    expect(selectionFromPath('/')).toBeNull();
    expect(selectionFromPath('/glossario')).toBeUndefined(); // keeps the selection underneath
    for (const id of ['JP', 'Somaliland']) expect(selectionFromPath(countryPath(id))).toBe(id);
  });
  it('the panel renders server-fetched data at once, without a loading state', () => {
    const br = COUNTRIES.find((c) => c.iso2 === 'BR')!;
    render(<CountryPanel iso2="BR" name="Brasil" inApi initial={br} onClose={() => {}} />);
    expect(screen.getByText((_, el) => el?.tagName === 'LI' && el.textContent === 'Capital: Brasília')).toBeTruthy();
    expect(screen.queryByLabelText('Carregando dados do país')).toBeNull();
  });
});

describe('accessibility (spec 037 B)', () => {
  it('country panel headings start at h1 and never skip a level', () => {
    const br = COUNTRIES.find((c) => c.iso2 === 'BR')!;
    const { container } = render(<CountryPanel iso2="BR" name="Brasil" inApi initial={br} onClose={() => {}} />);
    const levels = [...container.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) => Number(h.tagName[1]));
    expect(levels[0]).toBe(1);
    expect(levels.filter((l) => l === 1)).toHaveLength(1);
    levels.forEach((l, i) => i && expect(l - levels[i - 1]!).toBeLessThanOrEqual(1));
  });
});
