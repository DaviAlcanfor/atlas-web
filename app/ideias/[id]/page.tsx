import type { Metadata } from 'next';
import { api } from '@/api';
import { isNotFound } from '@/api/client';
import type { IdeologyDetail } from '@/api/types';
import { IdeologyPage } from '@/components/IdeologyPage';

// spec 018: a political current worldwide. Built on demand, cached for an hour.
export const revalidate = 3600;

type Params = { params: Promise<{ id: string }> };

/** null = no such current (404 / unavailable endpoint); the page says so. */
async function load(id: string): Promise<IdeologyDetail | null> {
  if (!/^[a-z-]{2,40}$/.test(id)) return null;
  return api.ideology(id).catch((e: unknown) => (isNotFound(e) ? null : null));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const d = await load(id);
  if (!d) return { title: 'Corrente política' };
  return { title: d.term.label, description: d.term.short, alternates: { canonical: `/ideias/${id}` },
    openGraph: { title: `${d.term.label} · Atlas`, description: d.term.short, locale: 'pt_BR' } };
}

export default async function Page({ params }: Params) {
  const { id } = await params;
  const [d, countries] = await Promise.all([load(id), api.countries().catch(() => [])]);
  return <IdeologyPage detail={d} names={Object.fromEntries(countries.map((c) => [c.iso2, c.name]))} />;
}
