import type { Metadata } from 'next';
import { api } from '@/api';
import { isNotFound } from '@/api/client';
import type { CountryDetail } from '@/api/types';
import { flagPngUrl } from '@/lib/url';
import { CountryRoute } from '@/Shell';

// ISR: prerendered at build for every country the API lists, regenerated at most once an hour.
export const revalidate = 3600;

export async function generateStaticParams() {
  // API down at build time = no prerendered countries; pages are then rendered on first request.
  const list = await api.countries().catch(() => []);
  return list.map((c) => ({ iso2: c.iso2.toLowerCase() }));
}

type Params = { params: Promise<{ iso2: string }> };

/** Detail from the API; null = the API has no such country (404); undefined = it could not be asked (the browser retries). */
async function load(slug: string): Promise<CountryDetail | null | undefined> {
  if (!/^[a-z]{2}$/i.test(slug)) return null; // places without an ISO code are not in the API
  return api.country(slug.toUpperCase()).catch((e: unknown) => (isNotFound(e) ? null : undefined));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { iso2 } = await params;
  const c = await load(iso2);
  if (!c) return { title: decodeURIComponent(iso2).toUpperCase() };
  const description = c.summary ?? `${c.name}: capital, população, regime, governantes e história no Atlas.`;
  const flag = flagPngUrl(c.flag_url);
  const images = flag ? [{ url: flag, alt: `Bandeira: ${c.name}` }] : undefined;
  return {
    title: c.name,
    description,
    alternates: { canonical: `/pais/${c.iso2.toLowerCase()}` },
    openGraph: { title: `${c.name} · Atlas`, description, type: 'article', locale: 'pt_BR', images },
    twitter: { card: flag ? 'summary_large_image' : 'summary', title: `${c.name} · Atlas`, description, images: flag ? [flag] : undefined },
  };
}

export default async function CountryPage({ params }: Params) {
  const { iso2 } = await params;
  return <CountryRoute slug={iso2} initial={await load(iso2)} />;
}
