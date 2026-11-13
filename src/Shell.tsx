'use client';
// The app chrome that lives in the root layout (spec 020): globe, readout, layer toggle, footer, glossary dialog.
// The layout stays mounted across /, /pais/[iso2] and /glossario, so the WebGL globe is created once and never remounts.
// Pages render into `children`: the country panel (CountryRoute) or the glossary catalog (GlossaryRoute).
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from './api';
import type { CountryDetail, GlossaryTerm, Subdivision } from './api/types';
import type { StateRef } from './components/Globe';
import { useAsync } from './hooks/useAsync';
import { CountryPanel } from './components/CountryPanel';
import { Footer } from './components/Footer';
import { InfoCard } from './components/InfoCard';
import { LoadingScreen } from './components/LoadingScreen';
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
  state: { ref: StateRef; facts: Subdivision | undefined } | null; // spec 024: clicked state of the selected country
  clearState: () => void;
}
const ShellContext = createContext<ShellCtx>({ data: null, state: null, clearState: () => {} });

export function Shell({ children }: { children: ReactNode }) {
  return <AtlasProvider><Chrome>{children}</Chrome></AtlasProvider>;
}

function Chrome({ children }: { children: ReactNode }) {
  // The glossary page covers the whole screen: opened directly, it skips the globe (WebGL + ~550 kB gzip of three.js) and the
  // map files. Once a globe route is visited the globe stays mounted for good.
  const path = usePathname();
  const globeRoute = path !== '/glossario' && !path.startsWith('/moeda/'); // full-page routes skip the globe when opened directly
  const [wantGlobe, setWantGlobe] = useState(globeRoute);
  useEffect(() => { if (globeRoute) setWantGlobe(true); }, [globeRoute]);
  const { data, error, apiError, progress } = useAtlasData(wantGlobe);
  const [chunkReady, setChunkReady] = useState(false); // the globe's code (three.js chunk) has arrived
  useEffect(() => { if (wantGlobe) void import('./components/Globe').then(() => setChunkReady(true)); }, [wantGlobe]);
  const { hoveredCountry, selectedCountry, layer, setLayer, setHoveredCountry, setSelectedCountry } = useAtlas();
  const [globeReady, setGlobeReady] = useState(false);
  const [flagsLoading, setFlagsLoading] = useState(false);
  const [showStates, setShowStates] = useState(false); // spec 023: off by default; the button unlocks the clickable divisions
  const [hoverState, setHoverState] = useState<StateRef | null>(null); // hovered state/province of the selected country
  const [pickedState, setPickedState] = useState<StateRef | null>(null); // spec 024: clicked state
  const onGlobeReady = useCallback(() => setGlobeReady(true), []);
  useEffect(() => { setHoverState(null); setPickedState(null); }, [selectedCountry, showStates]);
  const clearState = useCallback(() => setPickedState(null), []);
  // spec 024: the selected country's state facts + flags, only while "Estados" is on; any failure = polygon names, no flags
  const subsReq = useAsync(() => api.subdivisions(selectedCountry!), selectedCountry && showStates ? selectedCountry : null);
  const subs = useMemo(() => new Map(subsReq.status === 'ok' ? subsReq.data.items.map((x) => [x.wikidata_id, x]) : []), [subsReq]);
  const factsOf = (s: StateRef | null) => (s?.id ? subs.get(s.id) : undefined);
  const stateFlags = useMemo(() => new Map([...subs].flatMap(([id, x]): [string, string][] => (x.flag ? [[id, x.flag.url]] : []))), [subs]);

  const active = hoveredCountry ?? selectedCountry;
  const countryName = useCallback((iso2: string) => data?.names.get(iso2) ?? data?.features.find((f) => idOf(f) === iso2)?.properties.NAME, [data]);
  const name = active ? countryName(active) : undefined; // pt-BR name from the API, Natural Earth's English one as fallback
  const selectedName = selectedCountry ? countryName(selectedCountry) : undefined;
  const terms = data?.glossary ?? NO_TERMS;
  const hoverFlag = hoveredCountry && data?.knownIds.has(hoveredCountry) ? flagPreviewUrl(hoveredCountry) : undefined;

  return (
    <ShellContext.Provider value={{ data, state: pickedState ? { ref: pickedState, facts: factsOf(pickedState) } : null, clearState }}>
      <GlossaryProvider terms={terms} countryName={countryName} onPickCountry={setSelectedCountry}>
        {hoverState && selectedName ? (
          <InfoCard label={`Estado em ${selectedName}`} name={factsOf(hoverState)?.name ?? hoverState.name} flagUrl={factsOf(hoverState)?.flag?.url} />
        ) : (
          <InfoCard label={name ? 'País' : 'Explore o mundo'} name={name ?? 'Atlas'} flagUrl={hoverFlag} />
        )}
        {wantGlobe && !error && (
          <LoadingScreen
            target={0.4 * progress.geo + 0.15 * (progress.countries ? 1 : 0) + 0.15 * (chunkReady ? 1 : 0)}
            rendering={!!data}
            done={globeReady}
            countries={progress.countries}
          />
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
            <div className={selectedCountry && globeRoute ? 'globe-slot globe-slot--panel' : 'globe-slot'}>
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
              onHoverState={setHoverState}
              selectedStateId={pickedState?.id ?? null}
              onSelectState={setPickedState}
              stateFlags={stateFlags}
              showStates={showStates}
              onReady={onGlobeReady}
              onFlagsLoading={setFlagsLoading}
            />
            </div>
            <LayerToggle layer={layer} onChange={setLayer} regimes={data.regimes} flagsLoading={flagsLoading}
              states={selectedCountry ? { on: showStates, toggle: () => setShowStates((s) => !s) } : undefined}>
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
  const { data, state, clearState } = useContext(ShellContext);
  const { selectedCountry, setSelectedCountry } = useAtlas();
  const id = selectionFromPath(`/pais/${slug}`) ?? slug;
  // A click updates the selection before the new page arrives; the old panel steps aside instead of showing stale data.
  if (selectedCountry !== id) return null;
  const feature = data?.features.find((f) => idOf(f) === id);
  const polygonName = feature?.properties.NAME;
  const inApi = initial !== undefined ? initial !== null : data ? data.knownIds.has(id) : true;
  return (
    <CountryPanel key={id} iso2={id} name={initial?.name ?? polygonName ?? id} inApi={inApi} initial={initial ?? undefined} lat={feature?.properties.lat}
      subdivision={state ?? undefined} onCloseSubdivision={clearState}
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
