// spec 035: chat answers with markdown tables render as a real table (owner's example), alignment from the |---:| line.
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Markdown } from '../src/components/Markdown';

const TEXT = `Comparação:

| Indicador | Bolsonaro | Lula |
|---|---:|---:|
| Crescimento do PIB | 1,4% ao ano | 3,0% ao ano |
| Inflação | **6,1%** ao ano | 4,7% ao ano |

Fonte: [Banco Mundial](https://data.worldbank.org).`;

describe('Markdown tables', () => {
  it('renders header, rows, right alignment and inline markup in cells, with text around', () => {
    render(<Markdown text={TEXT} onLink={() => {}} />);
    const headers = screen.getAllByRole('columnheader').map((h) => h.textContent);
    expect(headers).toEqual(['Indicador', 'Bolsonaro', 'Lula']);
    expect(screen.getAllByRole('row')).toHaveLength(3);
    expect(screen.getByText('1,4% ao ano').style.textAlign).toBe('right');
    expect(screen.getByText('6,1%').tagName).toBe('STRONG');
    expect(screen.getByText('Comparação:').tagName).toBe('P');
    expect(screen.getByRole('link', { name: 'Banco Mundial' })).toBeTruthy();
    expect(screen.queryByText(/\|---/)).toBeNull();
  });
});
