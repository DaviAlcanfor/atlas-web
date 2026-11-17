import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import subdivisions from '../src/api/mocks/subdivisions.json';
import { parse } from '../src/api/client';
import * as S from '../src/api/schemas';
import { SubdivisionCard } from '../src/components/SubdivisionCard';

describe('state card, spec 024 phase 2 (CR-011)', () => {
  const br = parse(S.SubdivisionList, subdivisions.BR, 'BR');
  const jp = parse(S.SubdivisionList, subdivisions.JP, 'JP');

  it('shows HDI with its credit and the head with a link to its Wikipedia source', () => {
    const sp = br.items.find((x) => x.code === 'BR-SP')!;
    const { container } = render(<SubdivisionCard name="São Paulo" facts={sp} sources={br.sources} onClose={() => {}} />);
    expect(screen.getByText('IDH').nextSibling?.textContent).toBe(`${sp.hdi!.value.toLocaleString('pt-BR', { minimumFractionDigits: 3 })} (2023)`);
    expect(screen.getByText('Governador').nextSibling?.textContent).toMatch(/^Tarcísio de Freitas \(desde 01\/01\/2023\)$/);
    expect(container.textContent).toContain('Global Data Lab (Smits & Permanyer), Radboud University');
    const link = screen.getByRole('link', { name: /Lista de governadores/ });
    expect(link.getAttribute('href')).toBe(br.sources.find((s) => s.id === 'wikipedia-heads-br')!.url);
  });

  it('shows nothing extra when the state has neither', () => {
    const s = jp.items[0]!;
    expect(s.hdi ?? null).toBeNull();
    const { container } = render(<SubdivisionCard name={s.name} facts={s} sources={jp.sources} onClose={() => {}} />);
    expect(screen.queryByText('IDH')).toBeNull();
    expect(screen.queryByText('Governador')).toBeNull();
    expect(container.textContent).not.toContain('Global Data Lab');
    expect(screen.queryByRole('link')).toBeNull();
  });
});
