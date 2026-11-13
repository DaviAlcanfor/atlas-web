'use client';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { LayerId } from './types';

interface AtlasCtx {
  selectedCountry: string | null;
  hoveredCountry: string | null;
  layer: LayerId;
  setSelectedCountry: (id: string | null) => void;
  setHoveredCountry: (id: string | null) => void;
  setLayer: (l: LayerId) => void;
}

const Ctx = createContext<AtlasCtx | null>(null);

// Selection <-> path (spec 020): ISO ids are lowercased (/pais/br); ids of places without an ISO code are the polygon name.
export const countryPath = (id: string) => `/pais/${encodeURIComponent(/^[A-Z]{2}$/.test(id) ? id.toLowerCase() : id)}`;
/** Country id in a path; null = no country (home); undefined = a page that keeps the current selection (glossary). */
export function selectionFromPath(path: string): string | null | undefined {
  const m = /^\/pais\/([^/]+)(?:\/[^/]+)?\/?$/.exec(path); // /pais/br or /pais/br/sp (spec 024: a state of the country)
  if (!m) return path === '/' ? null : undefined;
  let slug = m[1]!;
  try { slug = decodeURIComponent(slug); } catch { /* keep raw */ }
  return /^[a-z]{2}$/i.test(slug) ? slug.toUpperCase() : slug;
}

/** spec 024: state slug of /pais/br/sp ("sp"), else null. */
export const stateSlugFromPath = (path: string) => /^\/pais\/[^/]+\/([^/]+)\/?$/.exec(path)?.[1]?.toLowerCase() ?? null;
/** spec 024: path of a state from its ISO 3166-2 code ("BR-SP" -> /pais/br/sp); null when the code has no dash. */
export const statePath = (iso2: string, code: string | null | undefined) =>
  code?.includes('-') ? `${countryPath(iso2)}/${encodeURIComponent(code.split('-').slice(1).join('-').toLowerCase())}` : null;

export function AtlasProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const fromPath = selectionFromPath(pathname);
  const [selectedCountry, setSelected] = useState<string | null>(fromPath ?? null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [layer, setLayer] = useState<LayerId>('content');

  // Back/forward and links change the path; clicks set the selection first (the globe reacts at once) and then navigate.
  useEffect(() => { if (fromPath !== undefined) setSelected(fromPath); }, [fromPath]);
  const setSelectedCountry = useCallback((id: string | null) => {
    setSelected(id);
    router.push(id ? countryPath(id) : '/', { scroll: false });
  }, [router]);

  // Old hash URLs (#c=BR, #/glossario) from the Vite SPA keep working.
  useEffect(() => {
    const h = location.hash;
    const c = new URLSearchParams(h.slice(1)).get('c');
    if (h === '#/glossario') router.replace('/glossario');
    else if (c) router.replace(countryPath(c));
  }, [router]);

  const value = { selectedCountry, hoveredCountry, layer, setSelectedCountry, setHoveredCountry, setLayer };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAtlas() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAtlas outside AtlasProvider');
  return v;
}
