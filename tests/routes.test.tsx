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
