import type { Metadata } from 'next';
import { api } from '@/api';
import { isNotFound } from '@/api/client';
import type { CountryDetail } from '@/api/types';
import { CountryRoute } from '@/Shell';

// spec 024: /pais/br/sp = Brazil with "Estados" on and São Paulo selected (the Shell reads the path). Not prerendered: rendered on
// the first request and cached for an hour (3,754 subdivisions would make the build call the API thousands of times).
export const revalidate = 3600;

type Params = { params: Promise<{ iso2: string; sub: string }> };

async function load(slug: string): Promise<CountryDetail | null | undefined> {
  if (!/^[a-z]{2}$/i.test(slug)) return null;
  return api.country(slug.toUpperCase()).catch((e: unknown) => (isNotFound(e) ? null : undefined));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { iso2, sub } = await params;
  const code = `${iso2}-${decodeURIComponent(sub)}`.toUpperCase();
  const [c, subs] = await Promise.all([load(iso2), api.subdivisions(iso2.toUpperCase()).catch(() => null)]);
  const s = subs?.items.find((x) => x.code === code);
  const title = s && c ? `${s.name} · ${c.name}` : c?.name ?? code;
  const description = s && c ? `${s.name}, ${c.name}: capital, população, área e bandeira no Atlas.` : undefined;
  return {
    title, description, alternates: { canonical: `/pais/${iso2.toLowerCase()}/${sub.toLowerCase()}` },
    openGraph: { title: `${title} · Atlas`, description, locale: 'pt_BR', images: s?.flag ? [{ url: s.flag.url, alt: `Bandeira: ${s.name}` }] : undefined },
  };
}

export default async function SubdivisionPage({ params }: Params) {
  const { iso2 } = await params;
  return <CountryRoute slug={iso2} initial={await load(iso2)} />;
}
