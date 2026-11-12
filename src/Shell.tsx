'use client';
// The app chrome that lives in the root layout (spec 020): globe, readout, layer toggle, footer, glossary dialog.
// The layout stays mounted across /, /pais/[iso2] and /glossario, so the WebGL globe is created once and never remounts.
// Pages render into `children`: the country panel (CountryRoute) or the glossary catalog (GlossaryRoute).
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { CountryDetail, GlossaryTerm } from './api/types';
import { CountryPanel } from './components/CountryPanel';
import { Footer } from './components/Footer';
import { InfoCard } from './components/InfoCard';
import { LayerToggle } from './components/LayerToggle';
import { GlossaryPage, GlossaryProvider } from './glossary';
import { useAtlasData } from './hooks/useAtlasData';
import { flagPreviewUrl } from './lib/url';
import { AtlasProvider, countryPath, selectionFromPath, useAtlas } from './state';
import { idOf } from './types';

// three.js touches window/WebGL at import time: browser only, and in its own chunk (pages without the globe skip ~1 MB).
const Globe = dynamic(() => import('./components/Globe').then((m) => m.Globe), { ssr: false });

const NO_TERMS: never[] = [];

interface ShellCtx {
  data: ReturnType<typeof useAtlasData>['data'];
}
const ShellContext = createContext<ShellCtx>({ data: null });

export function Shell({ children }: { children: ReactNode }) {
  return <AtlasProvider><Chrome>{children}</Chrome></AtlasProvider>;
}

function Chrome({ children }: { children: ReactNode }) {
  // The glossary page covers the whole screen: opened directly, it skips the globe (WebGL + ~550 kB gzip of three.js) and the
  // map files. Once a globe route is visited the globe stays mounted for good.
  const globeRoute = usePathname() !== '/glossario';
  const [wantGlobe, setWantGlobe] = useState(globeRoute);
  useEffect(() => { if (globeRoute) setWantGlobe(true); }, [globeRoute]);
  const { data, error, apiError } = useAtlasData(wantGlobe);
  const { hoveredCountry, selectedCountry, layer, setLayer, setHoveredCountry, setSelectedCountry } = useAtlas();
  const [globeReady, setGlobeReady] = useState(false);
  const [flagsLoading, setFlagsLoading] = useState(false);
  const [stateName, setStateName] = useState<string | null>(null); // hovered state/province of the selected country
  const onGlobeReady = useCallback(() => setGlobeReady(true), []);
  useEffect(() => setStateName(null), [selectedCountry]);

  const active = hoveredCountry ?? selectedCountry;
  const name = data?.features.find((f) => idOf(f) === active)?.properties.NAME;
  const selectedName = data?.features.find((f) => idOf(f) === selectedCountry)?.properties.NAME;

  const countryName = useCallback((iso2: string) => data?.names.get(iso2) ?? data?.features.find((f) => idOf(f) === iso2)?.properties.NAME, [data]);
  const terms = data?.glossary ?? NO_TERMS;
  const hoverFlag = hoveredCountry && data?.knownIds.has(hoveredCountry) ? flagPreviewUrl(hoveredCountry) : undefined;

  return (
    <ShellContext.Provider value={{ data }}>
      <GlossaryProvider terms={terms} countryName={countryName} onPickCountry={setSelectedCountry}>
        {stateName && selectedName ? (
          <InfoCard label={`Estado em ${selectedName}`} name={stateName} />
        ) : (
          <InfoCard label={name ? 'País' : 'Explore o mundo'} name={name ?? 'Atlas'} flagUrl={hoverFlag} />
        )}
        {wantGlobe && !error && !globeReady && (
          <div className="loading-screen" role="status" aria-live="polite">
            <span className="spinner spinner--big" aria-hidden="true" />
            <p>{data ? 'Desenhando o globo…' : 'Carregando mapas e países…'}</p>
          </div>
        )}
        {error && (
          <p className="load-error" role="alert">
            Não foi possível carregar o mapa: {error}
          </p>
        )}
        {apiError && (
          <p className="load-error" role="alert">
            Não foi possível acessar a API do Atlas; os dados dos países estão indisponíveis: {apiError}
          </p>
        )}
        {data && (
          <>
            <Globe
              features={data.features}
              lines={data.lines}
              apiIds={data.knownIds}
              capitals={data.capitals}
              regimes={data.regimes}
              layer={layer}
              hoveredId={hoveredCountry}
              selectedId={selectedCountry}
              onHover={setHoveredCountry}
              onSelect={setSelectedCountry}
              onHoverState={setStateName}
              onReady={onGlobeReady}
              onFlagsLoading={setFlagsLoading}
            />
            <LayerToggle layer={layer} onChange={setLayer} regimes={data.regimes} flagsLoading={flagsLoading}>
              {terms.length > 0 && <Link className="chrome-link" href="/glossario">Glossário</Link>}
            </LayerToggle>
          </>
        )}
        {children}
        <Footer />
      </GlossaryProvider>
    </ShellContext.Provider>
  );
}

/**
 * /pais/[slug]: the panel for the country in the path. `initial` = detail fetched on the server (null = the API has no such
 * country; undefined = the server could not ask, so the panel fetches in the browser).
 */
export function CountryRoute({ slug, initial }: { slug: string; initial: CountryDetail | null | undefined }) {
  const { data } = useContext(ShellContext);
  const { selectedCountry, setSelectedCountry } = useAtlas();
  const id = selectionFromPath(`/pais/${slug}`) ?? slug;
  // A click updates the selection before the new page arrives; the old panel steps aside instead of showing stale data.
  if (selectedCountry !== id) return null;
  const polygonName = data?.features.find((f) => idOf(f) === id)?.properties.NAME;
  const inApi = initial !== undefined ? initial !== null : data ? data.knownIds.has(id) : true;
  return (
    <CountryPanel key={id} iso2={id} name={initial?.name ?? polygonName ?? id} inApi={inApi} initial={initial ?? undefined}
      onClose={() => setSelectedCountry(null)} />
  );
}

/**
 * /glossario: the catalog, server-rendered with the terms and pt-BR country names (for the dialog's examples), so it works
 * without the globe's data. "Back" returns to the country that was selected, if any.
 */
export function GlossaryRoute({ terms, names }: { terms: GlossaryTerm[]; names: Record<string, string> }) {
  const router = useRouter();
  const { selectedCountry, setSelectedCountry } = useAtlas();
  const countryName = useCallback((iso2: string) => names[iso2], [names]);
  return (
    <GlossaryProvider terms={terms} countryName={countryName} onPickCountry={setSelectedCountry}>
      <GlossaryPage terms={terms} onBack={() => router.push(selectedCountry ? countryPath(selectedCountry) : '/')} />
    </GlossaryProvider>
  );
}
