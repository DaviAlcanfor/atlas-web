import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { EconomyCountry } from '@/components/EconomyPages';

type Params = { params: Promise<{ iso2: string }> };

// Built on demand: the page fetches its numbers in the browser.
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { iso2 } = await params;
  return { title: `Economia: ${iso2.toUpperCase()}`, alternates: { canonical: `/economia/${iso2.toLowerCase()}` } };
}

export default async function CountryEconomyPage({ params }: Params) {
  const { iso2 } = await params;
  if (!/^[A-Za-z]{2}$/.test(iso2)) notFound();
  return <EconomyCountry iso2={iso2.toUpperCase()} />;
}
