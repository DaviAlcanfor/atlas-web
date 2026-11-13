import type { Metadata } from 'next';
import { EconomyHub } from '@/components/EconomyPages';

export const metadata: Metadata = {
  title: 'Economia do mundo',
  description: 'Escolha um país ou uma moeda: PIB, preços, emprego, dívida, desigualdade, câmbio e comparação entre países.',
  alternates: { canonical: '/economia' },
};

export default function EconomyPage() {
  return <EconomyHub />;
}
