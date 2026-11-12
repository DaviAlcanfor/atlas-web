import type { Metadata } from 'next';
import { api } from '@/api';
import { GlossaryRoute } from '@/Shell';

export const revalidate = 3600;
export const metadata: Metadata = {
  title: 'Glossário',
  description: 'Regimes, sistemas de governo, regiões e organizações explicados em linguagem simples.',
};

export default async function Glossary() {
  // v1.1 endpoint: production may still be v1.0 (404) -> the page says the glossary is unavailable.
  const [terms, countries] = await Promise.all([api.glossary().catch(() => []), api.countries().catch(() => [])]);
  return <GlossaryRoute terms={terms} names={Object.fromEntries(countries.map((c) => [c.iso2, c.name]))} />;
}
