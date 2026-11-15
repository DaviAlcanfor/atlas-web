import type { Metadata } from 'next';
import { Suspense } from 'react';
import { NewsPage } from '@/components/News';

export const metadata: Metadata = {
  title: 'Notícias do mundo',
  description: 'Conflitos, diplomacia, eleições, sanções e acordos: manchetes geopolíticas das últimas semanas, por país e por tipo.',
  alternates: { canonical: '/noticias' },
};

export default function Page() {
  return <Suspense><NewsPage /></Suspense>;
}
