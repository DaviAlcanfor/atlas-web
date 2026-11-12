import type { Metadata } from 'next';
import { Suspense } from 'react';
import { api } from '@/api';
import { isNotFound } from '@/api/client';
import type { CurrencyDetail } from '@/api/types';
import { CurrencyRoute } from '@/components/CurrencyPage';
import { parseCode } from '@/lib/currency';

// Built on demand (not prerendered): any ISO 4217 code a country uses, cached for an hour.
export const revalidate = 3600;

type Params = { params: Promise<{ code: string }> };

/** Detail from the API; null = no country uses the code (404/invalid); undefined = it could not be asked (the browser retries). */
async function load(slug: string): Promise<CurrencyDetail | null | undefined> {
  const code = parseCode(slug);
  if (!code) return null;
  return api.currency(code).catch((e: unknown) => (isNotFound(e) ? null : undefined));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { code } = await params;
  const c = await load(code);
  if (!c) return { title: code.toUpperCase() };
  const description = `${c.name} (${c.code}): cotação contra outras moedas, estado da moeda, economia do país e comparação entre países. Cotação de referência.`;
  return { title: `${c.name} (${c.code})`, description, alternates: { canonical: `/moeda/${c.code.toLowerCase()}` }, openGraph: { title: `${c.name} · Atlas`, description } };
}

export default async function CurrencyPage({ params }: Params) {
  const { code } = await params;
  return (
    <Suspense>
      <CurrencyRoute code={parseCode(code) ?? code.toUpperCase()} initial={await load(code)} />
    </Suspense>
  );
}
